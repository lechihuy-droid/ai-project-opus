import { generateSchedule, suggestDailyGoal, daysBetween } from "./plan.js";
import { requiredCount } from "./quiz.js";
import {
  explainWrongAnswer,
  PROVIDERS, PROVIDER_STORAGE, getProvider,
  GEMINI_KEY_STORAGE, GEMINI_MODEL_STORAGE, GEMINI_MODELS, getGeminiModel,
  COPILOT_TOKEN_STORAGE, COPILOT_MODEL_STORAGE, COPILOT_MODELS, getCopilotModel,
} from "./gemini.js";

// Pure rendering helpers. Controllers in app.js wire events.

const el = (tag, attrs = {}, children = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(n.dataset, v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return n;
};

// QuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹nh smart CTA chÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nh trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn hero: ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°u tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn theo phase + state.
function pickPrimaryCta(stats, plan) {
  const goal = plan?.dailyGoal || 30;
  const done = stats.todayAnswered || 0;
  const remain = Math.max(0, goal - done);

  if (!plan) {
    return { label: "Set study plan", action: "settings", sub: "Choose your exam date so the app can plan the sprint" };
  }
  if (done >= goal) {
    if (stats.wrongCount > 0) return { label: `Review ${Math.min(10, stats.wrongCount)} wrong`, action: "review", sub: "Daily goal done - use bonus time for retention" };
    return { label: "View today stats", action: "stats", sub: `Completed ${done}/${goal} questions today` };
  }
  if (plan.phase === "Review" && stats.wrongCount >= 5) {
    return { label: `Review ${Math.min(20, stats.wrongCount)} wrong`, action: "review", sub: `${remain} questions left for today's goal` };
  }
  if (plan.phase === "Mock") {
    return { label: "Take 60-question mock", action: "practice", sub: "Timed exam-pressure practice" };
  }
  if (plan.phase === "Taper" && stats.wrongCount > 0) {
    return { label: `Light review ${Math.min(10, stats.wrongCount)} wrong`, action: "review", sub: "Keep sharp without heavy study" };
  }
  return { label: `Practice ${remain} new questions`, action: "practice", sub: `${done}/${goal} questions today` };
}

function ringProgress(pctDone) {
  const size = 88, stroke = 9, r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, pctDone / 100));
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", size); svg.setAttribute("height", size);
  svg.setAttribute("class", "ring");
  const bg = document.createElementNS(svgNS, "circle");
  bg.setAttribute("cx", size/2); bg.setAttribute("cy", size/2); bg.setAttribute("r", r);
  bg.setAttribute("class", "ring-bg");
  const fg = document.createElementNS(svgNS, "circle");
  fg.setAttribute("cx", size/2); fg.setAttribute("cy", size/2); fg.setAttribute("r", r);
  fg.setAttribute("class", "ring-fg");
  fg.setAttribute("stroke-dasharray", String(c));
  fg.setAttribute("stroke-dashoffset", String(off));
  fg.setAttribute("transform", `rotate(-90 ${size/2} ${size/2})`);
  svg.appendChild(bg); svg.appendChild(fg);
  return svg;
}

export function renderHome({ stats, plan, tasks, weak, activity }, handlers) {
  const root = el("div");
  const cta = pickPrimaryCta(stats, plan);
  const goal = plan?.dailyGoal || 30;
  const done = stats.todayAnswered || 0;
  const pctToday = Math.min(100, Math.round((done / goal) * 100));

  const runCta = () => {
    if (cta.action === "review") return handlers.onStartReview();
    if (cta.action === "practice") return handlers.onStartPractice();
    if (cta.action === "settings") return handlers.onOpenSettings();
    if (cta.action === "stats") return handlers.onGoStats();
  };

  // ===== 1. Hero =====
  const examStr = plan
    ? new Date(plan.examDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";

  const hero = el("section", { class: "hero" }, [
    el("div", { class: "hero-left" }, [
      el("div", { class: "hero-countdown" }, [
        el("div", { class: "count-num" }, plan ? String(plan.daysLeft) : "-"),
        el("div", { class: "count-lbl" }, [
          el("div", {}, "days until exam"),
          plan ? el("div", { class: "count-sub" }, `Exam date ${examStr}`) : null,
        ]),
        plan ? el("span", { class: "phase-chip" }, plan.phase) : null,
      ]),
      el("div", { class: "hero-cta" }, [
        el("button", { class: "btn btn-lg", onclick: runCta }, [
          el("span", { class: "btn-play-icon" }, ">"),
          el("span", {}, " " + cta.label),
        ]),
        el("div", { class: "cta-sub muted" }, cta.sub),
      ]),
      el("div", { class: "streak-line muted" },
        stats.streak > 0
          ? `Streak ${stats.streak} days - keep it today`
          : "Start your first streak today"),
    ]),
    el("div", { class: "hero-right" }, [
      ringProgress(pctToday),
      el("div", { class: "ring-label" }, [
        el("div", { class: "ring-val" }, `${done}/${goal}`),
        el("div", { class: "muted ring-sub" }, "questions today"),
      ]),
    ]),
  ]);
  root.appendChild(hero);

  // ===== 2. Stacked progress bar =====
  const seen = stats.seenCount || 0;
  const wrong = stats.wrongCount || 0;
  const correct = Math.max(0, seen - wrong);
  const total = stats.totalQuestions || 1;
  const pct = (n) => (n / total) * 100;
  root.appendChild(el("section", { class: "coverage" }, [
    el("div", { class: "cov-head" }, [
      el("span", { class: "muted" }, "Total coverage"),
      el("span", {}, `${seen}/${total} questions - ${stats.accuracy}% accuracy`),
    ]),
    el("div", { class: "cov-bar" }, [
      el("div", { class: "cov-seg cov-correct", style: `width:${pct(correct)}%` }),
      el("div", { class: "cov-seg cov-wrong", style: `width:${pct(wrong)}%` }),
    ]),
    el("div", { class: "cov-legend muted" }, [
      el("span", {}, `Correct ${correct}`),
      el("span", {}, `Review ${wrong}`),
      el("span", {}, `Unseen ${total - seen}`),
    ]),
  ]));

  // ===== 3. Today task list =====
  if (plan) {
    const todayCard = el("section", { class: "card" }, [
      el("div", { class: "plan-head" }, [
        el("h2", {}, "Today"),
        el("span", { class: "phase-chip small" }, `${plan.phase} - ${plan.domainFocus}`),
      ]),
      el("p", { class: "muted" }, plan.focus),
    ]);
    const list = el("div", { class: "task-list" });
    if (tasks.length === 0) {
      list.appendChild(el("div", { class: "empty" }, "No tasks today"));
    }
    for (const t of tasks) {
      const estimate = t.label.match(/(\d+)\s*(?:questions|cau)/i);
      const mins = estimate ? Math.round(parseInt(estimate[1], 10) * 0.8) : null;
      list.appendChild(el("div", { class: "task" + (t.done ? " done" : "") }, [
        el("div", { class: "task-check" + (t.done ? " checked" : "") }, t.done ? "ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ" : ""),
        el("div", { class: "task-body" }, [
          el("div", { class: "task-label" }, t.label),
          el("div", { class: "task-detail muted" }, [
            t.detail || "",
            mins ? el("span", { class: "task-eta" }, ` - approx ${mins} min`) : null,
          ]),
        ]),
        t.done
          ? el("span", { class: "badge-done" }, "Done")
          : el("button", {
              class: "btn btn-sm",
              onclick: () => t.action === "review" ? handlers.onStartReview() : handlers.onStartPractice(),
            }, "Start"),
      ]));
    }
    todayCard.appendChild(list);
    root.appendChild(todayCard);
  } else {
    root.appendChild(el("section", { class: "card setup-cta" }, [
      el("h2", {}, "Set study plan"),
      el("p", { class: "muted" }, "Choose your exam date so the app can split phases and suggest a daily question goal."),
      el("button", { class: "btn", onclick: handlers.onOpenSettings }, "Set plan"),
    ]));
  }

  // ===== 4. 7-day heatmap =====
  if (activity && activity.length) {
    const maxC = Math.max(1, ...activity.map((a) => a.count));
    const heat = el("div", { class: "heatmap" });
    const dayLbl = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    for (const a of activity) {
      const d = new Date(a.date);
      const level = a.count === 0 ? 0 : Math.min(4, Math.ceil((a.count / maxC) * 4));
      heat.appendChild(el("div", { class: `heat-cell lvl-${level}`, title: `${a.date}: ${a.count} questions` }, [
        el("div", { class: "heat-day" }, dayLbl[d.getDay()]),
        el("div", { class: "heat-num" }, String(a.count)),
        el("div", { class: "heat-date" }, String(d.getDate())),
      ]));
    }
    root.appendChild(el("section", { class: "card heat-card" }, [
      el("div", { class: "section-row" }, [
        el("h3", {}, "Last 7 days"),
        el("span", { class: "muted" }, `${activity.reduce((n, a) => n + a.count, 0)} questions this week`),
      ]),
      heat,
    ]));
  }

  // ===== 5. Weak domain =====
  if (weak && weak.total >= 10) {
    root.appendChild(el("section", { class: "card weak-card" }, [
      el("div", { class: "weak-head" }, [
        el("div", {}, [
          el("div", { class: "weak-label muted" }, "Weak domain"),
          el("div", { class: "weak-title" }, `${weak.domain} - ${weak.pct}% correct`),
          el("div", { class: "muted small" }, `${weak.correct}/${weak.total} answered in this domain`),
        ]),
        el("button", {
          class: "btn",
          onclick: () => handlers.onStartDomain ? handlers.onStartDomain(weak.domain) : handlers.onStartPractice(),
        }, "Practice 15"),
      ]),
    ]));
  }

  // ===== 6. Mode cards compact =====
  const modes = el("section", { class: "mode-row" });
  modes.appendChild(el("button", { class: "mode-mini", onclick: () => handlers.onStartPractice() }, [
    el("span", { class: "mini-ic" }, "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¹Ã…â€œ"),
    el("div", {}, [ el("div", { class: "mini-t" }, "Practice 15"), el("div", { class: "mini-s muted" }, "ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u ngÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â«u nhiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn") ]),
  ]));
  const revBtn = el("button", {
    class: "mode-mini" + (stats.wrongCount === 0 ? " dim" : ""),
    onclick: () => stats.wrongCount > 0 && handlers.onStartReview(),
  }, [
    el("span", { class: "mini-ic" }, "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â"),
    el("div", {}, [
      el("div", { class: "mini-t" }, "ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Ân cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u sai"),
      el("div", { class: "mini-s muted" }, stats.wrongCount > 0 ? `${stats.wrongCount} cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u trong danh sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ch` : "ChÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u sai"),
    ]),
  ]);
  modes.appendChild(revBtn);
  modes.appendChild(el("button", { class: "mode-mini", onclick: () => handlers.onStartMock ? handlers.onStartMock() : handlers.onStartPractice() }, [
    el("span", { class: "mini-ic" }, "ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€šÃ‚Â±ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â"),
    el("div", {}, [ el("div", { class: "mini-t" }, "Mock exam"), el("div", { class: "mini-s muted" }, "60 cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u liÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥c") ]),
  ]));
  modes.appendChild(el("button", { class: "mode-mini weak-mode", onclick: () => handlers.onOpenWeakness ? handlers.onOpenWeakness() : handlers.onStartPractice() }, [
    el("span", { class: "mini-ic" }, "!"),
    el("div", {}, [
      el("div", { class: "mini-t" }, "Weak 360"),
      el("div", { class: "mini-s muted" }, "Practice 15"),
    ]),
  ]));
  root.appendChild(modes);

  return root;
}

export function renderWeaknessDashboard({ stats, categoryStats, totalQuestions }, handlers) {
  const seen = stats.seenCount || 0;
  const wrong = stats.wrongCount || 0;
  const correct = Math.max(0, seen - wrong);
  const unseen = Math.max(0, totalQuestions - seen);
  const pctSeen = totalQuestions ? Math.round((seen / totalQuestions) * 100) : 0;

  const root = el("div");
  root.appendChild(el("section", { class: "card weak-hero" }, [
    el("div", {}, [
      el("div", { class: "weak-eyebrow" }, "Personal weak-area drill"),
      el("h2", {}, "Weak 360"),
      el("p", { class: "muted" },
        "360 cau duoc chon tu error database cua ban: stakeholder sequencing, governance, authority boundary, communication, agile value, risk/opportunity, escalation traps."),
    ]),
    el("div", { class: "weak-hero-actions" }, [
      el("button", { class: "btn btn-lg", onclick: () => handlers.onStart(30) }, "Start 30"),
      el("button", { class: "btn secondary", onclick: () => handlers.onSetup() }, "Chon so cau"),
      el("button", {
        class: "btn secondary",
        disabled: wrong === 0 ? "" : null,
        onclick: () => wrong > 0 && handlers.onReviewWrong(),
      }, wrong > 0 ? `On ${wrong} cau sai` : "Chua co cau sai"),
    ]),
  ]));

  root.appendChild(el("section", { class: "weak-metrics" }, [
    metricBox(`${seen}/${totalQuestions}`, "Da lam", `${pctSeen}% coverage`),
    metricBox(`${correct}`, "Dang giu dung", "unique correct"),
    metricBox(`${wrong}`, "Can on lai", "wrong list rieng"),
    metricBox(`${stats.accuracy}%`, "Accuracy", `${stats.totalAnswered} luot tra loi`),
  ]));

  root.appendChild(el("section", { class: "card" }, [
    el("div", { class: "cov-head" }, [
      el("span", { class: "muted" }, "Tien do Weak 360"),
      el("span", {}, `${unseen} cau chua lam`),
    ]),
    el("div", { class: "cov-bar" }, [
      el("div", { class: "cov-seg cov-correct", style: `width:${totalQuestions ? (correct / totalQuestions) * 100 : 0}%` }),
      el("div", { class: "cov-seg cov-wrong", style: `width:${totalQuestions ? (wrong / totalQuestions) * 100 : 0}%` }),
    ]),
    el("div", { class: "cov-legend muted" }, [
      el("span", {}, `Dung ${correct}`),
      el("span", {}, `Sai ${wrong}`),
      el("span", {}, `Chua lam ${unseen}`),
    ]),
  ]));

  const grid = el("div", { class: "weak-category-grid" });
  for (const c of categoryStats) {
    const done = c.seen || 0;
    const pct = c.total ? Math.round((done / c.total) * 100) : 0;
    grid.appendChild(el("button", { class: "weak-category", onclick: () => handlers.onStartCategory(c.name, 20) }, [
      el("div", { class: "weak-cat-head" }, [
        el("strong", {}, c.name.replaceAll("-", " ")),
        el("span", {}, `${done}/${c.total}`),
      ]),
      el("div", { class: "weak-cat-bar" }, [
        el("div", { style: `width:${pct}%` }),
      ]),
      el("div", { class: "muted small" }, `${pct}% done - ${c.wrong || 0} wrong`),
    ]));
  }
  root.appendChild(el("section", { class: "card" }, [
    el("div", { class: "section-row" }, [
      el("h3", {}, "Practice by weakness"),
      el("button", { class: "btn btn-sm secondary", onclick: handlers.onReset }, "Reset weak tracking"),
    ]),
    grid,
  ]));

  return root;
}

function metricBox(value, label, sub) {
  return el("div", { class: "stat-box" }, [
    el("div", { class: "num" }, value),
    el("div", { class: "lbl" }, label),
    sub ? el("div", { class: "muted small" }, sub) : null,
  ]);
}

export function renderSettings(current, onSave, onCancel, totalQuestions = 1385) {
  const today = new Date().toISOString().slice(0, 10);
  const dateInput = el("input", {
    type: "date",
    min: today,
    value: current?.examDate || "",
  });
  const goalInput = el("input", {
    type: "number",
    min: "5",
    max: "200",
    value: String(current?.dailyGoal || 30),
  });
  let goalTouched = !!current?.dailyGoal;

  const preview = el("div", { class: "schedule-preview" });

  const fmtDate = (s) => {
    const d = new Date(s);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  const redrawPreview = () => {
    preview.innerHTML = "";
    if (!dateInput.value) {
      preview.appendChild(el("p", { class: "muted" }, "ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y thi ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ xem lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ch hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âc gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£i ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½."));
      return;
    }
    const sched = generateSchedule(
      dateInput.value,
      current?.startedAt || today,
      totalQuestions,
    );
    if (!sched) return;
    const daysLeft = daysBetween(new Date(), dateInput.value);
    const suggested = suggestDailyGoal(daysLeft, totalQuestions);

    preview.appendChild(el("div", { class: "schedule-head" }, [
      el("div", {}, [
        el("strong", {}, `${sched.totalDays} ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y`),
        el("span", { class: "muted" }, ` ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿n ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y thi ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£i ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ ${suggested} cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u/ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y`),
      ]),
      el("button", {
        type: "button",
        class: "btn btn-sm ghost",
        onclick: () => {
          goalInput.value = String(suggested);
          goalTouched = true;
        },
      }, "DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£i ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½"),
    ]));

    const list = el("ol", { class: "phase-list" });
    for (const p of sched.phases) {
      list.appendChild(el("li", { class: "phase-item" }, [
        el("div", { class: "phase-line" }, [
          el("span", { class: "phase-chip small" }, p.name),
          el("span", { class: "phase-dates" },
            `${fmtDate(p.startDate)} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ ${fmtDate(p.endDate)}`),
          el("span", { class: "phase-days" }, `${p.days} ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y`),
          el("span", { class: "phase-goal" }, `${p.goalPerDay} cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u/ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y`),
        ]),
        el("div", { class: "phase-desc muted" }, p.description),
      ]));
    }
    preview.appendChild(list);
  };

  dateInput.addEventListener("change", () => {
    if (!goalTouched && dateInput.value) {
      const daysLeft = daysBetween(new Date(), dateInput.value);
      goalInput.value = String(suggestDailyGoal(daysLeft, totalQuestions));
    }
    redrawPreview();
  });
  goalInput.addEventListener("input", () => { goalTouched = true; });

  setTimeout(redrawPreview, 0);

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ AI Explain section (provider-aware) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
  const providerSelect = el("select", { class: "gemini-model-select" });
  for (const p of PROVIDERS) {
    const opt = el("option", { value: p.id }, p.label);
    if (p.id === getProvider()) opt.selected = true;
    providerSelect.appendChild(opt);
  }

  // Gemini fields
  const geminiFields = el("div");
  const geminiModelSel = el("select", { class: "gemini-model-select" });
  for (const m of GEMINI_MODELS) {
    const opt = el("option", { value: m.id }, m.label);
    if (m.id === getGeminiModel()) opt.selected = true;
    geminiModelSel.appendChild(opt);
  }
  geminiModelSel.addEventListener("change", () => localStorage.setItem(GEMINI_MODEL_STORAGE, geminiModelSel.value));
  const geminiKeyInp = el("input", { type: "password", placeholder: "AIza...", value: localStorage.getItem(GEMINI_KEY_STORAGE) || "" });
  geminiKeyInp.addEventListener("change", () => localStorage.setItem(GEMINI_KEY_STORAGE, geminiKeyInp.value.trim()));
  geminiFields.appendChild(el("div", { class: "setup-row" }, [el("label", {}, "Model:"), geminiModelSel]));
  geminiFields.appendChild(el("div", { class: "setup-row" }, [el("label", {}, "API Key:"), geminiKeyInp]));
  geminiFields.appendChild(el("p", { class: "muted small" }, "LÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y key miÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦n phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i aistudio.google.com"));

  // Copilot fields
  const copilotFields = el("div");
  const copilotModelSel = el("select", { class: "gemini-model-select" });
  for (const m of COPILOT_MODELS) {
    const opt = el("option", { value: m.id }, m.label);
    if (m.id === getCopilotModel()) opt.selected = true;
    copilotModelSel.appendChild(opt);
  }
  copilotModelSel.addEventListener("change", () => localStorage.setItem(COPILOT_MODEL_STORAGE, copilotModelSel.value));
  const copilotTokenInp = el("input", { type: "password", placeholder: "ghp_...", value: localStorage.getItem(COPILOT_TOKEN_STORAGE) || "" });
  copilotTokenInp.addEventListener("change", () => localStorage.setItem(COPILOT_TOKEN_STORAGE, copilotTokenInp.value.trim()));
  copilotFields.appendChild(el("div", { class: "setup-row" }, [el("label", {}, "Model:"), copilotModelSel]));
  copilotFields.appendChild(el("div", { class: "setup-row" }, [el("label", {}, "GitHub Token:"), copilotTokenInp]));
  copilotFields.appendChild(el("p", { class: "muted small" }, "TÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o PAT tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i github.com/settings/tokens ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â cÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§n scope models:read (hoÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â·c dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¹ng token Copilot)"));

  const aiFieldsWrap = el("div");
  const refreshAiFields = () => {
    aiFieldsWrap.innerHTML = "";
    aiFieldsWrap.appendChild(getProvider() === "gemini" ? geminiFields : copilotFields);
  };
  providerSelect.addEventListener("change", () => {
    localStorage.setItem(PROVIDER_STORAGE, providerSelect.value);
    refreshAiFields();
  });
  refreshAiFields();

  return el("div", { class: "card" }, [
    el("h2", {}, "LÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ch hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âc PMP"),
    el("p", { class: "muted" }, "ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y thi ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â app tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â± chia 4 phase (Coverage ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Review ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Mock ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Taper) vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£i ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u/ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y."),
    el("div", { class: "setup-row" }, [el("label", {}, "NgÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y thi:"), dateInput]),
    el("div", { class: "setup-row" }, [el("label", {}, "CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u / ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y:"), goalInput]),
    preview,
    el("div", { class: "quiz-actions" }, [
      el("button", { class: "btn ghost", onclick: onCancel }, "HÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§y"),
      el("button", {
        class: "btn",
        onclick: () => {
          if (!dateInput.value) { alert("ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â y thi trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc"); return; }
          onSave({
            examDate: dateInput.value,
            dailyGoal: Math.max(5, parseInt(goalInput.value, 10) || 30),
          });
        },
      }, "LÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°u"),
    ]),
    el("div", { class: "gemini-key-section" }, [
      el("h3", {}, "GiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ch AI"),
      el("p", { class: "muted" }, "ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân AI provider ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ch lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â½ do sai sau mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Âi sai."),
      el("div", { class: "setup-row" }, [el("label", {}, "Provider:"), providerSelect]),
      aiFieldsWrap,
    ]),
    el("div", { class: "gemini-key-section" }, [
      el("h3", {}, "Data ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Export / Import"),
      el("p", { class: "muted" }, "ChuyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢n dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡u giÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯a cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c origin (vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ dÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥: localhost:8000 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ localhost:8765)."),
      el("div", { class: "quiz-actions", style: "margin-top:10px" }, [
        el("button", {
          class: "btn secondary",
          onclick: () => {
            const PMP_KEYS = [
              "pmp.history", "pmp.wrong", "pmp.settings", "pmp.seen", "pmp.days",
              "pmp.weak.history", "pmp.weak.wrong", "pmp.weak.seen", "pmp.weak.days",
              "pmp_ai_provider", "pmp_gemini_key", "pmp_gemini_model",
              "pmp_copilot_token", "pmp_copilot_model",
            ];
            const dump = {};
            for (const k of PMP_KEYS) {
              const v = localStorage.getItem(k);
              if (v !== null) dump[k] = v;
            }
            const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `pmp-backup-${new Date().toISOString().slice(0,10)}.json`;
            a.click();
          },
        }, "ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ Export backup"),
        (() => {
          const fileInput = el("input", { type: "file", accept: ".json", style: "display:none" });
          fileInput.addEventListener("change", () => {
            const file = fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const dump = JSON.parse(e.target.result);
                for (const [k, v] of Object.entries(dump)) localStorage.setItem(k, v);
                alert(`Imported ${Object.keys(dump).length} keys. Trang sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â½ reload.`);
                location.reload();
              } catch {
                alert("File khÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´ng hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â£p lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡.");
              }
            };
            reader.readAsText(file);
          });
          const btn = el("button", { class: "btn secondary", onclick: () => fileInput.click() }, "ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â  Import backup");
          const wrap = document.createDocumentFragment();
          wrap.appendChild(fileInput);
          wrap.appendChild(btn);
          return wrap;
        })(),
      ]),
    ]),
  ]);
}

export function renderSetup(defaultN, maxN, onStart, onCancel, unseenCount = maxN) {
  const input = el("input", { type: "number", min: "5", max: String(maxN), value: String(defaultN) });
  return el("div", { class: "card" }, [
    el("h2", {}, "ThiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p phiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn luyÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡n tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­p"),
    el("p", { class: "muted" },
      unseenCount > 0
        ? `ÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â¯u tiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¥y cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u chÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°a lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â m trÃƒÆ’Ã¢â‚¬Â Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºc: cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²n ${unseenCount}/${maxN} cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u.`
        : "BÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â m hÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t ngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ng cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u; phiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªn mÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âºi sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â½ trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢n lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i toÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â n bÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢.",
    ),
    el("div", { class: "setup-row" }, [
      el("label", {}, "SÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u:"),
      input,
    ]),
    el("div", { class: "quiz-actions" }, [
      el("button", { class: "btn secondary", onclick: onCancel }, "HÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§y"),
      el("button", {
        class: "btn",
        onclick: () => {
          const n = Math.max(1, Math.min(maxN, parseInt(input.value, 10) || defaultN));
          onStart(n);
        },
      }, "BÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¯t ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â§u"),
    ]),
  ]);
}

async function screenshotCard(cardEl, btn) {
  if (!window.html2canvas) return;
  const actionsEl = cardEl.querySelector(".quiz-actions");
  const aiWrapEl  = cardEl.querySelector(".ai-explain-wrap");
  if (actionsEl) actionsEl.style.visibility = "hidden";
  if (aiWrapEl)  aiWrapEl.style.visibility  = "hidden";
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = "ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚Âang chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥p...";
  try {
    const canvas = await window.html2canvas(cardEl, {
      backgroundColor: "#1C2220",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    await new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          btn.textContent = "ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ copy!";
          setTimeout(() => { btn.textContent = orig; }, 2000);
          resolve();
        } catch (e) {
          reject(e);
        }
      }, "image/png");
    });
  } catch (e) {
    btn.textContent = "LÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi clipboard";
    setTimeout(() => { btn.textContent = orig; }, 2000);
  } finally {
    if (actionsEl) actionsEl.style.visibility = "";
    if (aiWrapEl)  aiWrapEl.style.visibility  = "";
    btn.disabled = false;
  }
}

export function renderQuestion(quiz, onPick, onNext, picked, isCorrect, pendingMulti = null, onSubmitMulti = null) {
  const q          = quiz.current();
  const isAnswered = picked != null;
  const needed     = requiredCount(q);
  const isMulti    = needed > 1;
  const staging    = pendingMulti || new Set();

  // Normalize correct to array for multi feedback
  const correctArr = Array.isArray(q.correct)
    ? q.correct : (typeof q.correct === "string" && q.correct.length > 1)
    ? q.correct.split("") : [q.correct];
  const pickedArr  = picked == null ? [] : Array.isArray(picked) ? picked : [picked];

  const options = el("div", { class: "options" });
  for (const letter of Object.keys(q.options)) {
    let cls = "option";
    if (isAnswered) {
      cls += " disabled";
      if (correctArr.includes(letter)) cls += " correct";
      else if (pickedArr.includes(letter)) cls += " wrong";
    } else if (isMulti && staging.has(letter)) {
      cls += " selected";
    }
    options.appendChild(el("button", {
      class: cls,
      disabled: isAnswered ? "" : null,
      onclick: () => !isAnswered && onPick(letter),
    }, [el("span", { class: "letter" }, letter), q.options[letter]]));
  }

  // Multi-select confirm button (visible during staging)
  const confirmRow = isMulti && !isAnswered
    ? el("div", { class: "quiz-actions" }, [
        el("span", { class: "muted", style: "font-size:13px" },
          staging.size > 0 ? `ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân ${staging.size}/${needed}` : `ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân ${needed} ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡p ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡n`),
        el("button", {
          class: "btn" + (staging.size === needed ? "" : " secondary"),
          disabled: staging.size !== needed ? "" : null,
          onclick: () => staging.size === needed && onSubmitMulti(),
        }, `XÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n (${staging.size}/${needed})`),
      ])
    : null;

  const kbdHints = ["A","B","C","D"];
  if (isMulti) kbdHints.push("E");
  const shortcutHint = el("div", { class: "shortcut-hint muted" }, [
    "PhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­m tÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¯t: ",
    ...kbdHints.flatMap((k, i) => i === 0 ? [el("kbd",{},k)] : [" ", el("kbd",{},k)]),
    isAnswered ? " ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Enter ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ sang cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p"
      : isMulti ? " ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Enter ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€ Ã¢â‚¬â„¢ xÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡c nhÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â­n" : "",
  ]);

  const card = el("div", { class: "card" }, [
    el("div", { class: "progress" }, [el("div", { class: "progress-bar" })]),
    el("div", { class: "qmeta" }, [
      el("span", {}, `CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u ${quiz.index + 1}/${quiz.questions.length} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· #${q.id}`
        + (isMulti ? ` ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Ân ${needed} ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡p ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡n` : "")),
      el("span", {}, `Domain: ${q.domain}`),
    ]),
    el("div", { class: "qtext" }, q.question),
    options,
    confirmRow,
    shortcutHint,
  ].filter(Boolean));
  card.querySelector(".progress-bar").style.width = `${quiz.progressPct()}%`;

  if (isAnswered) {
    const correctDisplay = correctArr.join(", ");
    card.appendChild(el("div", { class: isCorrect ? "feedback feedback-ok" : "feedback feedback-err" }, [
      el("h4", {}, isCorrect ? "ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng" : `Sai ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡p ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡n ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng: ${correctDisplay}`),
      q.explanation ? el("div", {}, q.explanation) : null,
    ]));

    if (!isCorrect) {
      const aiBox = el("div", { class: "ai-explain-box" });
      const explainBtn = el("button", { class: "btn btn-sm ai-explain-btn" }, "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â¡ GiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£i thÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ch AI");
      explainBtn.addEventListener("click", async () => {
        explainBtn.disabled = true;
        explainBtn.textContent = "ÃƒÆ’Ã¢â‚¬Å¾Ãƒâ€šÃ‚Âang phÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ch...";
        const pickedDisplay = pickedArr.join(", ");
        try {
          const text = await explainWrongAnswer(q, pickedDisplay, correctDisplay);
          aiBox.innerHTML = "";
          aiBox.appendChild(el("div", { class: "ai-label" }, "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â¡ PhÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢n tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ch AI ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· PMP Coach"));
          aiBox.appendChild(el("div", { class: "ai-text" }, text));
          explainBtn.style.display = "none";
        } catch (err) {
          aiBox.innerHTML = "";
          aiBox.appendChild(el("div", { class: "ai-error muted" }, `LÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âi: ${err.message}`));
          explainBtn.disabled = false;
          explainBtn.textContent = "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â¡ ThÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â­ lÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡i";
        }
      });
      card.appendChild(el("div", { class: "ai-explain-wrap" }, [explainBtn, aiBox]));
    }

    const screenshotBtn = el("button", {
      class: "btn secondary screenshot-btn",
      title: "ChÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¥p & copy vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â o clipboard",
      onclick: () => screenshotCard(card, screenshotBtn),
    }, "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â· Copy");

    card.appendChild(el("div", { class: "quiz-actions" }, [
      screenshotBtn,
      el("button", { class: "btn", onclick: onNext },
        quiz.isLast() ? "Xem kÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¶" : "CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u tiÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿p ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¶"),
    ]));
  }

  return card;
}

export function renderResult(session, onHome, onReviewWrong) {
  const root = el("div");
  root.appendChild(el("div", { class: "card" }, [
    el("div", { class: "result-summary" }, [
      el("div", { class: "label" }, "KÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¿t quÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â£"),
      el("div", { class: "big" }, `${session.pct}%`),
      el("div", { class: "label" }, `${session.correct}/${session.total} cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u ÃƒÆ’Ã¢â‚¬Å¾ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºng`),
    ]),
  ]));

  const statsCard = el("div", { class: "card" }, [el("h3", {}, "Theo domain")]);
  const grid = el("div", { class: "stats-grid" });
  for (const [d, s] of Object.entries(session.byDomain)) {
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    grid.appendChild(el("div", { class: "stat-box" }, [
      el("div", { class: "num" }, `${pct}%`),
      el("div", { class: "lbl" }, `${d} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${s.correct}/${s.total}`),
    ]));
  }
  statsCard.appendChild(grid);
  root.appendChild(statsCard);

  root.appendChild(el("div", { class: "card" }, [
    el("div", { class: "quiz-actions" }, [
      el("button", { class: "btn secondary", onclick: onHome }, "VÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â trang chÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â§"),
      session.wrongIds.length > 0
        ? el("button", { class: "btn", onclick: onReviewWrong }, `ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Ân ngay ${session.wrongIds.length} cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢u sai`)
        : el("span", {}, ""),
    ]),
  ]));
  return root;
}

export function renderHistory(history, onClear) {
  if (history.length === 0) {
    return el("div", { class: "card" }, [el("div", { class: "empty" }, "No sessions yet.")]);
  }
  const list = el("ul", { class: "history-list" });
  for (const s of history) {
    const d = new Date(s.startedAt);
    const modeLabel = s.mode === "weak-review" ? "Weak 360 review"
      : s.mode === "weak-practice" ? "Weak 360"
      : s.mode === "review" ? "Review wrong"
      : "Practice";
    list.appendChild(el("li", {}, [
      el("span", {}, `${d.toLocaleString("vi-VN")} - ${modeLabel} - ${s.total} questions`),
      el("span", { class: "score" }, `${s.pct}% (${s.correct}/${s.total})`),
    ]));
  }
  return el("div", { class: "card" }, [
    el("h2", {}, "Session history"),
    list,
    el("div", { class: "quiz-actions" }, [
      el("span", {}, ""),
      el("button", { class: "btn secondary", onclick: onClear }, "Clear all history"),
    ]),
  ]);
}

export function renderStats(history) {
  if (history.length === 0) {
    return el("div", { class: "card" }, [el("div", { class: "empty" }, "No stats yet.")]);
  }
  const agg = {};
  const tracks = {
    main: { total: 0, correct: 0 },
    weak: { total: 0, correct: 0 },
  };
  let totalQ = 0, totalC = 0;
  for (const s of history) {
    totalQ += s.total; totalC += s.correct;
    const track = s.mode && s.mode.startsWith("weak-") ? "weak" : "main";
    tracks[track].total += s.total;
    tracks[track].correct += s.correct;
    for (const [d, v] of Object.entries(s.byDomain || {})) {
      if (!agg[d]) agg[d] = { total: 0, correct: 0 };
      agg[d].total += v.total;
      agg[d].correct += v.correct;
    }
  }
  const overall = totalQ ? Math.round((totalC / totalQ) * 100) : 0;
  const boxes = el("div", { class: "stats-grid" });
  boxes.appendChild(el("div", { class: "stat-box" }, [
    el("div", { class: "num" }, `${overall}%`),
    el("div", { class: "lbl" }, `All sessions - ${totalC}/${totalQ}`),
  ]));
  for (const [track, s] of Object.entries(tracks)) {
    if (!s.total) continue;
    const pct = Math.round((s.correct / s.total) * 100);
    boxes.appendChild(el("div", { class: "stat-box" }, [
      el("div", { class: "num" }, `${pct}%`),
      el("div", { class: "lbl" }, `${track === "weak" ? "Weak 360" : "Main quiz"} - ${s.correct}/${s.total}`),
    ]));
  }
  for (const [d, s] of Object.entries(agg)) {
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    boxes.appendChild(el("div", { class: "stat-box" }, [
      el("div", { class: "num" }, `${pct}%`),
      el("div", { class: "lbl" }, `${d} - ${s.correct}/${s.total}`),
    ]));
  }
  return el("div", { class: "card" }, [
    el("h2", {}, "Stats"),
    el("p", { class: "muted" }, `Based on ${history.length} synced sessions from Main quiz and Weak 360.`),
    boxes,
  ]);
}
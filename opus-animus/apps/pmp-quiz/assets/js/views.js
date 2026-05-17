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

// Quyết định smart CTA chính trên hero: ưu tiên theo phase + state.
function pickPrimaryCta(stats, plan) {
  const goal = plan?.dailyGoal || 30;
  const done = stats.todayAnswered || 0;
  const remain = Math.max(0, goal - done);

  if (!plan) {
    return { label: "Thiết lập lịch học", action: "settings", sub: "Chọn ngày thi để app tự lên kế hoạch" };
  }
  if (done >= goal) {
    if (stats.wrongCount > 0) return { label: `Ôn thêm ${Math.min(10, stats.wrongCount)} câu sai`, action: "review", sub: "Đã đạt goal — bonus để nhớ lâu" };
    return { label: "Xem thống kê hôm nay", action: "stats", sub: `Hoàn thành ${done}/${goal} câu · nghỉ ngơi nhé` };
  }
  if (plan.phase === "Review" && stats.wrongCount >= 5) {
    return { label: `Ôn ${Math.min(20, stats.wrongCount)} câu sai`, action: "review", sub: `Còn ${remain} câu để đạt goal hôm nay` };
  }
  if (plan.phase === "Mock") {
    return { label: "Làm mock 60 câu", action: "practice", sub: "Mô phỏng đề — luyện áp lực thời gian" };
  }
  if (plan.phase === "Taper" && stats.wrongCount > 0) {
    return { label: `Ôn nhẹ ${Math.min(10, stats.wrongCount)} câu sai`, action: "review", sub: "Giữ phong độ, đừng học nặng" };
  }
  return { label: `Luyện tập ${remain} câu mới`, action: "practice", sub: `${done}/${goal} câu hôm nay` };
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
    : "—";

  const hero = el("section", { class: "hero" }, [
    el("div", { class: "hero-left" }, [
      el("div", { class: "hero-countdown" }, [
        el("div", { class: "count-num" }, plan ? String(plan.daysLeft) : "—"),
        el("div", { class: "count-lbl" }, [
          el("div", {}, "ngày đến kỳ thi"),
          plan ? el("div", { class: "count-sub" }, `Thi ngày ${examStr}`) : null,
        ]),
        plan ? el("span", { class: "phase-chip" }, plan.phase) : null,
      ]),
      el("div", { class: "hero-cta" }, [
        el("button", { class: "btn btn-lg", onclick: runCta }, [
          el("span", { class: "btn-play-icon" }, "▶"),
          el("span", {}, " " + cta.label),
        ]),
        el("div", { class: "cta-sub muted" }, cta.sub),
      ]),
      el("div", { class: "streak-line muted" },
        stats.streak > 0
          ? `🔥 Streak ${stats.streak} ngày · đừng bỏ hôm nay`
          : "Bắt đầu streak đầu tiên của bạn hôm nay"),
    ]),
    el("div", { class: "hero-right" }, [
      ringProgress(pctToday),
      el("div", { class: "ring-label" }, [
        el("div", { class: "ring-val" }, `${done}/${goal}`),
        el("div", { class: "muted ring-sub" }, "câu hôm nay"),
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
      el("span", { class: "muted" }, "Tiến độ toàn đề"),
      el("span", {}, `${seen}/${total} câu · đúng ${stats.accuracy}%`),
    ]),
    el("div", { class: "cov-bar" }, [
      el("div", { class: "cov-seg cov-correct", style: `width:${pct(correct)}%` }),
      el("div", { class: "cov-seg cov-wrong", style: `width:${pct(wrong)}%` }),
    ]),
    el("div", { class: "cov-legend muted" }, [
      el("span", {}, `🟢 Đã đúng ${correct}`),
      el("span", {}, `🔴 Cần ôn ${wrong}`),
      el("span", {}, `⚪ Chưa làm ${total - seen}`),
    ]),
  ]));

  // ===== 3. Today task list =====
  if (plan) {
    const todayCard = el("section", { class: "card" }, [
      el("div", { class: "plan-head" }, [
        el("h2", {}, "Hôm nay"),
        el("span", { class: "phase-chip small" }, `${plan.phase} · ${plan.domainFocus}`),
      ]),
      el("p", { class: "muted" }, plan.focus),
    ]);
    const list = el("div", { class: "task-list" });
    if (tasks.length === 0) {
      list.appendChild(el("div", { class: "empty" }, "Không có task hôm nay"));
    }
    for (const t of tasks) {
      const estimate = t.label.match(/(\d+)\s*câu/);
      const mins = estimate ? Math.round(parseInt(estimate[1], 10) * 0.8) : null;
      list.appendChild(el("div", { class: "task" + (t.done ? " done" : "") }, [
        el("div", { class: "task-check" + (t.done ? " checked" : "") }, t.done ? "✓" : ""),
        el("div", { class: "task-body" }, [
          el("div", { class: "task-label" }, t.label),
          el("div", { class: "task-detail muted" }, [
            t.detail || "",
            mins ? el("span", { class: "task-eta" }, ` · ≈ ${mins} phút`) : null,
          ]),
        ]),
        t.done
          ? el("span", { class: "badge-done" }, "Xong")
          : el("button", {
              class: "btn btn-sm",
              onclick: () => t.action === "review" ? handlers.onStartReview() : handlers.onStartPractice(),
            }, "Bắt đầu"),
      ]));
    }
    todayCard.appendChild(list);
    root.appendChild(todayCard);
  } else {
    root.appendChild(el("section", { class: "card setup-cta" }, [
      el("h2", {}, "Thiết lập lịch học"),
      el("p", { class: "muted" }, "Chọn ngày thi để app tự chia phase & gợi ý câu/ngày."),
      el("button", { class: "btn", onclick: handlers.onOpenSettings }, "Thiết lập ngay"),
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
      heat.appendChild(el("div", { class: `heat-cell lvl-${level}`, title: `${a.date}: ${a.count} câu` }, [
        el("div", { class: "heat-day" }, dayLbl[d.getDay()]),
        el("div", { class: "heat-num" }, String(a.count)),
        el("div", { class: "heat-date" }, String(d.getDate())),
      ]));
    }
    root.appendChild(el("section", { class: "card heat-card" }, [
      el("div", { class: "section-row" }, [
        el("h3", {}, "7 ngày gần nhất"),
        el("span", { class: "muted" }, `${activity.reduce((n, a) => n + a.count, 0)} câu tuần này`),
      ]),
      heat,
    ]));
  }

  // ===== 5. Weak domain =====
  if (weak && weak.total >= 10) {
    root.appendChild(el("section", { class: "card weak-card" }, [
      el("div", { class: "weak-head" }, [
        el("div", {}, [
          el("div", { class: "weak-label muted" }, "Điểm yếu cần chú ý"),
          el("div", { class: "weak-title" }, `${weak.domain} · ${weak.pct}% đúng`),
          el("div", { class: "muted small" }, `${weak.correct}/${weak.total} câu đã làm trong domain này`),
        ]),
        el("button", {
          class: "btn",
          onclick: () => handlers.onStartDomain ? handlers.onStartDomain(weak.domain) : handlers.onStartPractice(),
        }, "Luyện riêng 15 câu"),
      ]),
    ]));
  }

  // ===== 6. Mode cards compact =====
  const modes = el("section", { class: "mode-row" });
  modes.appendChild(el("button", { class: "mode-mini", onclick: () => handlers.onStartPractice() }, [
    el("span", { class: "mini-ic" }, "📘"),
    el("div", {}, [ el("div", { class: "mini-t" }, "Luyện tập"), el("div", { class: "mini-s muted" }, "Chọn số câu ngẫu nhiên") ]),
  ]));
  const revBtn = el("button", {
    class: "mode-mini" + (stats.wrongCount === 0 ? " dim" : ""),
    onclick: () => stats.wrongCount > 0 && handlers.onStartReview(),
  }, [
    el("span", { class: "mini-ic" }, "🔁"),
    el("div", {}, [
      el("div", { class: "mini-t" }, "Ôn câu sai"),
      el("div", { class: "mini-s muted" }, stats.wrongCount > 0 ? `${stats.wrongCount} câu trong danh sách` : "Chưa có câu sai"),
    ]),
  ]);
  modes.appendChild(revBtn);
  modes.appendChild(el("button", { class: "mode-mini", onclick: () => handlers.onStartMock ? handlers.onStartMock() : handlers.onStartPractice() }, [
    el("span", { class: "mini-ic" }, "⏱️"),
    el("div", {}, [ el("div", { class: "mini-t" }, "Mock exam"), el("div", { class: "mini-s muted" }, "60 câu liên tục") ]),
  ]));
  root.appendChild(modes);

  return root;
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
      preview.appendChild(el("p", { class: "muted" }, "Chọn ngày thi để xem lịch học gợi ý."));
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
        el("strong", {}, `${sched.totalDays} ngày`),
        el("span", { class: "muted" }, ` đến ngày thi · gợi ý ${suggested} câu/ngày`),
      ]),
      el("button", {
        type: "button",
        class: "btn btn-sm ghost",
        onclick: () => {
          goalInput.value = String(suggested);
          goalTouched = true;
        },
      }, "Dùng gợi ý"),
    ]));

    const list = el("ol", { class: "phase-list" });
    for (const p of sched.phases) {
      list.appendChild(el("li", { class: "phase-item" }, [
        el("div", { class: "phase-line" }, [
          el("span", { class: "phase-chip small" }, p.name),
          el("span", { class: "phase-dates" },
            `${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}`),
          el("span", { class: "phase-days" }, `${p.days} ngày`),
          el("span", { class: "phase-goal" }, `${p.goalPerDay} câu/ngày`),
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

  // ── AI Explain section (provider-aware) ──
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
  geminiFields.appendChild(el("p", { class: "muted small" }, "Lấy key miễn phí tại aistudio.google.com"));

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
  copilotFields.appendChild(el("p", { class: "muted small" }, "Tạo PAT tại github.com/settings/tokens — cần scope models:read (hoặc dùng token Copilot)"));

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
    el("h2", {}, "Lịch học PMP"),
    el("p", { class: "muted" }, "Chọn ngày thi — app tự chia 4 phase (Coverage → Review → Mock → Taper) và gợi ý câu/ngày."),
    el("div", { class: "setup-row" }, [el("label", {}, "Ngày thi:"), dateInput]),
    el("div", { class: "setup-row" }, [el("label", {}, "Câu / ngày:"), goalInput]),
    preview,
    el("div", { class: "quiz-actions" }, [
      el("button", { class: "btn ghost", onclick: onCancel }, "Hủy"),
      el("button", {
        class: "btn",
        onclick: () => {
          if (!dateInput.value) { alert("Chọn ngày thi trước"); return; }
          onSave({
            examDate: dateInput.value,
            dailyGoal: Math.max(5, parseInt(goalInput.value, 10) || 30),
          });
        },
      }, "Lưu"),
    ]),
    el("div", { class: "gemini-key-section" }, [
      el("h3", {}, "Giải thích AI"),
      el("p", { class: "muted" }, "Chọn AI provider để giải thích lý do sai sau mỗi câu trả lời sai."),
      el("div", { class: "setup-row" }, [el("label", {}, "Provider:"), providerSelect]),
      aiFieldsWrap,
    ]),
    el("div", { class: "gemini-key-section" }, [
      el("h3", {}, "Data — Export / Import"),
      el("p", { class: "muted" }, "Chuyển dữ liệu giữa các origin (ví dụ: localhost:8000 → localhost:8765)."),
      el("div", { class: "quiz-actions", style: "margin-top:10px" }, [
        el("button", {
          class: "btn secondary",
          onclick: () => {
            const PMP_KEYS = [
              "pmp.history", "pmp.wrong", "pmp.settings", "pmp.seen", "pmp.days",
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
        }, "⬇ Export backup"),
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
                alert(`Imported ${Object.keys(dump).length} keys. Trang sẽ reload.`);
                location.reload();
              } catch {
                alert("File không hợp lệ.");
              }
            };
            reader.readAsText(file);
          });
          const btn = el("button", { class: "btn secondary", onclick: () => fileInput.click() }, "⬆ Import backup");
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
    el("h2", {}, "Thiết lập phiên luyện tập"),
    el("p", { class: "muted" },
      unseenCount > 0
        ? `Ưu tiên lấy câu chưa làm trước: còn ${unseenCount}/${maxN} câu.`
        : "Bạn đã làm hết ngân hàng câu; phiên mới sẽ trộn lại toàn bộ.",
    ),
    el("div", { class: "setup-row" }, [
      el("label", {}, "Số câu:"),
      input,
    ]),
    el("div", { class: "quiz-actions" }, [
      el("button", { class: "btn secondary", onclick: onCancel }, "Hủy"),
      el("button", {
        class: "btn",
        onclick: () => {
          const n = Math.max(1, Math.min(maxN, parseInt(input.value, 10) || defaultN));
          onStart(n);
        },
      }, "Bắt đầu"),
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
  btn.textContent = "Đang chụp...";
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
          btn.textContent = "✓ Đã copy!";
          setTimeout(() => { btn.textContent = orig; }, 2000);
          resolve();
        } catch (e) {
          reject(e);
        }
      }, "image/png");
    });
  } catch (e) {
    btn.textContent = "Lỗi clipboard";
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
          staging.size > 0 ? `Đã chọn ${staging.size}/${needed}` : `Chọn ${needed} đáp án`),
        el("button", {
          class: "btn" + (staging.size === needed ? "" : " secondary"),
          disabled: staging.size !== needed ? "" : null,
          onclick: () => staging.size === needed && onSubmitMulti(),
        }, `Xác nhận (${staging.size}/${needed})`),
      ])
    : null;

  const kbdHints = ["A","B","C","D"];
  if (isMulti) kbdHints.push("E");
  const shortcutHint = el("div", { class: "shortcut-hint muted" }, [
    "Phím tắt: ",
    ...kbdHints.flatMap((k, i) => i === 0 ? [el("kbd",{},k)] : [" ", el("kbd",{},k)]),
    isAnswered ? " · Enter để sang câu tiếp"
      : isMulti ? " · Enter để xác nhận" : "",
  ]);

  const card = el("div", { class: "card" }, [
    el("div", { class: "progress" }, [el("div", { class: "progress-bar" })]),
    el("div", { class: "qmeta" }, [
      el("span", {}, `Câu ${quiz.index + 1}/${quiz.questions.length} · #${q.id}`
        + (isMulti ? ` · Chọn ${needed} đáp án` : "")),
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
      el("h4", {}, isCorrect ? "Đúng" : `Sai — Đáp án đúng: ${correctDisplay}`),
      q.explanation ? el("div", {}, q.explanation) : null,
    ]));

    if (!isCorrect) {
      const aiBox = el("div", { class: "ai-explain-box" });
      const explainBtn = el("button", { class: "btn btn-sm ai-explain-btn" }, "💡 Giải thích AI");
      explainBtn.addEventListener("click", async () => {
        explainBtn.disabled = true;
        explainBtn.textContent = "Đang phân tích...";
        const pickedDisplay = pickedArr.join(", ");
        try {
          const text = await explainWrongAnswer(q, pickedDisplay, correctDisplay);
          aiBox.innerHTML = "";
          aiBox.appendChild(el("div", { class: "ai-label" }, "💡 Phân tích AI · PMP Coach"));
          aiBox.appendChild(el("div", { class: "ai-text" }, text));
          explainBtn.style.display = "none";
        } catch (err) {
          aiBox.innerHTML = "";
          aiBox.appendChild(el("div", { class: "ai-error muted" }, `Lỗi: ${err.message}`));
          explainBtn.disabled = false;
          explainBtn.textContent = "💡 Thử lại";
        }
      });
      card.appendChild(el("div", { class: "ai-explain-wrap" }, [explainBtn, aiBox]));
    }

    const screenshotBtn = el("button", {
      class: "btn secondary screenshot-btn",
      title: "Chụp & copy vào clipboard",
      onclick: () => screenshotCard(card, screenshotBtn),
    }, "📷 Copy");

    card.appendChild(el("div", { class: "quiz-actions" }, [
      screenshotBtn,
      el("button", { class: "btn", onclick: onNext },
        quiz.isLast() ? "Xem kết quả ▶" : "Câu tiếp ▶"),
    ]));
  }

  return card;
}

export function renderResult(session, onHome, onReviewWrong) {
  const root = el("div");
  root.appendChild(el("div", { class: "card" }, [
    el("div", { class: "result-summary" }, [
      el("div", { class: "label" }, "Kết quả"),
      el("div", { class: "big" }, `${session.pct}%`),
      el("div", { class: "label" }, `${session.correct}/${session.total} câu đúng`),
    ]),
  ]));

  const statsCard = el("div", { class: "card" }, [el("h3", {}, "Theo domain")]);
  const grid = el("div", { class: "stats-grid" });
  for (const [d, s] of Object.entries(session.byDomain)) {
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    grid.appendChild(el("div", { class: "stat-box" }, [
      el("div", { class: "num" }, `${pct}%`),
      el("div", { class: "lbl" }, `${d} · ${s.correct}/${s.total}`),
    ]));
  }
  statsCard.appendChild(grid);
  root.appendChild(statsCard);

  root.appendChild(el("div", { class: "card" }, [
    el("div", { class: "quiz-actions" }, [
      el("button", { class: "btn secondary", onclick: onHome }, "Về trang chủ"),
      session.wrongIds.length > 0
        ? el("button", { class: "btn", onclick: onReviewWrong }, `Ôn ngay ${session.wrongIds.length} câu sai`)
        : el("span", {}, ""),
    ]),
  ]));
  return root;
}

export function renderHistory(history, onClear) {
  if (history.length === 0) {
    return el("div", { class: "card" }, [el("div", { class: "empty" }, "Chưa có phiên nào.")]);
  }
  const list = el("ul", { class: "history-list" });
  for (const s of history) {
    const d = new Date(s.startedAt);
    list.appendChild(el("li", {}, [
      el("span", {}, `${d.toLocaleString("vi-VN")} · ${s.mode === "review" ? "Ôn sai" : "Luyện tập"} · ${s.total} câu`),
      el("span", { class: "score" }, `${s.pct}% (${s.correct}/${s.total})`),
    ]));
  }
  return el("div", { class: "card" }, [
    el("h2", {}, "Lịch sử phiên"),
    list,
    el("div", { class: "quiz-actions" }, [
      el("span", {}, ""),
      el("button", { class: "btn secondary", onclick: onClear }, "Xóa lịch sử"),
    ]),
  ]);
}

export function renderStats(history) {
  if (history.length === 0) {
    return el("div", { class: "card" }, [el("div", { class: "empty" }, "Chưa có dữ liệu thống kê.")]);
  }
  const agg = {};
  let totalQ = 0, totalC = 0;
  for (const s of history) {
    totalQ += s.total; totalC += s.correct;
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
    el("div", { class: "lbl" }, `Tổng · ${totalC}/${totalQ}`),
  ]));
  for (const [d, s] of Object.entries(agg)) {
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    boxes.appendChild(el("div", { class: "stat-box" }, [
      el("div", { class: "num" }, `${pct}%`),
      el("div", { class: "lbl" }, `${d} · ${s.correct}/${s.total}`),
    ]));
  }
  return el("div", { class: "card" }, [
    el("h2", {}, "Thống kê tổng"),
    el("p", { class: "muted" }, `Dựa trên ${history.length} phiên gần nhất`),
    boxes,
  ]);
}

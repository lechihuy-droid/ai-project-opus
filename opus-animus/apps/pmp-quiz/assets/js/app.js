import { Quiz, pickRandom, requiredCount } from "./quiz.js";
import { annotateDomains } from "./domain.js";
import {
  loadHistory, loadWrongIds, loadSeen, clearAll, loadSettings, saveSettings, computeStats,
  last7DaysActivity, weakestDomain,
} from "./storage.js";
import { computePlan, todayTasks } from "./plan.js";
import {
  renderHome, renderSetup, renderQuestion, renderResult,
  renderHistory, renderStats, renderSettings,
} from "./views.js";

const view = document.getElementById("view");
let questions = [];
let state = { route: "home", quiz: null, pendingPick: null, pendingMulti: null, lastSession: null };

async function boot() {
  const res = await fetch("data/questions.json");
  questions = annotateDomains(await res.json());
  document.querySelectorAll(".topbar nav button").forEach((btn) => {
    btn.addEventListener("click", () => go(btn.dataset.route));
  });
  document.addEventListener("keydown", handleQuizKeys);
  go("home");
}

function go(route) {
  state.route = route;
  state.quiz = null;
  state.pendingPick = null;
  // ── Active tab highlight ──
  document.querySelectorAll(".topbar nav button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.route === route);
  });
  render();
}

function render() {
  try { renderInner(); } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="card"><h3>Lỗi render</h3><pre style="white-space:pre-wrap">${err && err.stack || err}</pre></div>`;
  }
}
function renderInner() {
  view.innerHTML = "";
  let node;
  if (state.route === "home") {
    const stats = computeStats(questions.length);
    const plan = computePlan(loadSettings(), questions.length);
    const tasks = todayTasks(plan, stats);
    const weak = weakestDomain(10);
    const activity = last7DaysActivity();
    node = renderHome({ stats, plan, tasks, weak, activity }, {
      onStartPractice: () => { state.route = "setup-practice"; render(); },
      onStartReview: () => startReview(),
      onStartMock: () => startPractice(60, { preferUnseen: false }),
      onStartDomain: (domain) => startDomain(domain, 15),
      onOpenSettings: () => go("settings"),
      onGoStats: () => go("stats"),
    });
  } else if (state.route === "settings") {
    node = renderSettings(loadSettings(), (s) => {
      saveSettings(s);
      go("home");
    }, () => go("home"), questions.length);
  } else if (state.route === "setup-practice") {
    node = renderSetup(
      20,
      questions.length,
      (n) => startPractice(n),
      () => go("home"),
      countUnseen(questions),
    );
  } else if (state.route === "quiz") {
    const q = state.quiz.current();
    const correctArr = Array.isArray(q.correct) ? q.correct.slice().sort() : [q.correct];
    const pickedArr  = state.pendingPick == null ? null
      : Array.isArray(state.pendingPick) ? state.pendingPick.slice().sort()
      : [state.pendingPick];
    const isCorrect  = pickedArr != null && correctArr.join(",") === pickedArr.join(",");
    node = renderQuestion(
      state.quiz,
      (letter) => pickAnswer(letter),
      () => nextQuestion(),
      state.pendingPick,
      isCorrect,
      state.pendingMulti,
      () => submitMulti(),
    );
  } else if (state.route === "result") {
    node = renderResult(
      state.lastSession,
      () => go("home"),
      () => startReview(),
    );
  } else if (state.route === "history") {
    node = renderHistory(loadHistory(), () => {
      if (confirm("Xóa toàn bộ lịch sử và danh sách câu sai?")) {
        clearAll();
        render();
      }
    });
  } else if (state.route === "stats") {
    node = renderStats(loadHistory());
  }
  view.appendChild(node);
}

function startPractice(n, options = {}) {
  const pool = pickPracticePool(questions, n, options);
  state.quiz = new Quiz(pool, "practice");
  state.route = "quiz";
  state.pendingPick = null; state.pendingMulti = null;
  render();
}

function startDomain(domain, n) {
  const domainPool = questions.filter((q) => q.domain === domain);
  if (domainPool.length === 0) { startPractice(n); return; }
  state.quiz = new Quiz(pickPracticePool(domainPool, n), "practice");
  state.route = "quiz";
  state.pendingPick = null; state.pendingMulti = null;
  render();
}

function startReview() {
  const wrong = loadWrongIds();
  const pool = questions.filter((q) => wrong.has(q.id));
  if (pool.length === 0) { go("home"); return; }
  state.quiz = new Quiz(pickRandom(pool, pool.length), "review");
  state.route = "quiz";
  state.pendingPick = null; state.pendingMulti = null;
  render();
}

function countUnseen(pool) {
  const seen = loadSeen();
  return pool.filter((q) => !seen.has(q.id)).length;
}

function pickPracticePool(pool, n, options = {}) {
  const preferUnseen = options.preferUnseen !== false;
  if (!preferUnseen) return pickRandom(pool, n);

  const seen = loadSeen();
  const unseen = pool.filter((q) => !seen.has(q.id));
  if (unseen.length >= n) return pickRandom(unseen, n);

  const seenPool = pool.filter((q) => seen.has(q.id));
  return [
    ...pickRandom(unseen, unseen.length),
    ...pickRandom(seenPool, n - unseen.length),
  ];
}

function pickAnswer(letter) {
  const q = state.quiz.current();
  const needed = requiredCount(q);
  if (needed === 1) {
    state.pendingPick = letter;
    state.quiz.submit(letter);
  } else {
    if (!state.pendingMulti) state.pendingMulti = new Set();
    if (state.pendingMulti.has(letter)) state.pendingMulti.delete(letter);
    else state.pendingMulti.add(letter);
  }
  render();
}

function submitMulti() {
  if (!state.pendingMulti || state.pendingMulti.size === 0) return;
  const picked = Array.from(state.pendingMulti).sort();
  state.pendingPick  = picked;
  state.pendingMulti = null;
  state.quiz.submit(picked);
  render();
}

function nextQuestion() {
  if (state.quiz.isLast()) {
    state.lastSession = state.quiz.finish();
    state.route = "result";
  } else {
    state.quiz.next();
    state.pendingPick = null;
    state.pendingMulti = null;
  }
  render();
}

function handleQuizKeys(event) {
  if (state.route !== "quiz" || !state.quiz) return;
  if (event.target && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;

  const key = event.key.toUpperCase();
  const q   = state.quiz.current();
  const needed = requiredCount(q);

  if (state.pendingPick != null) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      nextQuestion();
    }
    return;
  }

  if (["A","B","C","D","E"].includes(key) && q.options[key]) {
    event.preventDefault();
    pickAnswer(key);
    return;
  }

  if (needed > 1 && (event.key === "Enter" || event.key === " ")) {
    if (state.pendingMulti && state.pendingMulti.size === needed) {
      event.preventDefault();
      submitMulti();
    }
  }
}

boot().catch((err) => {
  view.innerHTML = `<div class="card"><h3>Lỗi tải dữ liệu</h3><pre>${err}</pre><p class="muted">Chạy qua HTTP server: <code>python -m http.server 8000</code></p></div>`;
});

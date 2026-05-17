// localStorage wrappers for history, wrong-list, settings, and aggregated stats.
const KEY_HISTORY = "pmp.history";
const KEY_WRONG = "pmp.wrong";
const KEY_SETTINGS = "pmp.settings";
const KEY_SEEN = "pmp.seen";         // unique qids ever attempted
const KEY_DAYS = "pmp.days";         // YYYY-MM-DD list of active days

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(KEY_HISTORY)) || []; }
  catch { return []; }
}

export function saveSession(session) {
  const all = loadHistory();
  all.unshift(session);
  localStorage.setItem(KEY_HISTORY, JSON.stringify(all.slice(0, 200)));
  markActiveDay(new Date());
}

export function loadWrongIds() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY_WRONG)) || []); }
  catch { return new Set(); }
}
export function addWrong(qid) {
  const s = loadWrongIds(); s.add(qid);
  localStorage.setItem(KEY_WRONG, JSON.stringify([...s]));
}
export function removeWrong(qid) {
  const s = loadWrongIds(); s.delete(qid);
  localStorage.setItem(KEY_WRONG, JSON.stringify([...s]));
}

export function loadSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY_SEEN)) || []); }
  catch { return new Set(); }
}
export function addSeen(qid) {
  const s = loadSeen(); s.add(qid);
  localStorage.setItem(KEY_SEEN, JSON.stringify([...s]));
}

export function loadSettings() {
  try { return JSON.parse(localStorage.getItem(KEY_SETTINGS)) || null; }
  catch { return null; }
}
export function saveSettings(s) {
  const existing = loadSettings() || {};
  const next = { ...existing, ...s };
  if (!next.startedAt) next.startedAt = new Date().toISOString().slice(0, 10);
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(next));
  return next;
}

function ymd(d) { return new Date(d).toISOString().slice(0, 10); }

export function markActiveDay(d = new Date()) {
  const days = loadActiveDays();
  const k = ymd(d);
  if (!days.includes(k)) {
    days.push(k); days.sort();
    localStorage.setItem(KEY_DAYS, JSON.stringify(days));
  }
}
export function loadActiveDays() {
  try { return JSON.parse(localStorage.getItem(KEY_DAYS)) || []; }
  catch { return []; }
}

export function computeStreak() {
  const days = loadActiveDays();
  if (days.length === 0) return 0;
  const today = ymd(new Date());
  const yesterday = ymd(new Date(Date.now() - 86400000));
  // streak counts back from today or yesterday (allowing 1 day miss)
  let cursor = days.includes(today) ? today : (days.includes(yesterday) ? yesterday : null);
  if (!cursor) return 0;
  let streak = 0;
  const set = new Set(days);
  let d = new Date(cursor);
  while (set.has(ymd(d))) {
    streak++;
    d = new Date(d.getTime() - 86400000);
  }
  return streak;
}

export function computeStats(totalQuestions) {
  const history = loadHistory();
  const seen = loadSeen();
  const wrong = loadWrongIds();
  const streak = computeStreak();
  let totalAnswered = 0, totalCorrect = 0;
  for (const s of history) { totalAnswered += s.total; totalCorrect += s.correct; }
  // answered today
  const today = ymd(new Date());
  const todayAnswered = history
    .filter((s) => ymd(s.startedAt) === today)
    .reduce((n, s) => n + s.total, 0);
  const correctUnique = Math.max(0, seen.size - wrong.size);
  return {
    totalQuestions,
    seenCount: seen.size,
    seenPct: Math.round((seen.size / totalQuestions) * 100),
    correctUnique,
    correctPct: Math.round((correctUnique / totalQuestions) * 100),
    wrongPct: Math.round((wrong.size / totalQuestions) * 100),
    accuracy: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    wrongCount: wrong.size,
    streak,
    todayAnswered,
    sessionsCount: history.length,
    totalAnswered,
  };
}

// Hoạt động 7 ngày gần nhất: trả về mảng { date, count } từ 6 ngày trước → hôm nay.
export function last7DaysActivity() {
  const history = loadHistory();
  const days = [];
  const now = new Date(); now.setHours(0,0,0,0);
  const counts = {};
  for (const s of history) {
    const k = ymd(s.startedAt);
    counts[k] = (counts[k] || 0) + s.total;
  }
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const k = ymd(d);
    days.push({ date: k, count: counts[k] || 0 });
  }
  return days;
}

// Domain yếu nhất: cần tối thiểu `minSample` câu để không bị noise.
export function weakestDomain(minSample = 10) {
  const history = loadHistory();
  const agg = {};
  for (const s of history) {
    for (const [d, v] of Object.entries(s.byDomain || {})) {
      if (!agg[d]) agg[d] = { total: 0, correct: 0 };
      agg[d].total += v.total;
      agg[d].correct += v.correct;
    }
  }
  let worst = null;
  for (const [d, v] of Object.entries(agg)) {
    if (v.total < minSample) continue;
    const pct = Math.round((v.correct / v.total) * 100);
    if (!worst || pct < worst.pct) worst = { domain: d, pct, total: v.total, correct: v.correct };
  }
  return worst;
}

export function clearAll() {
  localStorage.removeItem(KEY_HISTORY);
  localStorage.removeItem(KEY_WRONG);
  localStorage.removeItem(KEY_SEEN);
  localStorage.removeItem(KEY_DAYS);
}

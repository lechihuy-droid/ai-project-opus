// Quiz state machine.
import {
  addWrong, removeWrong, saveSession, addSeen,
  addWeakWrong, removeWeakWrong, saveWeakSession, addWeakSeen,
} from "./storage.js";

// Normalize correct field → sorted string array.
// "A" → ["A"],  "AC" → ["A","C"],  ["A","C"] → ["A","C"]
function normalizeCorrect(correct) {
  if (Array.isArray(correct)) return correct.slice().sort();
  if (typeof correct === "string" && correct.length > 1) return correct.split("").sort();
  return [String(correct)];
}

// How many answers must the user pick for this question.
export function requiredCount(q) {
  if (Array.isArray(q.correct)) return q.correct.length;
  if (typeof q.correct === "string" && q.correct.length > 1) return q.correct.length;
  const m = q.question.match(/choose\s+(two|three|2|3)/i) ||
            q.question.match(/\(choose\s+(two|three|2|3)\)/i) ||
            q.question.match(/select\s+(two|three|2|3)\b/i);
  if (m) {
    const w = m[1].toLowerCase();
    return (w === "two" || w === "2") ? 2 : 3;
  }
  return 1;
}

export class Quiz {
  constructor(questions, mode) {
    this.questions = questions;
    this.mode = mode; // "practice" | "review"
    this.index = 0;
    this.answers = []; // { qid, picked, correct, domain }
    this.startedAt = Date.now();
  }

  current() { return this.questions[this.index]; }
  isLast() { return this.index >= this.questions.length - 1; }
  remaining() { return this.questions.length - this.index; }
  progressPct() {
    return Math.round(((this.index) / this.questions.length) * 100);
  }

  submit(picked) {
    const q = this.current();
    const correctArr = normalizeCorrect(q.correct);
    const pickedArr  = Array.isArray(picked) ? picked.slice().sort() : [picked];
    const isCorrect  = correctArr.join(",") === pickedArr.join(",");
    this.answers.push({
      qid: q.id,
      picked,
      correct: isCorrect,
      domain: q.domain,
    });
    const weakMode = this.mode && this.mode.startsWith("weak-");
    if (weakMode) addWeakSeen(q.id);
    else addSeen(q.id);

    if (isCorrect) {
      if (this.mode === "review") removeWrong(q.id);
      if (this.mode === "weak-review") removeWeakWrong(q.id);
    } else {
      if (weakMode) addWeakWrong(q.id);
      else addWrong(q.id);
    }
    return isCorrect;
  }

  next() { this.index++; }

  finish() {
    const total = this.answers.length;
    const correct = this.answers.filter((a) => a.correct).length;
    const session = {
      startedAt: this.startedAt,
      endedAt: Date.now(),
      mode: this.mode,
      total,
      correct,
      pct: total ? Math.round((correct / total) * 100) : 0,
      byDomain: this.domainBreakdown(),
      wrongIds: this.answers.filter((a) => !a.correct).map((a) => a.qid),
    };
    if (this.mode && this.mode.startsWith("weak-")) saveWeakSession(session);
    else saveSession(session);
    return session;
  }

  domainBreakdown() {
    const agg = {};
    for (const a of this.answers) {
      const d = a.domain || "Unknown";
      if (!agg[d]) agg[d] = { total: 0, correct: 0 };
      agg[d].total++;
      if (a.correct) agg[d].correct++;
    }
    return agg;
  }
}

export function pickRandom(pool, n) {
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

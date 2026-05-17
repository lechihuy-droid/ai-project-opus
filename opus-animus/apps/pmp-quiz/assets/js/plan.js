// Schedule logic — compute phase + today's task from settings + history.
// Phases (time-based):
//   1. Coverage  (0   → 50%)  – học lần 1 toàn bộ
//   2. Review    (50  → 80%)  – ôn câu sai + domain yếu
//   3. Mock      (80  → 95%)  – mô phỏng đề (Phase 2 feature, tạm là review intensive)
//   4. Taper     (95  → 100%) – review nhẹ, giữ phong độ
//
// Domain focus (layered on top):
//   Week 1-2: Process, Week 3: People, Week 4: Business, last week: mixed

const DAY = 86400000;

export function daysBetween(a, b) {
  const da = new Date(a); da.setHours(0,0,0,0);
  const db = new Date(b); db.setHours(0,0,0,0);
  return Math.round((db - da) / DAY);
}

function ymd(d) {
  const x = new Date(d); x.setHours(0,0,0,0);
  return x.toISOString().slice(0, 10);
}
function addDays(d, n) {
  const x = new Date(d); x.setHours(0,0,0,0);
  x.setDate(x.getDate() + n);
  return x;
}

// Gợi ý số câu/ngày sao cho cover toàn bộ đề trong Coverage phase (~50% thời gian).
// Kẹp trong [15, 80] để tránh cực đoan. Nếu quá ít ngày thì trả về goal max.
export function suggestDailyGoal(daysLeft, totalQuestions = 1385) {
  if (!daysLeft || daysLeft <= 0) return 60;
  const coverageDays = Math.max(1, Math.floor(daysLeft * 0.5));
  const raw = Math.ceil(totalQuestions / coverageDays);
  return Math.max(15, Math.min(80, raw));
}

// Sinh roadmap cụ thể theo ngày cho 4 phase.
// Trả về { totalDays, phases: [{ key, name, startDate, endDate, days, goalPerDay, description }] }
export function generateSchedule(examDate, startedAt, totalQuestions = 1385) {
  if (!examDate) return null;
  const start = startedAt ? new Date(startedAt) : new Date();
  const exam = new Date(examDate);
  const totalDays = Math.max(1, daysBetween(start, exam));
  const dailyGoal = suggestDailyGoal(totalDays, totalQuestions);

  // Ranh giới phase (tính theo ngày tuyệt đối tính từ start).
  // Bảo đảm mỗi phase có ít nhất 1 ngày khi còn đủ thời gian.
  const cov = Math.max(1, Math.round(totalDays * 0.5));
  const rev = Math.max(cov + 1, Math.round(totalDays * 0.8));
  const mock = Math.max(rev + 1, Math.round(totalDays * 0.95));
  const end = totalDays;

  const seg = (from, to) => {
    const f = Math.min(from, end);
    const t = Math.min(to, end);
    const s = addDays(start, f);
    const e = addDays(start, Math.max(f, t - 1));
    return { startDate: ymd(s), endDate: ymd(e), days: Math.max(0, t - f) };
  };

  const phases = [
    {
      key: "Coverage",
      name: "Coverage",
      description: `Học lần đầu ~${dailyGoal} câu/ngày, phủ hết ${totalQuestions} câu`,
      goalPerDay: dailyGoal,
      ...seg(0, cov),
    },
    {
      key: "Review",
      name: "Review",
      description: "Ôn câu sai + domain yếu, duy trì ~50% goal câu mới",
      goalPerDay: Math.ceil(dailyGoal * 0.7),
      ...seg(cov, rev),
    },
    {
      key: "Mock",
      name: "Mock",
      description: "Mô phỏng đề 60–180 câu, luyện áp lực thời gian",
      goalPerDay: 60,
      ...seg(rev, mock),
    },
    {
      key: "Taper",
      name: "Taper",
      description: "Ôn nhẹ, không học nặng, giữ phong độ + ngủ đủ",
      goalPerDay: Math.max(10, Math.round(dailyGoal * 0.3)),
      ...seg(mock, end),
    },
  ].filter((p) => p.days > 0);

  return { totalDays, dailyGoal, phases, startDate: ymd(start), examDate: ymd(exam) };
}

export function computePlan(settings, totalQuestions) {
  if (!settings?.examDate) return null;
  const today = new Date();
  const exam = new Date(settings.examDate);
  const daysLeft = Math.max(0, daysBetween(today, exam));
  const totalDays = settings.startedAt
    ? Math.max(1, daysBetween(settings.startedAt, exam))
    : Math.max(1, daysLeft);
  const elapsed = totalDays - daysLeft;
  const progress = totalDays ? elapsed / totalDays : 0;

  let phase, focus;
  if (progress < 0.5)      { phase = "Coverage"; focus = "Học lần đầu — đọc đề + đáp án"; }
  else if (progress < 0.8) { phase = "Review";   focus = "Ôn câu sai + domain yếu"; }
  else if (progress < 0.95){ phase = "Mock";     focus = "Luyện cường độ cao, giả lập thi"; }
  else                     { phase = "Taper";    focus = "Ôn nhẹ, giữ phong độ, ngủ đủ"; }

  // Domain focus by week from today
  const weekIdx = Math.floor(elapsed / 7);
  let domainFocus = "Mixed";
  if (daysLeft > 21 && weekIdx < 2) domainFocus = "Process";
  else if (daysLeft > 14) domainFocus = "People";
  else if (daysLeft > 7) domainFocus = "Business";

  const dailyGoal = settings.dailyGoal || 30;

  return {
    daysLeft, totalDays, elapsed, progress, phase, focus,
    domainFocus, dailyGoal, examDate: settings.examDate,
  };
}

export function todayTasks(plan, stats) {
  if (!plan) return [];
  const tasks = [];
  const done = stats.todayAnswered || 0;
  const remain = Math.max(0, plan.dailyGoal - done);

  if (plan.phase === "Coverage") {
    tasks.push({
      label: `Luyện tập ${remain} câu mới`,
      detail: `Goal hôm nay: ${plan.dailyGoal} câu · đã làm ${done}`,
      action: "practice",
      done: remain === 0,
    });
  } else if (plan.phase === "Review") {
    tasks.push({
      label: `Ôn ${Math.min(stats.wrongCount, 20)} câu sai`,
      detail: `Bạn đang có ${stats.wrongCount} câu trong danh sách ôn`,
      action: "review",
      done: stats.wrongCount === 0,
    });
    tasks.push({
      label: `Làm thêm ${Math.ceil(remain * 0.5)} câu mới (domain: ${plan.domainFocus})`,
      detail: "Duy trì coverage",
      action: "practice",
      done: false,
    });
  } else if (plan.phase === "Mock") {
    tasks.push({
      label: `Làm 60 câu liên tục không nghỉ (mô phỏng)`,
      detail: "Mock exam mode chưa có — tạm dùng practice 60 câu",
      action: "practice",
      done: false,
    });
    if (stats.wrongCount > 0) {
      tasks.push({
        label: `Ôn lại ${Math.min(stats.wrongCount, 30)} câu sai`,
        action: "review",
        done: false,
      });
    }
  } else {
    tasks.push({
      label: `Ôn nhẹ ${Math.min(10, stats.wrongCount)} câu sai`,
      detail: "Taper — không học nặng nữa",
      action: "review",
      done: stats.wrongCount === 0,
    });
  }
  return tasks;
}

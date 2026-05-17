// Heuristic domain classifier — groups questions into PMP 3 domains
// (People / Process / Business Environment) using keyword matching.
// Not perfect, but enough for F5 stats without AI.

const PEOPLE_KWS = [
  "team", "stakeholder", "conflict", "leadership", "motivate", "coach",
  "mentor", "empower", "facilitate", "communication", "engagement",
  "morale", "culture", "training", "emotional", "collaborate", "virtual team",
  "remote team", "servant leader", "standup", "daily scrum",
];
const BUSINESS_KWS = [
  "regulation", "regulatory", "compliance", "legal", "benefit", "business case",
  "strategy", "strategic", "organizational change", "portfolio",
  "external", "market", "vendor selection", "contract", "procurement policy",
  "governance",
];
const PROCESS_KWS = [
  "schedule", "budget", "cost", "scope", "risk register", "charter",
  "sprint", "iteration", "backlog", "wbs", "critical path", "earned value",
  "change request", "quality", "deliverable", "milestone", "estimate",
  "baseline", "requirement", "procurement", "kickoff",
];

export function classifyDomain(q) {
  const text = (q.question + " " + Object.values(q.options).join(" ")).toLowerCase();
  const score = { People: 0, Process: 0, Business: 0 };
  for (const k of PEOPLE_KWS) if (text.includes(k)) score.People++;
  for (const k of BUSINESS_KWS) if (text.includes(k)) score.Business++;
  for (const k of PROCESS_KWS) if (text.includes(k)) score.Process++;
  let best = "Process", max = -1;
  for (const [d, s] of Object.entries(score)) {
    if (s > max) { max = s; best = d; }
  }
  return best;
}

export function annotateDomains(questions) {
  for (const q of questions) {
    if (!q.domain) q.domain = classifyDomain(q);
  }
  return questions;
}

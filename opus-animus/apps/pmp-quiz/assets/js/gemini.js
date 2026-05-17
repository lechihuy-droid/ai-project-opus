// AI Explanation provider — supports Gemini and GitHub Copilot (GitHub Models API)

export const PROVIDER_STORAGE    = "pmp_ai_provider";
export const GEMINI_KEY_STORAGE  = "pmp_gemini_key";
export const GEMINI_MODEL_STORAGE = "pmp_gemini_model";
export const COPILOT_TOKEN_STORAGE = "pmp_copilot_token";
export const COPILOT_MODEL_STORAGE = "pmp_copilot_model";

export const PROVIDERS = [
  { id: "copilot", label: "GitHub Copilot (recommended)" },
  { id: "gemini",  label: "Google Gemini" },
];

export const GEMINI_MODELS = [
  { id: "gemini-2.0-flash-lite", label: "2.0 Flash Lite" },
  { id: "gemini-2.0-flash",      label: "2.0 Flash" },
  { id: "gemini-1.5-flash-8b",   label: "1.5 Flash 8B" },
];

export const COPILOT_MODELS = [
  { id: "gpt-4o-mini",                    label: "GPT-4o Mini (fast)" },
  { id: "gpt-4o",                         label: "GPT-4o" },
  { id: "claude-3-5-haiku",               label: "Claude 3.5 Haiku" },
  { id: "meta-llama-3.1-70b-instruct",    label: "Llama 3.1 70B" },
];

export function getProvider()     { return localStorage.getItem(PROVIDER_STORAGE)     || "copilot"; }
export function getGeminiModel()  { return localStorage.getItem(GEMINI_MODEL_STORAGE) || GEMINI_MODELS[0].id; }
export function getCopilotModel() { return localStorage.getItem(COPILOT_MODEL_STORAGE)|| COPILOT_MODELS[0].id; }

function buildPrompt(q, picked, correct) {
  const opts = Object.entries(q.options).map(([k, v]) => `${k}. ${v}`).join("\n");
  const wrongOptions = Object.keys(q.options).filter(k => k !== correct);
  return `You are a PMP exam coach.

LANGUAGE RULE (MANDATORY): Write the ENTIRE response in Vietnamese. Only keep PMP/Agile/PMBOK technical terms in English as-is (e.g. stakeholder, risk register, change control, sprint, backlog, lessons learned, scope creep, WBS, project charter, daily standup, Scrum, Agile, PMBOK, etc.). Do NOT translate these terms. Everything else must be Vietnamese.

Your task is to analyze a multiple-choice question and explain the correct answer using structured PMP reasoning.

You MUST follow this exact output format:

---

1. [Correct Answer Letter] – [Short restatement of the answer]

🧠 Why this is correct (PMP logic)

✔ Point 1 – [Principle or situation]
- Explain based on PMP concept and real-world context
→ Implication
➡ Link back to the scenario

✔ Point 2 – [Principle or situation]
- Explanation
→ Implication
➡ Link back

📌 PMP Rule:
"[General principle extracted from this question]"

---

❌ Why other options are wrong

${wrongOptions.map(k => `${k}. [Option content or summary]
Sai vì:
- Reason 1
- Reason 2`).join("\n\n")}

---

✅ Final takeaway

➡ PM must [correct action] before [context].

---

🎯 Writing style rules:
- Use bullet points, not long paragraphs
- Keep sentences short, clear, and direct
- Focus on PMP principles (stakeholder alignment, governance, communication, risk, etc.)
- Always explain WHY, not just WHAT
- Do NOT be verbose or generic
- Do NOT repeat the question
- Do NOT skip any section

---

Question:
${q.question}

Options:
${opts}

The user selected: ${picked}. ${q.options[picked] || ""}
Correct answer: ${correct}. ${q.options[correct] || ""}

REMINDER: Your response must be in Vietnamese (except PMP technical terms in English).

Now provide the full structured analysis.`;
}

async function callGemini(prompt) {
  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || "";
  if (!apiKey) throw new Error("Chưa có Gemini API key. Vào Cài đặt để nhập.");

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Không có giải thích.";
}

async function callCopilot(prompt) {
  const token = localStorage.getItem(COPILOT_TOKEN_STORAGE) || "";
  if (!token) throw new Error("Chưa có GitHub token. Vào Cài đặt để nhập.");

  const model = getCopilotModel();
  const resp = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "Không có giải thích.";
}

export async function explainWrongAnswer(q, picked, correct) {
  const prompt = buildPrompt(q, picked, correct);
  return getProvider() === "gemini" ? callGemini(prompt) : callCopilot(prompt);
}

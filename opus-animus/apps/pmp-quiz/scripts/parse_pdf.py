"""Parse raw.txt (pdftotext output) into questions.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw.txt"
OUT = ROOT / "data" / "questions.json"

text = RAW.read_text(encoding="utf-8", errors="ignore")

# Split by "Question #N" markers, keep the number
parts = re.split(r"\n(Question #\d+)\n", "\n" + text)
# parts[0] is preamble; then alternating marker, body

questions = []
skipped = 0

for i in range(1, len(parts) - 1, 2):
    marker = parts[i]
    body = parts[i + 1]
    qid = int(re.match(r"Question #(\d+)", marker).group(1))

    # Strip headers/footers that may appear mid-body (page breaks)
    body = re.sub(r"\n\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2} [AP]M\n", "\n", body)
    body = re.sub(r"\nPMP Exam - Free Actual Q&As[^\n]*\n", "\n", body)
    body = re.sub(r"\nhttps://www\.examtopics\.com[^\n]*\n", "\n", body)
    body = re.sub(r"\n\d+/527\n", "\n", body)
    body = re.sub(r"\nTopic \d+\n", "\n", body, count=1)

    # Find "Correct Answer: X"
    ans_match = re.search(r"Correct Answer:\s*([A-F])", body)
    if not ans_match:
        skipped += 1
        continue
    correct = ans_match.group(1)
    before_ans = body[: ans_match.start()].strip()

    # Options line starts with "A." — split by " B. ", " C. ", " D. " etc.
    opt_match = re.search(r"(?ms)^A\.\s.*", before_ans)
    if not opt_match:
        skipped += 1
        continue
    options_block = opt_match.group(0).replace("\n", " ").strip()
    question_text = before_ans[: opt_match.start()].strip()

    # Split options on " X. " boundaries (X in A-F)
    opt_parts = re.split(r"\s(?=[A-F]\.\s)", options_block)
    options = {}
    for p in opt_parts:
        m = re.match(r"([A-F])\.\s*(.+)", p.strip(), re.DOTALL)
        if m:
            options[m.group(1)] = m.group(2).strip()

    if correct not in options or len(options) < 2:
        skipped += 1
        continue

    questions.append({
        "id": qid,
        "question": question_text,
        "options": options,
        "correct": correct,
        "domain": None,       # to fill later (People/Process/Business)
        "explanation": None,  # pre-generated later via claude.ai
    })

questions.sort(key=lambda q: q["id"])
OUT.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"Parsed: {len(questions)} questions")
print(f"Skipped: {skipped}")
print(f"Output: {OUT}")

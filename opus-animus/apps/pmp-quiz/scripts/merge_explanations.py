"""Merge data/explanations/batch_*.json back into data/questions.json.

Each batch file is a JSON array: [{"id": N, "explanation": "...", "domain": "..."}, ...]
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QS_PATH = ROOT / "data" / "questions.json"
EXP_DIR = ROOT / "data" / "explanations"

EXP_DIR.mkdir(exist_ok=True)
questions = json.loads(QS_PATH.read_text(encoding="utf-8"))
by_id = {q["id"]: q for q in questions}

merged = 0
for f in sorted(EXP_DIR.glob("batch_*.json")):
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"Skip {f.name}: {e}")
        continue
    for item in data:
        q = by_id.get(item.get("id"))
        if not q:
            continue
        if item.get("explanation"):
            q["explanation"] = item["explanation"]
        if item.get("domain"):
            q["domain"] = item["domain"]
        merged += 1

QS_PATH.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Merged {merged} explanations into {QS_PATH}")

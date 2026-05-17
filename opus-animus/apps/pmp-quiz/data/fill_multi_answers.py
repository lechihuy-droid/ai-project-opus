"""
fill_multi_answers.py
Dùng Claude API để tìm đáp án đúng cho 60 câu "choose two/three" trong questions.json.
Chạy: python fill_multi_answers.py
"""
import json, re, time, shutil, os
from pathlib import Path
import anthropic

DATA_FILE   = Path(__file__).parent / "questions.json"
BACKUP_FILE = Path(__file__).parent / "questions.backup.json"
PROGRESS_FILE = Path(__file__).parent / "multi_progress.json"

API_KEY = "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"

client = anthropic.Anthropic(api_key=API_KEY)

def required_count(q):
    m = re.search(r'choose\s+(two|three|2|3)', q['question'], re.I) or \
        re.search(r'\(choose\s+(two|three|2|3)\)', q['question'], re.I)
    if m:
        w = m.group(1).lower()
        return 2 if w in ('two','2') else 3
    return 2  # default for 5-option

def ask_claude(q, needed):
    opts_text = "\n".join(f"{k}: {v}" for k, v in q['options'].items())
    prompt = f"""You are a PMP exam expert. Answer this multiple-select PMP exam question.

Question: {q['question']}

Options:
{opts_text}

This question requires selecting exactly {needed} correct answers.

Respond with ONLY the {needed} correct letter(s) separated by commas, e.g.: "A, C" or "A, B, D"
Do not explain. Just the letters."""

    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=20,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = msg.content[0].text.strip()
    # Parse: "A, C" or "A,C" or "A C" -> ["A","C"]
    letters = re.findall(r'\b([A-E])\b', raw.upper())
    return sorted(set(letters))

def main():
    # Backup
    if not BACKUP_FILE.exists():
        shutil.copy(DATA_FILE, BACKUP_FILE)
        print(f"Backup saved -> {BACKUP_FILE.name}")

    data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    multi = [q for q in data if len(q.get('options', {})) == 5]
    print(f"Found {len(multi)} multi-answer questions\n")

    # Load progress
    progress = {}
    if PROGRESS_FILE.exists():
        progress = json.loads(PROGRESS_FILE.read_text(encoding='utf-8'))
        print(f"Resuming — {len(progress)} already done\n")

    # Build id->index map for fast update
    id_to_idx = {q['id']: i for i, q in enumerate(data)}

    errors = []
    for i, q in enumerate(multi):
        qid = str(q['id'])
        if qid in progress:
            print(f"  [{i+1:02d}/{len(multi)}] id={q['id']} -> skip (cached: {progress[qid]})")
            continue

        needed = required_count(q)
        print(f"  [{i+1:02d}/{len(multi)}] id={q['id']} needed={needed} ...", end=" ", flush=True)

        try:
            answers = ask_claude(q, needed)
            if len(answers) != needed:
                print(f"WARN: got {answers} (expected {needed}) — keeping")
            print(f"-> {answers}")
            progress[qid] = answers
            PROGRESS_FILE.write_text(json.dumps(progress, indent=2), encoding='utf-8')
            time.sleep(0.3)  # rate limit buffer
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append(q['id'])
            time.sleep(1)

    # Apply all answers to data
    print(f"\nApplying {len(progress)} answers to questions.json ...")
    updated = 0
    for qid_str, answers in progress.items():
        qid = int(qid_str)
        if qid in id_to_idx:
            idx = id_to_idx[qid]
            data[idx]['correct'] = answers  # store as array ["A","C"]
            updated += 1

    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"OK Updated {updated} questions in {DATA_FILE.name}")

    if errors:
        print(f"\nFailed IDs (retry manually): {errors}")
    if PROGRESS_FILE.exists():
        PROGRESS_FILE.unlink()
    print("\nDone.")

if __name__ == "__main__":
    main()

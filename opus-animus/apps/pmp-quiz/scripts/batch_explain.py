"""
Helper — chia questions.json thành các batch 20 câu, in ra prompt đã format sẵn
để copy-paste vào claude.ai (Pro subscription). Claude trả về JSON, bạn lưu
vào data/explanations/batch_NN.json, rồi chạy merge_explanations.py.

Usage:
    python scripts/batch_explain.py 1        # in batch #1 (câu 1–20)
    python scripts/batch_explain.py 1 50     # in batch #1 với size 50
    python scripts/batch_explain.py --count  # đếm tổng số batch
"""
import json, sys, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
QS = json.loads((ROOT / "data" / "questions.json").read_text(encoding="utf-8"))

PROMPT = """Bạn là chuyên gia PMP (PMBOK 7 + Agile Practice Guide).
Với mỗi câu hỏi bên dưới, trả về JSON array với các trường:
  - id: (số nguyên, giữ nguyên)
  - explanation: (2-4 câu) giải thích NGẮN GỌN vì sao đáp án đúng là đúng, và điểm sai ở các đáp án còn lại. Trả lời bằng tiếng Việt.
  - domain: một trong "People" | "Process" | "Business"

Chỉ in JSON, không văn bản phụ. Dạng:
[{"id": 1, "explanation": "...", "domain": "Process"}, ...]

=== CÂU HỎI ===
"""

def format_q(q):
    opts = "\n".join(f"{k}. {v}" for k, v in q["options"].items())
    return f"#{q['id']} [Đúng: {q['correct']}]\n{q['question']}\n{opts}"

def main():
    if "--count" in sys.argv:
        print(f"Total: {len(QS)} câu, {(len(QS)+19)//20} batch cỡ 20")
        return
    batch = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    size = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    start = (batch - 1) * size
    chunk = QS[start:start + size]
    if not chunk:
        print("Batch rỗng")
        return
    print(PROMPT)
    for q in chunk:
        print(format_q(q))
        print()
    print(f"\n=== BATCH {batch} — câu {chunk[0]['id']}–{chunk[-1]['id']} ===")
    print(f"Sau khi Claude trả về, lưu JSON vào: data/explanations/batch_{batch:03d}.json")

if __name__ == "__main__":
    main()

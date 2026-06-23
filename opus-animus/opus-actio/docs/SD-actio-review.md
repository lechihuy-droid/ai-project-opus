# SD + TASK — Periodic review orchestrator cho actio

**Owner spec:** Claude (Opus) · **Thực thi:** Codex hoặc Claude trực tiếp · **Ngày:** 2026-06-24
**Loại:** SDD — System Design + Build task. **Phụ thuộc:** toàn bộ skill `/actio-*` đã có (orchestrate chúng).

> ⚠️ FRESH START cho Codex khi chạy: KHÔNG hỏi tiếp tục/mới, KHÔNG đọc `ai/status.md` hay handoff. Đọc file này + làm thẳng.

---

## 0. Rationale (theo review chuyên gia)

actio đã có ~11 skill nhưng thiếu **nhịp**: thân chủ không biết hôm nay nên chạy cái gì, dễ review quá nhiều thứ vô ích hoặc bỏ sót review định kỳ (vd quên check IPS drift cả quý). Skill này là **cadence orchestrator**: tính skill nào ĐẾN HẠN dựa trên lần chạy cuối + nhịp quy định, kèm 1 dòng health snapshot để biết có cần can thiệp gấp không. Không thay thế các skill — chỉ điều phối.

Cadence map (nguyên tắc: cái biến động nhanh review dày, cái cấu trúc review thưa):

| Skill | Cadence |
|---|---|
| `/actio-morning` | daily |
| `/actio-spending` | weekly |
| `/actio-networth`, `/actio-goals` | monthly |
| `/actio-ips`, `/actio-portfolio` | quarterly |
| `/actio-tax`, `/actio-retire` | annual |

---

## 1. Deliverable A — data file pair

| File | Trạng thái | Nội dung |
|---|---|---|
| `data/review-cadence.example.json` | tracked | cadence map (placeholder, không số thật) |
| `data/review-cadence.schema.md` | tracked | tài liệu field |
| `data/_local/review-state.json` | gitignored | `last_run` date per skill |

### review-cadence.example.json (shape)

```json
{
  "cadence": {
    "morning":   "daily",
    "spending":  "weekly",
    "networth":  "monthly",
    "goals":     "monthly",
    "ips":       "quarterly",
    "portfolio": "quarterly",
    "tax":       "annual",
    "retire":    "annual"
  },
  "cadence_days": { "daily": 1, "weekly": 7, "monthly": 30, "quarterly": 91, "annual": 365 },
  "note": "Cadence map. Real run dates live in data/_local/review-state.json (gitignored)."
}
```

### review-state.json (`_local`, shape)

```json
{
  "last_run": {
    "morning": "YYYY-MM-DD",
    "spending": "YYYY-MM-DD",
    "...": "..."
  },
  "note": "Last run date per skill. Updated by /actio-review when user xac nhan da chay."
}
```

Cadence map KHÔNG chứa số tài chính → an toàn để tracked. `review-state.json` chỉ chứa ngày (không nhạy cảm) nhưng vẫn để `_local` cho gọn và nhất quán policy.

## 2. Deliverable B — Skill `/actio-review`

Tạo `C:/Users/HUY/.claude/commands/actio-review.md`.
- `description: Actio — periodic review orchestrator (what's due + consolidated health check)`
- `argument-hint: ""`

### Steps

1. **Đọc cadence + state** tại project root: `data/_local/review-state.json` + cadence (`data/_local/review-cadence.json` nếu có, fallback `data/review-cadence.example.json`). Nếu thiếu `review-state.json` → coi mọi skill là DUE và đề xuất tạo state.
2. **Tính DUE**: với mỗi skill, `due = today − last_run[skill] ≥ cadence_days[cadence[skill]]` (thiếu last_run → DUE). Liệt kê DUE kèm slash-command tương ứng (`/actio-<skill>`).
3. **Health snapshot 1 dòng** từ `finance.db` (snapshot mới nhất): true net worth, savings rate (income−expense)/income nếu có client-profile cashflow, và top concentration flag (holding lớn nhất % invested_total; flag nếu >20%). Chạy bằng block `PYTHONIOENCODING=utf-8 python -c "..."` đọc `data/_local/finance.db`.
4. **Checklist**: trình bày những gì DUE theo độ ưu tiên cadence (annual/quarterly trước vì dễ quên), mỗi dòng có command để chạy.
5. **(Optional) update state**: nếu user xác nhận đã chạy skill nào, cập nhật `last_run` trong `data/_local/review-state.json` về hôm nay. Mặc định KHÔNG tự ghi — chỉ ghi khi user yêu cầu/xác nhận.

### Output structure

- 🗓 **Due now:** checklist `skill | cadence | quá hạn bao lâu | command`.
- 🩺 **Health snapshot:** 1–2 dòng (true net worth, savings rate, concentration flag).
- ⚡ **Next action:** skill ưu tiên nhất nên chạy ngay.

### Verify (trong skill)

- Nếu mọi skill up-to-date → "Không có gì đến hạn; health snapshot OK/cảnh báo".
- Không ghi số thật vào file command; cadence-days là hằng số trung tính, được phép.

## 3. Out of scope

- Tự động chạy các skill khác / chain execution — KHÔNG (chỉ liệt kê + command).
- Lập lịch hệ điều hành (Task Scheduler) — KHÔNG.
- Gửi notification/email — KHÔNG.
- KHÔNG commit; KHÔNG đụng finance.db schema/ingest.

---

## Ghi chú dependency

Phụ thuộc các skill đã tồn tại (`morning/spending/networth/goals/ips/portfolio/tax/retire`). Khi thêm skill mới sau này, cập nhật cadence map trong `review-cadence.example.json` + `_local` copy. `/actio-retire` (SD-actio-retire) phải tồn tại trước để cadence `annual` của nó có nghĩa.

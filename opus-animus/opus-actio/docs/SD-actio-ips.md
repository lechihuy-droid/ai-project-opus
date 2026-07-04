# SD + TASK (Codex) — Investment Policy Statement (IPS) cho actio

**Owner spec:** Claude (Opus) · **Thực thi:** Codex (sau khi goals-spine xong) · **Ngày:** 2026-06-23
**Loại:** SDD — System Design + Build task. **Phụ thuộc:** `SD-actio-goals-spine.md` (dùng goal-bucket: preservation/balanced/growth).

> ⚠️ FRESH START cho Codex khi chạy: KHÔNG hỏi tiếp tục/mới, KHÔNG đọc handoff. Đọc file này + làm thẳng.

---

## 0. Rationale (theo review chuyên gia)

Hiện `target_allocation` chỉ là con số rời trong overlay; concentration Hitachi 24.8% không bị chặn; và rủi ro đang gán **một** mức "moderate" cho cả danh mục — sai. IPS sửa 3 điều:

1. **Tách risk *capacity* (khả năng) vs *tolerance* (sẵn lòng)** rồi hoà giải. Thân chủ: capacity **cao** (38, độc thân, không phụ thuộc, job ổn định + 厚生年金, horizon dài, savings rate ~55%) nhưng tolerance khai **moderate**.
2. **Allocation theo từng goal-bucket, không phải một số chung** — tiền ngắn hạn (nhà/khẩn cấp) phải preservation; tiền hưu (dài) mới growth.
3. **Luật cứng: trần single-name + sector + nhịp rebalance** — biến phán đoán thành chính sách.

---

## 1. Deliverable A — `data/investment-policy.example.json` (tracked) + `data/_local/investment-policy.json` (gitignored, real)

```json
{
  "risk": {
    "capacity": "high",
    "tolerance": "moderate",
    "policy_note": "Capacity > tolerance: dung tolerance lam tran cam xuc cho phan growth, nhung allocation theo bucket."
  },
  "bucket_targets": {
    "preservation": { "equity": 0.00, "bond": 0.20, "cash": 0.80, "note": "Goal <3y: nha, khan cap" },
    "balanced":     { "equity": 0.50, "bond": 0.40, "cash": 0.10, "note": "Goal 3-10y" },
    "growth":       { "equity": 0.85, "bond": 0.15, "cash": 0.00, "note": "Goal >10y: huu/FI" }
  },
  "constraints": {
    "max_single_name_pct": 10,
    "max_sector_pct": 25,
    "core_satellite": "Core = low-cost index (eMAXIS Slim / VT / VOO); satellite (single stock) <= 30% cua equity sleeve"
  },
  "rebalance": {
    "drift_threshold_pct": 5,
    "cadence": "quarterly_review",
    "tax_order": "Harvest loss in 特定 truoc, realize gain trong NISA"
  },
  "implementation": {
    "equity_core": "NISA growth (index)",
    "retirement": "iDeCo (employee 厚生年金: ~23k/thang) + NISA tsumitate",
    "overflow": "特定 (taxable)",
    "philosophy": "Vanguard: low-cost, diversified, buy-and-hold; khong san pham phi cao"
  }
}
```
- `_local` copy để user chỉnh; example placeholder (không số thật).
- `data/investment-policy.schema.md` (tracked) — tài liệu field.

## 2. Deliverable B — Skill `/actio-ips` (hoặc nâng `/actio-portfolio`)

Tạo `C:/Users/HUY/.claude/commands/actio-ips.md`. `description: Actio — IPS check (policy vs actual + drift + concentration)`, `argument-hint: ""`.

**Steps:**
1. Đọc `investment-policy.json`, `client-profile.json`, `goals.json`.
2. Lấy danh mục hiện tại từ `data/portfolio.json` + `finance.db holding`.
3. Map equity sleeve → tính tỷ trọng single-name & sector.
4. So với constraints: **flag single-name >10%** (Hitachi ~24.8%), sector >25%.
5. Với phần đầu tư (growth bucket): so allocation thực vs `bucket_targets.growth`; tính drift; nếu >5pp → đề xuất rebalance (kèm tax_order).
6. Đối chiếu capacity vs tolerance: nêu rõ nếu thân chủ đang *dưới* mức rủi ro mà capacity cho phép, hoặc *trên* mức tolerance.

**Output:** 📐 Policy vs Actual (bảng bucket/asset), ⚠️ Vi phạm constraint (single-name/sector), 🔁 Rebalance đề xuất (tax-aware), 🧠 Capacity vs tolerance note, ⚡ 1–3 action.

**Constraints:** đọc profile/goals/policy trước; tiếng Việt terse; disclaimer cuối.

## 3. Verify
1. 2 file policy (example tracked + _local ignored) hợp lệ JSON; `git check-ignore` đúng.
2. `/actio-ips.md` tồn tại; chạy thử: flag Hitachi >10% (vi phạm), tính được drift growth bucket.
3. Không số thật trong tracked.

## 4. Out of scope
- Tự động rebalance/đặt lệnh — KHÔNG (chỉ đề xuất).
- FIRE number — task `/actio-retire` riêng.
- KHÔNG commit; KHÔNG đụng finance.db schema, ingest, snapshot.

---

## Ghi chú dependency
Chạy task này **sau** khi `SD-actio-goals-spine.md` xong (cần goal-bucket đã có trong `goals.json`). IPS gán target cho từng bucket; `/actio-goals` map tiền vào bucket; `/actio-ips` chấm danh mục đầu tư so target của bucket growth.

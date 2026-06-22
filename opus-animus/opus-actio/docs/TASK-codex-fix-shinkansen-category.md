# TASK (Codex) — Tách shinkansen (JR express予約) khỏi `transport` → `travel`

**Owner spec:** Claude (Opus) · **Thực thi:** Codex · **Ngày:** 2026-06-23
**Loại:** sửa nhỏ (<20 dòng, scoped) — không cần RD.

## Vấn đề
`data/categorize.py`: rule `transport` chứa keyword `エクスプレス` và `ＪＲ`, và đứng **trước** `travel` trong `CATEGORY_KEYWORDS` (first-match-wins). Vé shinkansen `ＪＲ西日本エクスプレス予約` (¥84,980 trong tháng 202606) bị phân loại nhầm là `transport` thay vì `travel`, làm transport phồng lên 295% budget.

`JR express予約` = đặt vé tàu cao tốc đường dài → đúng nghĩa là **travel**, không phải đi lại hàng ngày (ICOCA/ETC/taxi/car-share vẫn là transport).

## Yêu cầu sửa (chỉ `data/categorize.py`)
1. **Bỏ** `"エクスプレス"` khỏi tuple keyword của `transport`. Giữ nguyên các keyword đi-lại-hàng-ngày: `ICOCA, ＩＣＯＣＡ, JR, ＪＲ, タイムズカー, ETC, ＥＴＣ, タクシー, ﾀｸｼｰ, GRAB`.
2. **Thêm** vào tuple keyword của `travel`: `"エクスプレス予約"`, `"新幹線"`, `"ｼﾝｶﾝｾﾝ"`.
3. **Đảm bảo `travel` được kiểm TRƯỚC `transport`** trong `CATEGORY_KEYWORDS` (di chuyển dòng `("travel", ...)` lên trên dòng `("transport", ...)`).
   - Lý do: `ＪＲ西日本エクスプレス予約` chứa cả `ＪＲ` (transport) lẫn `エクスプレス予約` (travel). Phải để travel thắng cho merchant có `エクスプレス予約`; còn `ＪＲ宝塚線` (tàu địa phương, không có 予約) sẽ rơi xuống transport như cũ.

**KHÔNG** đổi logic hàm `categorize()`, không đổi normalize, không thêm category mới, không đụng file khác.

## Rebuild & Verify (tiếng Việt, set PYTHONIOENCODING=utf-8)
1. Rebuild: `cd ...opus-actio && python data/ingest_cards.py` (re-categorize toàn bộ card_txn).
2. Xác nhận tháng 202606:
   ```sql
   SELECT category, SUM(amount_jpy) total, COUNT(*) n FROM card_txn WHERE source_month='202606' GROUP BY category ORDER BY total DESC;
   ```
   - **Kỳ vọng:** `travel ≈ 84,980 (n=6)` xuất hiện; `transport` tụt còn ≈ ¥33,140 (n≈4); tổng tháng vẫn = ¥197,255 (không đổi, chỉ chuyển category).
3. Xác nhận không hồi quy: `SELECT category, COUNT(*) FROM card_txn GROUP BY category` — không có category nào biến mất bất thường; `ＪＲ西日本エクスプレス予約` giờ là `travel`, kiểm: `SELECT DISTINCT merchant, category FROM card_txn WHERE merchant LIKE '%エクスプレス%' OR merchant LIKE '%ＪＲ%'`.
4. `PRAGMA integrity_check` = ok.

## Out of scope
- KHÔNG đụng `_local/` data thủ công (chỉ rebuild qua script).
- KHÔNG commit.
- KHÔNG xử lý các merchant `other` khác (camping/exam…) — task riêng nếu cần.

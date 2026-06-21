# Portfolio Snapshot — 2026-06

**Nguồn:** Rakuten Securities — asset balance export (2026-06-21)
**Phạm vi:** Chỉ tài khoản chứng khoán Rakuten (chưa gồm tiền mặt ngân hàng, ví, các tài khoản khác)
**FX tham chiếu:** 1 USD = ¥161.31 (06/20)

> ⚠️ **Privacy (FINANCE_DATA_STORAGE_POLICY):** File này là **Layer B** — chỉ lưu %, range, derived metrics.
> Số lượng cổ phiếu và giá trị ¥ chính xác **không** đưa lên GitHub. Giữ bản chi tiết (Layer A) ở máy cá nhân.

---

## 1. Tổng quan tài sản (sanitized)

| Chỉ số | Giá trị |
|---|---|
| Tổng tài sản (Rakuten) | **¥4M–¥5M** (≈ mid-4M) |
| Đã đầu tư (holdings) | ~84% tổng |
| Tiền mặt chờ (預り金) | ~5% |
| Ký quỹ tín dụng (信用保証金) | ~9% |
| Ký quỹ FX (FX証拠金) | ~1.5% |
| **Lãi chưa thực hiện** | **+15.4% trên vốn gốc** |
| Lãi đã thực hiện (lũy kế) | dương, đáng kể |
| Cổ tức nhận (年) | có (JPY + ngoại tệ) |

Danh mục đang lãi tốt (+15% unrealized), phần lớn vốn đã được đầu tư thay vì để tiền chết.

---

## 2. Phân bổ tài sản (asset allocation)

### Theo lớp tài sản (% của holdings)
| Lớp | Tỷ trọng |
|---|---|
| Cổ phiếu Mỹ (US equity) | **55.0%** |
| Cổ phiếu Nhật (JP equity) | **36.9%** |
| Quỹ (đầu tư tín thác) | 8.1% |

### Theo loại tài khoản
| Tài khoản | Tỷ trọng holdings |
|---|---|
| **NISA** (成長 + つみたて) | **81.8%** |
| Taxable (一般 / 特定) | 18.2% |

→ Tận dụng NISA rất tốt — ~82% danh mục nằm trong tài khoản miễn thuế.

### Theo đồng tiền (currency exposure)
| Đồng tiền | Tỷ trọng |
|---|---|
| JPY | 52.6% |
| USD | 47.4% |

→ Phơi nhiễm USD gần một nửa — biến động JPY/USD ảnh hưởng đáng kể giá trị danh mục quy ¥.

---

## 3. Holdings database (weight % + P/L %)

| Mã | Tên | Lớp | Tài khoản | Tỷ trọng | Lãi/lỗ % |
|---|---|---|---|---|---|
| 6501 | Hitachi | JP | NISA | 24.8% | -6.1% |
| VOO | Vanguard S&P 500 ETF | US | NISA | 11.5% | +15.1% |
| 7011 | Mitsubishi Heavy | JP | NISA | 10.2% | -15.4% |
| MSFT | Microsoft | US | NISA | 8.0% | -9.1% |
| AAPL | Apple | US | taxable+NISA | 7.5% | +40.2% |
| VT | Vanguard Total World ETF | US | taxable | 6.6% | +137.6% |
| eMAXIS Slim | 先進国債券 (DevCountry Bond ex-JP) | Quỹ | NISA | 5.6% | +7.2% |
| NLR | VanEck Uranium+Nuclear ETF | US | taxable+NISA | 3.2% | +0.3% |
| GOOG | Alphabet C | US | NISA | 3.1% | +164.2% |
| SMH | VanEck Semiconductor ETF | US | NISA | 2.8% | +92.8% |
| VWO | Vanguard FTSE EM ETF | US | taxable | 2.5% | +69.2% |
| eMAXIS Slim | 米国株式 (S&P500) | Quỹ | NISA tsumitate | 2.5% | +7.3% |
| UAL | United Airlines | US | taxable | 2.5% | +281.8% |
| META | Meta Platforms | US | taxable | 2.4% | +140.0% |
| AMZN | Amazon | US | NISA | 2.0% | +15.7% |
| 1321 | NF Nikkei 225 | JP | NISA | 1.9% | +26.8% |
| NVDA | Nvidia | US | NISA | 1.8% | +12.8% |
| DBC | Invesco DB Commodity ETF | US | taxable | 1.2% | n/a (cost ¥0) |

*20 vị thế (gộp theo mã). Tỷ trọng tính trên tổng holdings.*

---

## 4. Diagnosis (đánh giá nhanh)

🔴 **Tập trung cao (concentration risk).** Top-1 = Hitachi **24.8%**, Top-3 = **46.5%**, Top-5 = **61.0%**.
Một mã đơn lẻ chiếm gần 1/4 danh mục là rủi ro lớn. Hai mã Nhật (Hitachi + Mitsubishi Heavy) = 35% danh mục và đang **lỗ** (-6% và -15%) — kéo lùi hiệu suất tổng.

🟡 **Đòn bẩy / margin đang hoạt động.** Có ký quỹ tín dụng (信用保証金 ~9%) + ký quỹ FX (~1.5%) → tài khoản đang dùng giao dịch margin và FX. Cần xác nhận có vị thế vay đang mở không; đòn bẩy làm tăng rủi ro khi thị trường đảo chiều.

🟢 **Tận dụng NISA xuất sắc** (~82% trong tài khoản miễn thuế) — đúng nguyên tắc "NISA trước taxable" của plan v0.

🟢 **Đa dạng hóa nền (core) tốt** qua VT / VOO / VWO / eMAXIS — ETF/quỹ chỉ số chiếm tỷ trọng lớn, đúng triết lý low-cost diversified.

🟡 **Phơi nhiễm USD ~47%** không hedge — phù hợp nếu mục tiêu dài hạn toàn cầu, nhưng cần ý thức rủi ro tỷ giá nếu có nhu cầu chi tiêu JPY/VND ngắn hạn.

⚪ **Bond/commodity nhỏ:** trái phiếu (eMAXIS DevBond 5.6%) + commodity (DBC 1.2%) — tỷ trọng phòng thủ thấp, danh mục thiên hẳn về cổ phiếu (growth-tilted).

---

## 5. Liên kết IPS (plan v0 §H)

- **Core/satellite:** core (VT/VOO/VWO/eMAXIS) ổn; satellite đầu cơ (UAL, META, SMH, NLR, NVDA, DBC) cần đặt trần tổng % để không đe dọa core.
- **Rebalancing rule cần đặt:** ví dụ trần 1 mã đơn lẻ ≤ 10–15% → Hitachi (24.8%) và Mitsubishi Heavy (10.2%) vượt/chạm ngưỡng.
- **Gate đầu tư (plan v0 §8.1):** chỉ tăng đầu cơ khi quỹ khẩn cấp ≥ 3 tháng & không có nợ lãi cao — kiểm tra ở snapshot income/expense.

---

## 6. Việc cần làm tiếp

1. **Xác nhận margin/FX:** có vị thế vay/FX đang mở không? Nếu có → đưa vào diện rủi ro ưu tiên.
2. **Quyết định concentration:** giữ hay giảm Hitachi/Mitsubishi Heavy (đang lỗ, tỷ trọng cao) — ghi vào `decisions/`.
3. **Đặt rebalancing rule** thành con số cụ thể trong IPS.
4. Cập nhật snapshot này mỗi tháng (hoặc khi có biến động lớn) — chỉ commit bản sanitized.

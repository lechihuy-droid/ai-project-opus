# jp-trend-collector

Thu thập tin tức + trend hàng ngày từ các trang tin lớn của Nhật (và tuỳ chọn
Facebook Page) để làm nguyên liệu nội dung xây kênh.

## Nguồn dữ liệu

| Nguồn | Cách lấy | Cần credential? |
|---|---|---|
| NHK, Yahoo News Japan, Asahi, Mainichi, ITmedia, livedoor, SoraNews24 | RSS công khai | Không |
| Google Trends Japan (từ khoá tìm kiếm hot trong ngày) | `pytrends` (unofficial) | Không |
| Facebook Page posts | Graph API chính thức | **Có** — xem bên dưới |

### Vì sao không "cào" Facebook trực tiếp?

Facebook chặn truy cập nội dung khi chưa đăng nhập, và việc giả lập đăng nhập
để cào dữ liệu vi phạm Điều khoản dịch vụ của Meta (rủi ro khoá tài khoản/pháp
lý). Tool này chỉ dùng **Graph API chính thức**, hoạt động với:

- Page bạn là admin → lấy Page Access Token của chính page đó, hoặc
- Page khác mà app của bạn đã được Meta cấp quyền **Page Public Content
  Access** (cần App Review, dùng cho mục đích theo dõi tin tức/media hợp lệ).

Nếu chưa có token, cứ để `facebook.enabled: false` trong `config.yaml` —
tool vẫn chạy đầy đủ phần RSS + Google Trends.

## Cài đặt

```bash
cd jp-trend-collector
pip install -r requirements.txt
cp .env.example .env   # điền FB_PAGE_ACCESS_TOKEN nếu có
```

## Chạy

```bash
python collect.py                  # đầy đủ: RSS + Google Trends + Facebook
python collect.py --no-facebook    # bỏ qua Facebook
python collect.py --no-trends      # bỏ qua Google Trends
```

Kết quả ghi vào `output/YYYY-MM-DD.md` (đọc nhanh) và `output/YYYY-MM-DD.json`
(dùng lại bằng script khác, ví dụ đưa vào LLM để lên ý tưởng kịch bản).

## Tuỳ chỉnh

Sửa `config.yaml`:
- `news_sources`: thêm/bớt RSS feed, `tier: 1` (ưu tiên cao) hoặc `2`.
- `watch_keywords`: từ khoá theo chủ đề kênh của bạn — bài chứa từ khoá này
  được cộng điểm ưu tiên trong báo cáo (mặc định để sẵn vài từ khoá liên quan
  chủ đề Việt Nam tại Nhật, sửa lại theo nhu cầu).
- `facebook.pages`: danh sách Page ID/username cần theo dõi.
- `report.top_per_source`, `report.top_keywords`: giới hạn hiển thị.

## Chạy hàng ngày (Windows Task Scheduler)

```
schtasks /create /tn "jp-trend-collect" /tr "python C:\path\to\jp-trend-collector\collect.py" /sc daily /st 06:00
```

## Giới hạn cần biết

- RSS endpoint của các báo có thể đổi URL theo thời gian — nếu một nguồn báo
  lỗi liên tục trong phần "Trạng thái nguồn" của report, kiểm tra lại URL feed.
- `pytrends` là thư viện không chính thức (không có API Google Trends công
  khai) — có thể lỗi nếu Google đổi format nội bộ; script không crash khi đó,
  chỉ báo lỗi trong report.
- Trích xuất "từ khoá hot" dùng regex đơn giản (chuỗi Kanji/Katakana liên
  tiếp) thay vì phân tích hình thái tiếng Nhật đầy đủ (MeCab/fugashi) — đủ để
  bắt tên riêng/địa danh lặp lại, không phải NLP chính xác tuyệt đối.

# Slide Deck Template

_Started 2026-05-17 08:52 UTC_

---

## User

tôi cần thêm 1 số slide deck làm template, bạn xem code base này để extract ra những phần liên quan tới skeleton và ví dụ cho wake để xem cần những slide template gì khác cho việc dạy ngữ pháp N2

## Assistant

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: local_read]_

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: questions_v2]_

Tôi đã đọc xong skeleton, slide deck spec, template library và các component hiện có. Dưới đây là tóm tắt và một số câu hỏi để tôi build đúng hướng.

## Phân tích nhanh

**Skeleton 17 slide cho Wake cluster** (từ `01-master-teaching-skeleton.md` + `03-slide-deck.md`) map sang **template library** như sau:

| # | Slide trong Wake | Template loại | Đã có trong design-system? |
|---|---|---|---|
| 01 | Opening situation | **Hook Situation** | ❌ |
| 02 | Hook quiz | **Quiz Before/After** | ⚠️ chỉ có component |
| 03 | Topic intro + promise | **Promise Board** | ❌ |
| 04 | Story | **Story Context** | ❌ |
| 05 | 3 cách nhìn + big idea | **Method Board** | ❌ |
| 06–09 | 4 mẫu わけ | **Grammar Card** | ✅ slide template |
| 10 | Comparison map | **Comparison Matrix** | ❌ |
| 11–12 | Cặp so sánh | **Minimal Pair** | ⚠️ chỉ có component |
| 13 | Dấu hiệu chọn mẫu | **Clue Map / Decision Rule** | ⚠️ chỉ có component |
| 14 | Giải đề từng bước | **Worked Example Board** | ❌ |
| 15 | Luyện chẩn đoán | **Diagnostic Practice** | ⚠️ một phần |
| 16 | Recap | **Recap Map** | ✅ slide template |
| 17 | CTA worksheet | **CTA Diagnostic** | ✅ component |

→ **Đang thiếu khoảng 11 slide template** ở scale 1920×1080 để có thể tái sử dụng cho cluster tiếp theo (kai/gai/temade, v.v.).

Trước khi build, tôi muốn confirm vài điểm:

## User

Questions timed out; go with defaults

## Assistant

_[tool: update_todos]_

OK, đi theo defaults — full gallery 11 template thiếu, dùng dữ liệu Wake để concrete, dark mode, deck-stage 1920×1080 để xem từng slide ở scale thật.

_[tool: read_file]_

_[tool: copy_starter_component]_

Đã đủ context. Tôi sẽ build file `lucida-n2-slide-templates.html` — một deck-stage 1920×1080 chứa 15 template slide phổ biến nhất cho N2 grammar (đầy đủ 17-slide architecture, gộp 4 grammar card thành 1 template demo, gộp 2 minimal pair thành 1). Dùng Wake (わけ) làm dữ liệu mẫu, dark mode, có badge "TEMPLATE" ở góc.

_[tool: write_file]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Đã build xong `lucida-n2-slide-templates.html` — deck-stage 15 slide template ở scale 1920×1080 (dùng phím ←/→ để chuyển slide).

**15 template được build** (map từ wake skeleton + slide template library):

| # | Template | Vai trò trong bài N2 |
|---|---|---|
| T01 | Hook Situation | Tình huống mở đầu, anchor line |
| T02 | Hook Contrast | 2 câu nhìn gần nhau, logic khác |
| T03 | Quiz Before/After | Câu hỏi với blank + 3 options |
| T04 | Promise Board | Topic + 2 outcome (đề / đời thật) |
| T05 | Story Context | 3 beats: setting → constraint → tension |
| T06 | Method Board | 3 cách nhìn: Ý nghĩa – Dạng – Cách dùng |
| T07 | Grammar Card | 1 mẫu, đầy đủ speaker intent + ví dụ + trap |
| T08 | Minimal Pair | 2 mẫu, contrast axis |
| T09 | Comparison Matrix | 4 mẫu, decision map |
| T10 | Clue Map | Checklist 3 bước + signal → pattern |
| T11 | Worked Example | Giải đề từng bước có trap elimination |
| T12 | Diagnostic Practice | Quiz có trap tag cho từng đáp án sai |
| T13 | Trap Explanation | "Nghe có vẻ đúng" vs "Thực ra cần" |
| T14 | Recap Map | 4 mẫu cuối bài, screenshot-friendly |
| T15 | CTA Diagnostic | Problem → asset → diagnostic items |

**Convention:**
- Mỗi slide có badge `T## · template name` ở góc trên-trái — khi clone deck cho cluster khác (kai/gai/temade, v.v.) chỉ cần đổi content, giữ layout
- 17-slide architecture của Wake gộp thành 15 template (4 grammar card → 1 demo, 2 minimal pair → 1) vì chúng dùng cùng layout
- Dùng đầy đủ token từ design system: amber/red/blue/green oklch, Noto Sans JP cho tiếng Nhật, Space Grotesk display, DM Sans body, Space Mono cho pattern code

**Tiếp theo nếu cần:**
- Thêm Form Table, Example Stack, Worksheet Bridge nếu thực sự dùng
- Light mode variant cho worksheet/print
- Tweaks panel để toggle theme & cycle variants

## User

Verifier agent check completed

## Assistant

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: str_replace_edit]_

Fixing the 22px chrome and the T13 overlap:

_[tool: copy_starter_component]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: done]_

_[tool: get_webview_logs]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Đã thêm xong:

**Light mode (Print/Worksheet)** — toàn bộ slide chuyển sang nền kem `#f5f2eb`, accent crimson, border đậm hơn — phù hợp in worksheet & screenshot tham khảo.

**Tweaks panel** (góc dưới-phải, bật từ toolbar) có 3 nhóm:
- **Mode** — `Video` (dark) ↔ `Print` (light)
- **Density** — `Comfortable` ↔ `Compact` (giảm padding & gap, cho slide dày dữ liệu)
- **T09 Comparison Matrix variant** — `Table` ↔ `Cards` (chuyển bảng so sánh sang dạng 2×2 thẻ có viền màu)

Default chọn được persist vào file qua `EDITMODE-BEGIN/END` nên reload không mất.

**Đề xuất tiếp theo nếu cần:**
- Thêm variants cho T01 (cinematic / two-panel) và T07 (split / hero-top)
- Thêm template còn thiếu: Form Table, Example Stack, Worksheet Bridge
- Generic placeholder dataset (Pattern A/B/C/D) bên cạnh Wake — toggle qua tweak `Cluster: Wake | Generic` để demo tính tái sử dụng

## User

font tiếng việt chưa phù hợp dẫn tới bị to ở những chỗ có dấu

## Assistant

_[tool: str_replace_edit]_

Đúng vấn đề — Space Grotesk không có subset Vietnamese trên Google Fonts, nên các chữ có dấu (ạ, ề, ữ…) bị fallback sang Noto Sans JP → glyph to và lệch metrics. Fix bằng cách chèn system-ui (San Francisco / Segoe UI / Roboto) làm fallback trước Noto Sans JP, hoặc dùng font display có VN.

_[tool: done]_

Đã fix font tiếng Việt:
- **Display** Space Grotesk → **Manrope** (có VN, tone tương đương)
- **Mono** Space Mono → **JetBrains Mono** (có VN)
- Fallback đặt `system-ui` TRƯỚC Noto Sans JP — chữ có dấu giờ render từ font primary hoặc font hệ thống, không bị nhảy sang Noto Sans JP (vốn có glyph rộng hơn nhiều).

## User

có font nào đẹp cho dạy học tiếng việt k, hoặc theo theme apple

## Assistant

_[tool: str_replace_edit]_

Có vài hướng tốt — tôi sẽ thêm chúng làm tweak để bạn so sánh trực tiếp trên deck:

**4 font pairing được preset:**
1. **Clean** (hiện tại) — Manrope + DM Sans · sạch, modern
2. **Apple-feel** — Plus Jakarta Sans · giống vibe SF Pro / iOS, có Vietnamese đầy đủ
3. **Vietnamese-first** — Be Vietnam Pro · font do Lâm Bình Minh thiết kế riêng cho tiếng Việt, dấu rất đẹp
4. **Editorial** — Newsreader (serif) + Source Sans 3 · cảm giác sách giáo khoa, phù hợp dạy học

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: done]_

Đã thêm tweak **Type pairing** trong panel — 4 lựa chọn toggle live:

| Pairing | Display | Body | Phù hợp |
|---|---|---|---|
| **Clean** | Manrope | DM Sans | Mặc định, modern, neutral |
| **Apple-feel** | Plus Jakarta Sans | Plus Jakarta Sans | Vibe SF Pro / iOS |
| **Vietnamese** | Be Vietnam Pro | Be Vietnam Pro | Font do Lâm Bình Minh thiết kế riêng cho VN — dấu thanh đẹp & cân đối nhất |
| **Editorial** | Newsreader (serif) | Source Sans 3 | Cảm giác sách giáo khoa, phù hợp dạy học |

Tất cả 4 đều có Vietnamese subset đầy đủ trên Google Fonts → không còn nhảy fallback ở chữ có dấu. JP và mono giữ nguyên (Noto Sans JP + JetBrains Mono).

**Gợi ý nhanh:** với mục đích dạy N2, mình recommend test thử **Vietnamese** (sạch, đặc thù VN) hoặc **Editorial** (cảm giác giảng dạy chỉn chu). Apple-feel sẽ giống các UI design xịn nhưng có thể hơi "lạnh" cho dạy học.

## User

Gợi ý nhanh: với mục đích dạy N2, mình recommend test thử Vietnamese (sạch, đặc thù VN) hoặc Editorial (cảm giác giảng dạy chỉn chu). Apple-feel sẽ giống các UI design xịn nhưng có thể hơi "lạnh" cho dạy học.

## Assistant

Bạn muốn tôi chốt một pairing làm default luôn không? Hoặc thử cả 2 (Vietnamese cho video / Editorial cho worksheet print) — auto-switch theo theme Video/Print?

Tôi đề xuất:
- **Video (dark)** → **Be Vietnam Pro** — sạch, hiển thị tốt trên màn hình
- **Print (light)** → **Newsreader + Source Sans 3** — cảm giác giáo trình, đọc dài thoải mái hơn

Nếu OK tôi sẽ link type pairing với theme — khi chuyển Video/Print thì font cũng đổi theo. Hoặc bạn pick 1 pairing chung cho cả 2?

## User

ok

## Assistant

_[tool: str_replace_edit]_

_[tool: done]_

Đã link type pairing với theme — tweak mặc định giờ là **Auto · follow theme**:

- Video (dark) → **Be Vietnam Pro**
- Print (light) → **Newsreader + Source Sans 3**

Vẫn còn 4 option manual (Clean / Apple / Vietnamese / Editorial) trong dropdown nếu bạn muốn override. Ngay bây giờ vì bạn đang ở Print mode nên deck đang dùng Newsreader + Source Sans 3 — chuyển sang Video sẽ thấy Be Vietnam Pro.

## User

note thật kĩ trong design template nhé

## Assistant

_[tool: str_replace_edit]_

## User

chốt Vietnamese  cho tôi phương án 3

## Assistant

_[tool: str_replace_edit]_

Chốt Be Vietnam Pro làm default. Tôi sẽ thêm khối design notes chi tiết vào đầu file để template có spec rõ ràng cho lần sau tái sử dụng.

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: write_file]_

Tôi sẽ thêm 1 file sidecar markdown chi tiết để spec rõ ràng cho từng template — thuận tiện khi clone deck cho cluster khác.

_[tool: done]_

Đã chốt **Be Vietnam Pro** làm default, và note thật kỹ trong template:

**Trong file HTML** (`lucida-n2-slide-templates.html`):
- Khối comment design notes ở đầu file: purpose, template index, color tokens, type scale, spacing, chrome convention, teaching rules, color-to-action mapping cho 4-pattern cluster, reuse workflow

**Sidecar markdown** (`lucida-n2-slide-templates.md`):
- §1 Brand & tone
- §2 Type system (lý do chọn Be Vietnam Pro)
- §3 Color tokens + **bảng color slot ↔ speaker-action** (blue=kết luận, amber=đính chính, green=bác bỏ, red=ràng buộc)
- §4 Spacing & chrome
- §5 **Per-template specs** — mỗi T01–T15 có: Purpose · Slots · Keep · Don't
- §6 7 quy ước teaching không được phá vỡ
- §7 **Reuse workflow 7 bước** khi clone cho cluster mới (ばかり, kai/gai/temade...)
- §8 File dependencies

**Quy ước quan trọng nhất khi reuse:**
1. Map pattern vào color slot theo **speaker-action**, không theo JP alphabet → learner build memory ổn định giữa các cluster
2. Speaker-intent line ("Ở câu này, người nói đang muốn nói gì?") là **thesis** trên grammar card, không phải translation
3. Không bao giờ dùng English labels (Meaning/Form/Usage) trên slide public — luôn Ý nghĩa · Dạng · Cách dùng

## User

udpate vào design template và export để tôi đưa vào project ở vs code

## Assistant

_[tool: copy_files]_

Để đưa vào VS Code, bạn cần 4 file (HTML + spec MD + 2 dependencies). Tôi sẽ gom vào 1 folder để zip xuống:

_[tool: write_file]_

_[tool: present_fs_item_for_download]_

Bundle gồm 5 file (HTML + spec MD + 2 deps + README). Đề xuất đặt vào `production/01-rules/slide-system/templates/` trong repo opus-lucida — chi tiết trong README.


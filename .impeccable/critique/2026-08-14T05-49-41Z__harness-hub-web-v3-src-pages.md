---
target: harness/hub/web-v3/src/pages
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-14T05-49-41Z
slug: harness-hub-web-v3-src-pages
---
# Impeccable Critique — Harness Hub v3 (18 màn hình)

**Method: dual-agent (A: design review · B: detector scan)**
**Target**: `harness/hub/web-v3/src/pages` · slug `harness-hub-web-v3-src-pages`
**Mode**: Operate (internal admin console, dark theme)

---

## Design Health Score (Nielsen 10)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | `ApprovalsPage.tsx:21` & `VgovReleasesPage.tsx:75` hardcode `Status kind="running"` bất kể trạng thái thật — việc lỗi/đã duyệt trông như đang chờ |
| 2 | Match System / Real World | 3 | `VgovRunPage` trộn chuỗi Việt-Anh trực tiếp ("Release đang chạy", "Commit chưa được pin") cạnh nhãn Anh |
| 3 | User Control and Freedom | 2 | FilesPage xóa không xác nhận (`:40`); VgovReleases Promote/Rollback PROD không xác nhận (`:77-83`) |
| 4 | Consistency and Standards | 3 | 3 kiểu confirm khác nhau (window.confirm / inline / không có); 4 tablist tái lập thủ công thay vì Tabs primitive |
| 5 | Error Prevention | 2 | Hành động phá hủy (xóa file, promote/rollback PROD, xóa agent) thiếu guardrail |
| 6 | Recognition Rather Than Recall | 3 | Popover trạng thái provider dùng trigger `<Status kind="ready" label=""/>` trống — không nhãn trực quan, Jordan không biết nhấn được |
| 7 | Flexibility and Efficiency | 3 | Roving tabindex + phím mũi tên trên Tabs/Bảng; Esc đóng Dialog/Drawer; nhưng thiếu shortcut thu gọn sidebar / đổi mode |
| 8 | Aesthetic and Minimalist Design | 3 | Token tốt, tỷ lệ, nhưng density cao làm hỏng (Workflows run toolbar, SkillsPage 5 filter, Chat context-drawer) |
| 9 | Error Recovery | 3 | Alert lỗi nhất quán; ValidationBar mạnh (click issue → highlight node); nhưng ApiError hiển thị banner chung, không gắn vào control |
| 10 | Help and Documentation | 2 | Không trợ lý/trợ giúp icon; "CONTROL PLANE", "HITL", "shadow preview", "policy version" không có từ điển đồng thời |
| **Total** | | **24/40** | **Acceptable — cần cải thiện đáng kể trước khi user hài lòng** |

---

## Design Specificity Verdict

**KHÔNG ĐẠT — khuôn mẫu SaaS tối quảng nghĩa, thiếu DNA sản phẩm.**

Token slate-on-slate (`#0b1018`/`#111827`/`#162033` + accent cyan `#29c7f3`) có thể là bất kỳ công cụ vận hành tối nào. Chỉ 3 yếu tố đặc thù: logo "H" cyan, `ProviderDot 7px` claude `#D97757`/codex `#A78BFA`/nvidia `#76B900`, footer "Hub v3 · localhost:8799". Bảng điều khiển quản lý agent AI làm việc nghiêm túc nhưng thiết kế không ghi lại điều đó.

Cơ hội đặc thù sản phẩm:
- **RunSpine** phải là "phòng máy" — nhịp tim cho node đang chạy, chiều sâu cây cho nguồn gốc, không chỉ đường dọc + chấm.
- **Gate** cần phép nối hình học cụ thể riêng biệt (không chỉ border cảnh báo).
- **Bảng Artifact** cần "chất liệu" tài liệu (lề, thẻ).
- **Khu vgov release** phải gợi nhớ chuyến tàu phát hành, không phải Bảng phẳng.
- **ProviderDot 7px** phải phát triển thành thanh provider xúc giác (rãnh claude/codex/nvidia) hiện diện trong RunSpine/Topbar — đang quá khiêm tốn so vai trò trung tâm của multi-provider.

---

## Tóm tắt phát hiện của Detector (Assessment B)

⚠️ **DEGRADED**: HTML parser (htmlparser2/css-tree) thiếu → regex-fallback, **chỉ undercount**, không đo contrast. **Không có browser-automation tool** trong session → không overlay, CLI scan là evidence.

| Antipattern | Count | Thật/FP |
|---|---|---|
| side-tab (`border-l-2`) | 1 | Thật |
| border-accent-on-rounded (`border-b-2`) | 2 | False positive |

- `RunSpine.tsx:13` — `border-l-2` trên card `rounded-[var(--hub-radius-lg)]`, active khi node chạy → **thật**, slop P3.
- `AgentsPage.tsx:38` + `WorkflowsPage.tsx:279` — `border-b-2` tab underline trên nút phẳng, không rounded → **false positive** (tab strip chuẩn).

---

## Overall Impression

Nền móng vững: token hệ thống tốt, hạ tầng access mạnh hơn typical dark SaaS (focus trap, roving tabindex, aria-label + title trên mọi IconButton, Esc đóng). GateCard là khoảnh khắc rủi ro cao được thiết kế đúng. Nhưng bảng điều khiển thiếu "giọng" sản phẩm, và hai hành động phá hủy hoàn toàn không có bảo vệ — đó là showstopper vận hành. Cơ hội lớn nhất: biến RunSpine/Gate/Artifact/vgov từ "Panel phẳng" thành bề mặt có "tính chất" sản phẩm.

---

## What's Working

1. **Hạ tầng access vững.** `focusRing` toàn cục + `outline 2px accent offset 2`, Dialog/Drawer bẫy tiêu điểm + trả về caller, roving tabindex, `aria-label`+`title`+Tooltip trên IconButton. Mạnh hơn nhiều dark SaaS điển hình.
2. **GateCard là khoảnh khắc rủi ro cao duy nhất được thiết kế đúng.** Border cảnh báo + nền phụ + eyebrow "GATE · awaiting your decision" + Approve/Reject + "Sending…" bận — bồi đắp cảm xúc đúng lúc ủy quyền công việc nghiêm túc.
3. **Kỷ luật token + tách màu ngữ nghĩa/thương hiệu.** Bộ `@theme` hoàn chỉnh; claude/codex/nvidia nhốt đúng chỗ trong `ProviderDot`; màu không bao giờ là tín hiệu duy nhất (ngoài lỗi Approvals/VgovReleases).

---

## Priority Issues

### [P0] Promote/Rollback PROD không xác nhận — `VgovReleasesPage.tsx:77-83`
- **Why**: Hạ cấp con trỏ PROD là quyết định rủi ro nhất — đảo ngược sản xuất đang chạy. Không cố ý = một nhấp chuột sai khỏi sự cố khó undo.
- **Fix**: Thêm xác nhận inline tái dùng mẫu `pendingDelete` của HooksPage/Workflows (chip cảnh báo + Confirm + Cancel). Với PROD thêm input "PROD" cần gõ (mô hình GitHub/AWS).
- **Command**: `/impeccable harden`

### [P0] Xóa file không xác nhận — `FilesPage.tsx:40`
- **Why**: File view chia sẻ mặt tiền với download + hyperlink; nhấp nhầm Xóa thay Download = dữ liệu quy trình không phục hồi. Vi phạm User Control directly.
- **Fix**: Trạng thái `pendingDeleteName` inline (như `pendingDelete` HooksPage); chip xác nhận nhỏ cạnh file; DELETE chỉ khi nhấp Confirm.
- **Command**: `/impeccable harden`

### [P1] Trạng thái Approvals luôn "running" — `ApprovalsPage.tsx:21`, `VgovReleasesPage.tsx:75`
- **Why**: Operator dựa dot trạng thái để ưu tiên; việc lỗi/đã duyệt trong hàng đợi phê duyệt trông như đang chờ. Vi phạm Nielsen #1 trực tiếp trên dashboard rủi ro cao.
- **Fix**: Thêm `statusToKind` map (approved→success, rejected→error, pending→setup-required, running→running) ở hai file; truyền qua `kind`. <30 phút.
- **Command**: `/impeccable harden`

### [P1] Bỏ rơi i18n trang vgov; lai Việt-Anh trong VgovRunPage
- **Why**: Nhất quán i18n là bảng điều khiển chuyên nghiệp đứng; lai Việt-Anh làm người đọc Anh nhầm, khó publish TL; mạch dịch không sửa tách từng lệnh.
- **Fix**: Tạo `src/lib/i18n/vgov.ts` với khóa/key; thay chuỗi hardcoded bằng `t('vgov.*')`. Di chuyển chuỗi Việt `VgovRunPage` sang khóa Anh, giữ Việt lớp dịch.
- **Command**: `/impeccable harden`

### [P2] Kỷ luật token phá vỡ trong UsagePage — `UsagePage.tsx:38`
- **Why**: `p-7`, `gap-2`, `p-3`, `text-xs`, `text-lg`, `h-1`, `w-20` lan tỏa khi sao chép, giảm tính hệ thống, phá co giãn theme. Cũng thiếu token `space-2.5` (10px) khiến `gap-[7px]`/`[2px]` inline.
- **Fix**: Chuyển giá trị thô UsagePage sang token; thêm `--spacing-space-2-5: 10px`.
- **Command**: `/impeccable layout`

### [P3] Tablist thủ công tái lập Tabs primitive — AgentsPage/ArtifactsPage/ArtifactRail/WorkflowsPage RunLog
- **Why**: Bảo trì logic roving tabindex song song ở 4 nơi; cải aria tốn 4 lần.
- **Fix**: Thay tablist thủ công bằng Tabs primitive; mở rộng API Tabs nếu thiếu case, không rẽ nhánh.
- **Command**: `/impeccable distill`

---

## Persona Red Flags

**Jordan (first-timer)**:
- Topbar popover trạng thái dùng trigger `<Status kind="ready" label=""/>` rỗng — trông như đèn báo tĩnh, Jordan không nhấn được (`Topbar.tsx:24`).
- Sidebar collapsed ray vô hiệu label, **các NavLink collapsed có `title`** (đã có — xin kiểm) — nếu không, hover không có tooltip.
- `ResolutionPreview` eyebrow "CONTROL PLANE" + "shadow preview" — Jordan không biết nghĩa, không trợ lý inline.
- `VgovReleasesPage` "Promote / rollback PROD" — một nút ghép 2 hành động trái ngược, Jordan không biết nhấn sẽ nâng hay đóng băng.
- `SkillsPage` 5 filter — "Source" vs "Deploy target" (cả hai là khóa nguồn), không mô tả cạnh select.

**Riley (stress tester)**:
- `window.confirm` rollback (`ApprovalsPage.tsx:18`) — native dialog ngắt giữa SSE flow, mất context; nút không cho biết rollback *đến đâu*.
- `VgovReleases` Promote/Rollback PROD không xác nhận — kết ca 12h, nhấp nhầm hạ sai production, không guardrail.
- `FilesPage` Delete không xác nhận — trộn download/delete cùng hàng, tác động yếu gỡ nhầm file.
- `WorkflowsPage` run toolbar nén — Run + Stop (hidden khi streaming) cạnh nhau, Riley dễ nhầm khi bận.
- Các trang vgov thiếu skeleton — Riley refresh/lookup/compare treo, không phản hồi hình ảnh, bối rối lần 2.

---

## Minor Observations

- `ResolutionPreview` công khai 5 phần ngay lập tức + warning shadow — quá nhiều cùng lúc.
- Chat action buttons icon-only (copy/pin/retry) — access OK (aria-label+title+tooltip) nhưng first-timer không label trực quan.
- HooksPage inline confirm (pendingDelete) tốt hơn window.confirm — nên chuẩn hóa cho Files/VgovReleases/Agents.
- ArtifactDetailPage `max-w-960` + Markdown bảng — tối giản đúng.
- Topbar user avatar 60×60 icon-only (chỉ<UserRound> icon), không biểu thị role/session.
- VgovCompare diff null, VgovOutput không empty state — chỉ tiêu đề + danh sách trống, không thông báo "cả hai revision giống nhau".

---

## Questions to Consider

- **Cơ hội lớn nhất**: Nếu biến RunSpine/Gate/Artifact/vgov thành bề mặt có "tính chất" sản phẩm thay vì Panel phẳng, POV sản phẩm sẽ ra sao?
- **PROD promote**: Có nên yêu cầu input "PROD" cần gõ để confirm (GitHub/AWS), hay chỉ inline confirm chip là đủ?
- **vgov i18n**: Có nên pull tất cả chuỗi Việt của VgovRunPage về lớp dịch Anh + Việt, hay giữ Việt làm nội bộ bản demo?
- **ResolutionPreview**: "CONTROL PLANE" eyebrow có thực sự giúp operator, hay chỉ jargon ngăn hiểu?

# ⚠️ STATUS — MVP Parallel Spike (Re-activated 2026-05-13)

**Status:** MVP spike chạy song song với Lucida, không phải canonical, không phải production.
**Purpose:** Test feel của OD MCP path để inform quyết định Lucida migration (RD ở `opus-lucida/docs/RD-od-mcp-renderer-migration.md`).
**Lifespan:** Throwaway sau khi quyết định Lucida migration được chốt (approve hoặc reject RD).

**Tránh:**
- Đừng port content thật vào đây
- Đừng duplicate Lucida rules
- Đừng dùng làm reference cho production work

---

## Context lịch sử (kept for reference)

Plan v2 trong folder này (CLAUDE.md, prompts/, templates/) ban đầu duplicate Lucida slide system. Sau khi user OK Model 2 (RD migration) + làm MVP spike trước, folder này trở thành sandbox để test OD MCP path với placeholder data từ わけ family.

---

## Canonical source thay thế

JLPT N2 slide production thuộc về **opus-lucida**, không phải apps:

| Concern | Lucida owner |
|---|---|
| Slide architecture rules | `opus-lucida/production/01-rules/slide-system/01-slide-architecture-framework.md` |
| Template library (v2 active) | `opus-lucida/production/01-rules/slide-system/02-slide-template-library.md` |
| Acceptance process (v0.1 active) | `opus-lucida/production/01-rules/slide-system/06-slide-template-acceptance-process.md` |
| Vietnamese language rules | `opus-lucida/production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md` |
| Banned/preferred dictionary | `opus-lucida/production/01-rules/slide-system/10-banned-preferred-language-dictionary.md` |
| Production SOP | `opus-lucida/automation/workflows/20-lesson-production-sop.md` |
| Runtime renderer | `opus-lucida/apps/schema-html-prototype/` (Vite + React + Zod + Playwright) |
| Active Wake cluster lane | `opus-lucida/production/00-active/wake-cluster/` |

## OD MCP role (chốt 2026-05-13)

**Option A — Template prototyping sandbox.** OD MCP chỉ dùng khi đề xuất `template_id` mới: mockup HTML visual trước → review → port sang React component trong `apps/schema-html-prototype/src/layouts/components/`. Không thay React renderer. Không thay rule layer. Không tạo lesson production pipeline song song.

Patch đề xuất cho `06-slide-template-acceptance-process.md` đang chờ user duyệt.

## Conflict cụ thể của plan v2 với Lucida (lý do archive)

1. Tạo 11 slide types tự bịa thay vì dùng template library v2
2. Dùng English labels ("Hook", "Pain", "Reveal") — banned trên public output
3. 3-view labels = "form/meaning/nuance" tiếng Anh — locked label là `Ý nghĩa - Dạng - Cách dùng`
4. PracticeSlide có hotspot toggle reveal — vi phạm MVP rule `1 logical slide = 1 PNG frame = 1 audio segment`
5. Đặt OD MCP làm renderer chính — vi phạm locked decision "Renderer owns HTML/CSS, JSON không chứa raw HTML"
6. Pipeline rút gọn skeleton+script → plan → HTML — bỏ qua skeleton → slide-architecture → script → frame map → typed JSON → runtime với QA gate mỗi bước
7. Tạo `lessons/wake-family/` song song với `opus-lucida/production/00-active/wake-cluster/` đã verified 17-slide

## Cleanup pending

Folder này nên được rename hoặc xoá khi process lock được giải phóng:

```powershell
# Khi OD daemon / explorer đã đóng:
Rename-Item "apps\jlpt-n2-slides" "_archive-jlpt-n2-slides-v2-mis-scoped"
# hoặc xoá hoàn toàn:
Remove-Item -Recurse -Force "apps\jlpt-n2-slides"
```

Không có file nào ở đây cần migrate sang Lucida — Lucida đã có toàn bộ rồi.

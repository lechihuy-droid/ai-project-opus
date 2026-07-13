# Topic Selection Rules

## Series mapping (fixed — from `docs/market-research/11-pipeline-contract.md`)

| Topic type | Series |
|---|---|
| ai_news | lucida-now |
| japan_future_of_work | lucida-now |
| office_ai | lucida-work |
| github_repo | lucida-lab |
| research_paper | lucida-lab |
| ai_concept | lucida-lab |
| hype_or_risk_review | lucida-check |

Nếu topic không khớp loại nào → hỏi user, không tự bịa series mới.

## Topic acceptance criteria

Một topic chỉ pass khi trả lời được cả 4 câu:

1. **Signal** — điều gì vừa xảy ra / vừa đáng chú ý? (không có tin mới = không có video lucida-now)
2. **Relevance** — tại sao người Việt đi làm tại Nhật cần quan tâm? (audience primary: `vietnamese-professionals-in-japan`)
3. **Proof** — có bằng chứng kiểm chứng được không? Claim không có nguồn → vào `claimsNeedingEvidence`, không được khẳng định chay.
4. **Action** — người xem làm gì tiếp theo? (mỗi video phải có đường dẫn sang lead magnet / waitlist / bước hành động — funnel-first rule)

## When proposing topics (user chưa có idea)

- Đọc `04-growth-hypotheses.md` → chọn hypothesis chưa được kiểm chứng bằng content.
- Đọc `10-series-architecture.md` → chọn pillar đang thiếu video.
- Đề xuất 2–3 candidates, mỗi cái ghi: series, job-to-be-done, why-now, growth hypothesis mà nó test.

## Duration guideline

- Mặc định 60–120 giây cho lucida-now / lucida-check.
- Ước lượng lời đọc tiếng Việt: **~3.0 từ/giây** (đo thật từ VieNeu v3 Turbo, gồm pause giữa câu — spike 2026-07-14, xem `apps/lucida-remotion-demo/docs/spike-vieneu-chunking.md`).
- Ghi rõ assumption trong `topic.wordCountAssumption` để stage audio đối chiếu.

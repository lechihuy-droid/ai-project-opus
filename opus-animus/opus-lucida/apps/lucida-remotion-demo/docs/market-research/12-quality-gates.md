# 07. Brand Quality Gates

Mỗi video phải qua brand QA trước khi render final.

## Gate 1 — Strategic fit

- Topic có thuộc phạm vi Lucida không?
- Video có trả lời “tại sao người xem cần quan tâm?”
- Có một hành động, quyết định hoặc insight rõ ở cuối không?
- Hook FOMO có dẫn tới value hay chỉ tạo sợ hãi?

Fail nếu video chỉ lặp lại headline hoặc feature list.

## Gate 2 — Evidence integrity

- Mọi claim quan trọng có source hoặc confidence không?
- Wording có đúng với mức độ chắc chắn không?
- Fact, inference và prediction có được phân biệt?
- Screenshot, logo, metric và quote có nguồn rõ?

Fail nếu secondary report được nói như official fact.

## Gate 3 — Recognition

Trong 3–5 giây đầu phải có ít nhất hai tín hiệu nhận diện:

- series label;
- Lucida Beam;
- core palette;
- typography;
- signal chime;
- evidence badge language.

Video phải vẫn được nhận ra là Lucida nếu bỏ logo.

## Gate 4 — Visual consistency

- Dark editorial base được giữ?
- Accent chiếm dưới khoảng 5–10% frame?
- Có một dominant idea trên mỗi frame?
- Icon, node, card và line cùng một visual family?
- Layout có đủ khoảng thở?
- Không có progress bar?
- Không có neon rainbow, particle noise hoặc glass layer thừa?

## Gate 5 — Motion meaning

- Mỗi animation có chức năng reveal, trace hoặc focus?
- Lucida Beam chỉ dùng tại điểm quan trọng?
- Không zoom camera liên tục?
- Không dùng bounce cho toàn câu hoặc object lớn?
- Metric và key visual có đủ hold time để đọc?

## Gate 6 — Subtitle correctness

- Hiện một câu/phrase ngắn trước rồi highlight từng từ?
- Hết câu mới chuyển chunk mới?
- Word timing khớp audio?
- Tối đa 2 dòng?
- Active word không scale quá `1.04`?
- Subtitle không che hero visual hoặc UI safe area?
- Không dùng word-by-word pop rời rạc?

## Gate 7 — Audio identity

- Voice rõ hơn music và SFX?
- Signal chime chỉ dùng một lần chính?
- Evidence/warning cue có đúng semantic?
- Không lạm dụng whoosh?
- Music tension phù hợp topic?

## Gate 8 — Series compliance

- `NOW`: có why-now, proof và implication?
- `WORK`: có workflow, result và safety check?
- `LAB`: có mechanism/demo và limitation?
- `CHECK`: có verdict và đối tượng nên/không nên dùng?

## Scorecard

```text
Strategic fit          /15
Evidence integrity     /15
Recognition            /15
Visual consistency     /15
Motion meaning         /10
Subtitle correctness   /15
Audio identity         /5
Series compliance      /10
--------------------------
Total                  /100
```

- `90–100`: ready to publish.
- `80–89`: publish after minor corrections.
- `70–79`: revise affected scenes.
- `<70`: reject and regenerate blueprint/style.

## W4 hard production gates

Production uses `qa:production` in two phases. Pre-render rejects a scene that exceeds
the capacity in its selected style package, a missing normalized factual provenance
record, or missing audio/TimedScript inputs. Rapid visual pilots remain preview-capable
and are never made publishable by these checks.

Post-render rejects a missing audio stream, mean loudness at or below `-45 dB`, peak at
or above `-0.1 dB`, caption drift above `80 ms`, invalid caption bounds, or a failed
ffprobe/ffmpeg frame integrity probe. `qa-report.json` records evidence and SHA-256
checksums for the exact production inputs and render. Finalize and publish recompute the
approved script, source and timed video-maps, render props, TimedScript, audio, normalized
input, and render checksums; any drift blocks handoff. A passed post-render report must
contain unique passing audio, caption, and render-integrity checks.

Each render wrapper takes the single atomic `.render.lock` at its approved output root.
The lock records run ID, run root, PID, timestamp, and owner token. A live owner blocks
all competing runs; a stale/dead lock is recovered safely. Only the owner can release it.

## Non-negotiable failures

Bất kể tổng điểm, video không được publish nếu:

- claim quan trọng bị diễn đạt quá mức bằng chứng;
- subtitle sai timing rõ rệt;
- visual không còn nhận diện Lucida;
- CTA hoặc conclusion kích động fear nhưng không có agency;
- asset có vấn đề bản quyền hoặc nguồn không rõ.

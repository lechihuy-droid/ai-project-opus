# 04. Motion, Subtitle and Sonic Identity

## Motion principle

Motion phải giải thích logic, không chỉ làm frame bớt tĩnh.

Lucida dùng chuyển động theo ba chức năng:

1. **Reveal:** xuất hiện thông tin mới.
2. **Trace:** chỉ ra quan hệ, luồng hoặc nguyên nhân.
3. **Focus:** chuyển sự chú ý tới con số, từ khóa hoặc đối tượng quan trọng.

## Signature motion

### Lucida Beam Reveal

Một dải sáng quét qua và làm rõ keyword, metric hoặc node. Dùng ở hook, evidence reveal hoặc conclusion.

### Evidence Lock

Source badge hoặc confidence badge xuất hiện bằng chuyển động snap nhẹ, tạo cảm giác claim đã được kiểm tra.

### Focus Pull

Background giảm opacity hoặc blur nhẹ trong khi hero object tiến gần 2–4%.

## Motion timing

- Micro reveal: 6–10 frames.
- Main object entrance: 10–16 frames.
- Section transition: 8–14 frames.
- Metric hold: tối thiểu 24 frames.
- Không đổi layout lớn nhanh hơn khả năng đọc.

## Motion character

- Smooth, controlled, confident.
- Ưu tiên ease-out và spring damping cao.
- Bounce chỉ dùng cho active subtitle word hoặc một điểm nhấn nhỏ.
- Không dùng shake trừ cảnh báo bảo mật có chủ đích.
- Không dùng cùng một fade cho tất cả object.

## Subtitle model

Subtitle của Lucida tuân theo **sentence-first, word-highlight**:

1. Hiện toàn bộ một câu ngắn hoặc một phrase hoàn chỉnh.
2. Highlight từng từ theo word timing.
3. Khi câu kết thúc, thay toàn bộ bằng câu tiếp theo.

Không hiển thị từng từ độc lập rồi tích lũy thành câu.

### Subtitle constraints

- 4–10 từ mỗi chunk; tối đa 12 từ khi câu tự nhiên không thể tách.
- Tối đa 2 dòng.
- Mỗi dòng ưu tiên dưới 18 ký tự tiếng Việt nếu font lớn.
- Active word dùng `signal-cyan`, weight cao hơn và scale tối đa `1.04`.
- Inactive words giữ `ivory`, không giảm opacity quá thấp.
- Không bounce toàn câu.
- Không đặt subtitle sát đáy; tuân thủ safe area nền tảng.
- Keyword visual trên scene không được lặp nguyên toàn bộ subtitle.

## Subtitle pacing

- Chunk mới chỉ xuất hiện tại natural phrase boundary.
- Giữ chunk thêm 2–4 frames sau từ cuối để người xem hoàn tất việc đọc.
- Nếu narration quá nhanh, ưu tiên rút gọn copy thay vì thu nhỏ font.

## Sonic identity

Lucida dùng sonic identity tối giản, không cần intro jingle dài.

### Signature sound

Một `signal chime` ngắn 150–250 ms gồm transient sáng và tail rất ngắn. Dùng khi series label hoặc Lucida Beam xuất hiện lần đầu.

### Functional cues

- `reveal`: click/chime nhẹ khi hero fact xuất hiện.
- `evidence`: lock/tick tinh tế khi source được xác nhận.
- `warning`: low pulse khi nêu risk hoặc uncertainty.
- `takeaway`: warm resolving tone khi chuyển sang action.

## Music

- Electronic editorial, restrained, 90–115 BPM.
- Không dùng trailer bass dày cho mọi topic.
- Voice luôn ưu tiên; music chỉ tạo tension và nhịp.
- Duck music rõ tại câu chứa claim chính và takeaway.

## Prohibited patterns

- Progress bar chạy dưới đáy.
- Mỗi từ bay từ một hướng khác nhau.
- Camera zoom liên tục.
- Whoosh ở mọi transition.
- Subtitle karaoke từng chữ rời rạc.
- Sound effect gây mệt hoặc át narration.

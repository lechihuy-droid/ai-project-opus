# File Script Chuẩn – N2 わけ Family Final v1
## Video: わけだ・わけではない・わけがない・わけにはいかない

**Status:** Production ready for audio draft  
**Use case:** Public sample / Video 1 script  
**Target length:** 10–13 phút  
**Production version:** 17 slides  
**Audience:** Người Việt cuối N3 / đầu N2, đang học N2 nhưng hay nhầm các mẫu có hình thức gần giống nhau  
**Story trung tâm:** Hook JLPT + practical expansion client deadline  
**CTA chính:** Worksheet phân biệt 4 mẫu `わけ` theo Nghĩa – Hình – Dụng + dấu hiệu chọn mẫu + bài tập JLPT-style

---

# 0. Production Contract

Script này chỉ chứa nội dung dùng để quay: on-screen text, lời đọc, speaker note và pause/emphasis.

Script này phải đi theo slide architecture đã khóa. Với Wake MVP, script giữ đúng 17 slide blocks và không tự thêm / bớt slide nếu chưa sửa `05-wake-mvp-output-architecture.md`.

Các rule/QA không lặp lại trong file này:

- Lesson architecture, terminology, and quality gate: `strategy/standards/01-lucida-lesson-architecture-standard.md`
- Wake-specific scope, grammar accuracy, video promise, and teaching skeleton: `production/00-active/wake-cluster/01-master-teaching-skeleton.md`
- MVP output architecture, worked-example rule, diagnostic practice, and CTA logic: `production/00-active/wake-cluster/05-wake-mvp-output-architecture.md`

Contract khi sửa script:

- Không đổi scope 4 mẫu chính nếu chưa sửa skeleton trước.
- Không đổi số slide / thứ tự slide nếu chưa sửa output architecture trước.
- Không dùng thuật ngữ nội bộ kiểu `Meaning / Form / Usage / Clue Map` trong lời public; dùng `Ý nghĩa – Dạng – Cách dùng` và `Dấu hiệu chọn mẫu`.
- Mọi practice trong video phải phục vụ trap logic hoặc diagnostic, không thêm bài tập chỉ để nhiều ví dụ hơn.

TTS marker convention for downstream subagents:

```text
[TTS_PAUSE_SHORT] = ngắt nhịp rất ngắn
[TTS_PAUSE_MED] = ngắt nhịp vừa
[TTS_PAUSE_LONG] = ngắt nhịp dài hơn để người học nghĩ
[TTS_REVEAL] = ngay sau marker này là đáp án / kết luận / payoff
```

Rule:

```text
Do not change wording when doing a TTS pass.
Only interpret or refine TTS markers.
```

---

# Slide 01 – Opening Situation

**Role:**  
Mở bài bằng hook đúng persona: tối trước N2, muốn đi nhưng không đi được. Từ đó bật pain point “cùng có わけ nhưng không cùng logic”.

**On-screen:**

```text
「行きたくないわけじゃないんだけど、」
「明日N2だから、今夜は遊びに行くわけにはいかないんだ。」

Cùng có わけ
nhưng KHÔNG cùng mạch logic
```

**Script:**

Bạn đã bao giờ gặp cảm giác này chưa?

Học đến N2 rồi,
nhìn mẫu nào cũng quen,
nhưng tới lúc chọn đáp án thì lại phân vân.

Ví dụ tối nay bạn được rủ đi chơi.

Không phải là bạn không muốn đi.

Nhưng mai thi N2 rồi,
nên tối nay thật sự không đi được.

Trong tiếng Việt, mình rất dễ gộp hết thành kiểu:
"Ừ thì không đi được thôi."

Nhưng trong tiếng Nhật, chỗ này không chỉ là một câu từ chối chung chung.

[TTS_PAUSE_SHORT]

[VOICE_JA_01]

[VOICE_JA_02]

Điểm khó không nằm ở chữ `wake`.

Điểm khó là:
nhìn mặt chữ thì giống,
dịch sang tiếng Việt nghe cũng có vẻ ổn,
nhưng mạch logic lại khác.

Nếu bạn chọn nhầm, câu sẽ sai mạch logic ngay.

Một câu là "không phải là...".

Một câu là "muốn cũng không thể làm vì có lý do bắt buộc".

Hôm nay mình sẽ gỡ cả nhóm quà kê theo kiểu đi từ mạch logic của người nói, để vào đề đỡ đoán hơn.

**Speaker note:**  
Mở thẳng vào hook thi N2. Không vòng intro dài.

**Pause/Emphasis:**

- [NHẤN] "mai thi N2 rồi"
- [NHẤN] "cùng có わけ nhưng không cùng mạch logic"

---

# Slide 02 – Hook Quiz

**Role:**  
Tạo tương tác sớm ngay trên hook chính và cho payoff tạm.

**On-screen:**

```text
行きたくない＿＿んだけど、
明日N2だから、今夜は遊びに行く＿＿。

A. わけでは / わけには
B. わけが / わけでは
C. わけだ / わけが
```

**Script:**

Thử dừng 3 giây và chọn thử.

[TTS_PAUSE_LONG]

[TTS_REVEAL]
Đáp án là A.

[VOICE_JA_01]  
[VOICE_JA_02]

Tạm nhớ nhanh thế này:

quà kê đê há nà ì = không phải là... / không có nghĩa là...  
quà kê ni ha i cá nà ì = không thể làm vì có ràng buộc.

[TTS_PAUSE_SHORT]
Lát nữa mình sẽ quay lại đúng câu này và gỡ kỹ hơn bằng 3 cách nhìn: Ý nghĩa – Dạng – Cách dùng.

**Speaker note:**  
Reveal ngắn gọn, chưa làm worked example đầy đủ ở đây.

**Pause/Emphasis:**

- [PAUSE 3s]
- [NHẤN] "không phải là..." / "không thể làm vì có ràng buộc"

---

# Slide 03 – Pain Point and Promise

**Role:**  
Chốt lời hứa thật rõ: bài này không chỉ để nhớ nghĩa, mà để vừa làm N2 chắc hơn vừa hiểu/dùng tự nhiên hơn.

**On-screen:**

```text
JLPT N2: 4 mẫu わけ hay nhầm

Thi N2 tốt hơn
Dùng thực tế tự nhiên hơn
```

**Script:**

Lý do nhóm này dễ sai là vì mình hay học bằng nghĩa tiếng Việt rời rạc.

Nhìn thấy quà kê, não dễ gom chung lại thành:
"À, chắc liên quan tới lý do".

Nhưng như vậy là chưa đủ.

Mình không muốn bạn học 4 mẫu này như 4 công thức riêng lẻ.

Mình muốn bạn nhìn nó như 4 hành động của người nói.

Người nói đang kết luận?

Đang phủ định một hiểu nhầm?

Đang bác bỏ rất mạnh?

Hay đang nói rằng mình bị ràng buộc nên không thể làm?

Sau video này, mình muốn bạn lấy được 2 thứ.

Một là:
làm đề N2 nhanh hơn, đỡ chọn theo cảm giác hơn.

[TTS_PAUSE_SHORT]
Hai là:
ra ngoài đời, nghe câu nói thật, bạn hiểu người kia đang đính chính, kết luận, bác bỏ mạnh, hay bị ràng buộc.

Và để làm được điều đó, bạn chỉ cần nhớ 4 nhãn:

- quà kê da = kết luận hợp lý / thảo nào
- quà kê đê há nà ì = không phải là... / không có nghĩa là...
- quà kê gá nà ì = không thể nào
- quà kê ni ha i cá nà ì = không thể làm vì ràng buộc

[NHẤN] 4 mẫu quà kê là 4 mạch logic khác nhau trong câu.

**Speaker note:**  
Giữ exam promise và real-life promise cùng lúc, không biến thành list khô.

**Pause/Emphasis:**

- [NHẤN] "Thi N2 tốt hơn"
- [NHẤN] "Dùng thực tế tự nhiên hơn"

---

# Slide 04 – Story

**Role:**  
Mở lớp ví dụ thực tế hơn sau hook JLPT, nhưng vẫn cùng logic.

**On-screen:**

```text
Đồng nghiệp rủ đi ăn tối.
Nhưng tối nay phải gửi tài liệu cho khách.
```

**Script:**

Sau hook thi N2, mình chuyển sang một lớp ví dụ thực tế hơn.

Đồng nghiệp rủ bạn đi ăn tối.

Nhưng tối nay bạn còn phải gửi tài liệu cho khách.

Bạn không ghét mọi người.

Bạn cũng không phải là không muốn đi.

Nhưng bạn vẫn không thể đi.

Vậy trong tiếng Nhật, chỗ này nên nói thế nào cho tự nhiên và đúng?

**Speaker note:**  
Không map sẵn 4 mẫu quá chi tiết ở đây. Giữ story ngắn để tạo tò mò.

**Pause/Emphasis:**

- [NHẤN] "không ghét / không phải không muốn / nhưng vẫn không thể đi"

---

# Slide 05 – 3 Cách Nhìn

**Role:**  
Giới thiệu brand method theo bản ngắn, giải thích rõ `Nghĩa – Hình – Dụng` để viewer không bị khựng.

**On-screen:**

```text
3 cách nhìn

Nghĩa = ý chính
Hình = cấu trúc nối
Dụng = cách dùng thật

わけ = mạch logic của câu nói
```

**Script:**

Trước khi vào từng mẫu, mình chốt một cách nhìn rất ngắn.

Mình nhìn mỗi mẫu qua 3 mặt:
ý nghĩa, dạng, và cách dùng.

`Ý nghĩa` là:
ở đây, mẫu này dùng để nói ý gì.

`Dạng` là:
nó đi với dạng nào.

`Cách dùng` là:
người Nhật thường dùng trong tình huống nào, và nghe ra sắc thái gì.

Với nhóm quà kê, điểm quan trọng nhất là:

đừng nhìn chữ quà kê trước.

[TTS_PAUSE_SHORT]
Hãy hỏi:
ở câu này, người nói đang muốn nói gì?

Đang kết luận?
Đang đính chính lại cách hiểu?
Đang bác bỏ mạnh?
Hay đang bị ràng buộc nên không thể làm?

**Speaker note:**  
Chỉ 20–30 giây. Không meta quá dài. Lần đầu xuất hiện cần giải thích nhanh bộ 3 `Ý nghĩa – Dạng – Cách dùng`.

**Pause/Emphasis:**

- [NHẤN] "ý nghĩa, dạng, và cách dùng"
- [NHẤN] "ở câu này, người nói đang muốn nói gì?"

---

# Slide 06 – わけではない

**Role:**  
Dạy mẫu liên quan trực tiếp tới hook.

**On-screen:**

```text
わけではない

Nghĩa cốt lõi:
không phải là... / không có nghĩa là...

Hình thức / cấu trúc:
普通形 + わけではない
```

**Script:**

Mẫu đầu tiên là quà kê đê há nà ì.

Nếu nói rất đời thường,
mẫu này có cảm giác:

"Không phải vậy đâu."

Người nói không phủi sạch mọi thứ.

Người nói đang sửa một cách hiểu dễ bị lệch.

Nghĩa cốt lõi của nó là:

"không phải là...", "không có nghĩa là...", hoặc "không hẳn là...".

Hình thức / cấu trúc là:

thể thường cộng quà kê đê há nà ì.

Ví dụ:

[VOICE_JA_01]

Ở đây người nói không nói "tôi không muốn đi".

Người nói đang sửa một hiểu nhầm.

Kiểu như:

"Đừng hiểu là tôi không muốn đi."

[TTS_PAUSE_SHORT]

Cách dùng / sắc thái:

Điểm dễ nhầm nằm ở đây.

quà kê đê há nà ì không phải kiểu bác bỏ rất mạnh.

Nó thường mềm hơn.

Nghe như đang đính chính, chỉnh lại góc hiểu, hoặc kéo câu về chính xác hơn.

Và ở đúng một chỗ gần đời sống hơn, bạn có thể nhớ kiểu này:

[VOICE_JA_02]

Không phải mình seen mà cố tình bơ đâu.
Chỉ là lúc đó đang họp thôi.

[TTS_PAUSE_SHORT]

Dấu hiệu chọn mẫu:

Khi vào đề, bạn để ý các tín hiệu như:

- câu đang có nguy cơ bị hiểu quá đà;
- có cảm giác "không phải là như thế";
- người nói muốn nói lại cho đúng hơn chứ không đập mạnh xuống bàn;
- các cụm như không phải ý đó, không hẳn / đâu có, hoặc kiểu phủ định mềm rất hay đi cùng logic này.

Bẫy dễ nhầm:

[TTS_PAUSE_SHORT]

Thấy phủ định là nhiều bạn kéo sang quà kê gá nà ì.

Nhưng quà kê gá nà ì là "làm gì có chuyện", mạnh hơn hẳn.

Còn ở đây, người nói đang sửa hiểu nhầm.

Nó chưa tới mức bác bỏ khả năng.

**Speaker note:**  
Giữ trong 70–90 giây. Không nói "phủ định một phần" như nhãn chính vì dễ làm hẹp nghĩa.

**Pause/Emphasis:**

- [NHẤN] "không phải là... / không có nghĩa là..."
- [NHẤN] "sửa một hiểu nhầm"

---

# Slide 07 – わけにはいかない

**Role:**  
Dạy mẫu thứ hai để giải quyết hook ngay, nhưng giữ phần `Vないわけにはいかない` như bonus ngắn để không làm nặng video.

**On-screen:**

```text
わけにはいかない

Nghĩa cốt lõi:
không thể làm vì ràng buộc

Hình thức / cấu trúc:
V辞書形 + わけにはいかない

Bonus:
Vない + わけにはいかない
= buộc phải làm
```

**Script:**

Mẫu thứ hai là quà kê ni ha i cá nà ì.

Nghĩa cốt lõi:

Không thể làm vì có lý do, trách nhiệm hoặc ràng buộc.

Nói dễ hiểu hơn,
thì nó là:

"Muốn cũng không thể làm."

Không phải vì không làm nổi.

Mà vì hoàn cảnh hoặc trách nhiệm không cho mình làm.

Hình thức / cấu trúc chính là:

V thể từ điển cộng quà kê ni ha i cá nà ì.

Ví dụ:

[VOICE_JA_01]

[TTS_PAUSE_SHORT]
Em cũng muốn đi lắm ạ. Nhưng tối nay em phải gửi tài liệu cho khách, nên thật sự không đi được.

Người nói có thể vẫn muốn đi.

Nhưng vì trách nhiệm công việc nên đành chịu, không đi được.

Có một dạng bonus rất hay gặp:

thể nai cộng quà kê ni ha i cá nà ì.

Dạng này nghĩa là "không thể không làm", tức là buộc phải làm.

Ví dụ:

[VOICE_JA_02]

Ngày mai có bài thi nên buộc phải học.

Trong video này, bạn chỉ cần nhớ nhanh dạng bonus này. Worksheet sẽ có bài tập riêng cho nó.

Cách dùng / sắc thái:

Điểm quan trọng là:
không phải "không thể" vì thiếu khả năng.

Mà là vì deadline, trách nhiệm, quy tắc, hay hoàn cảnh thực tế giữ người nói lại.

Dấu hiệu chọn mẫu:

Khi vào đề, bạn để ý các tín hiệu như:

- deadline
- trách nhiệm
- quy tắc
- vị trí / vai trò
- với tư cách người đi làm

Chỉ cần thấy một ràng buộc đủ mạnh, bạn nên bật ngay hướng nghĩ tới quà kê ni ha i cá nà ì.

Bẫy dễ nhầm:

Nhiều bạn thấy "không thể" rồi kéo sang quà kê gá nà ì.

Nhưng quà kê gá nà ì là nhận định "không thể nào xảy ra".

quà kê ni ha i cá nà ì thì khác.

Việc đó có thể làm được đấy.
Chỉ là trong hoàn cảnh này, người nói không thể làm.

Đến đây, bạn thử tự hỏi:

người nói không muốn đi?

hay người nói muốn nhưng không thể đi?

[TTS_PAUSE_MED]
Nếu phân biệt được câu này, bạn đã gỡ được một nửa nhóm quà kê rồi.

**Speaker note:**  
Chốt rõ "muốn cũng không thể làm". Dạng `Vないわけにはいかない` chỉ nói như bonus, không phân tích quá sâu.

**Pause/Emphasis:**

- [NHẤN] "muốn cũng không thể làm"
- [NHẤN] "Vないわけにはいかない = buộc phải làm"
- [NHẤN] "không muốn đi hay muốn nhưng không thể đi?"

---

# Slide 08 – わけだ

**Role:**  
Dạy mẫu kết luận hợp lý.

**On-screen:**

```text
わけだ

Nghĩa cốt lõi:
kết luận hợp lý / thảo nào

Hình thức / cấu trúc:
普通形 + わけだ
```

**Script:**

Tiếp theo là quà kê da.

Catchphrase dễ nhớ là:

"Thảo nào."

Nhưng mình giữ một nhắc nhỏ ở đây:
đừng học quà kê da chỉ như một câu cảm thán.

Nghĩa cốt lõi của nó là:

"kết luận hợp lý", "thảo nào", "hóa ra là vậy", hoặc "vì vậy nên...".

Hình thức / cấu trúc:

thể thường cộng quà kê da.

Ví dụ:

[VOICE_JA_01]

[TTS_PAUSE_SHORT]
Người nói vừa nghe lý do "tối nay phải gửi tài liệu cho khách", rồi rút ra kết luận:

"À, thảo nào không đi được".

Cách dùng / sắc thái:

Dùng khi người nói nhìn thấy lý do hoặc dữ kiện,
rồi đi đến một kết luận hợp lý.

Dấu hiệu chọn mẫu:

Khi vào đề, bạn nhìn xem:

- phía trước đã có dữ kiện chưa;
- sau đó có một kết luận được rút ra không;
- câu có cảm giác "à, ra vậy" hay "xét thế thì hợp lý" không.

Các tín hiệu kiểu à ra vậy, à ra vậy, hoặc mô hình `lý do -> kết luận` rất hợp với quà kê da.

Không chỉ là "vừa phát hiện ra", mà là "xét lý do đó thì kết quả này là hợp lý".

Bẫy dễ nhầm:

Nếu câu đang bị kéo về hướng ràng buộc "nên không thể làm", có khi đáp án đúng lại là quà kê ni ha i cá nà ì, không phải quà kê da.

[TTS_PAUSE_SHORT]
quà kê da là tầng kết luận.

Nó không tự mang nghĩa bị trói buộc.

**Speaker note:**  
Cho cảm giác "à, ra là vậy", nhưng không giải thích quá hẹp.

**Pause/Emphasis:**

- [NHẤN] "kết luận hợp lý"
- [NHẤN] "lý do → kết luận"

---

# Slide 09 – わけがない

**Role:**  
Dạy mẫu phủ định khả năng rất mạnh.

**On-screen:**

```text
わけがない

Nghĩa cốt lõi:
không thể nào

Hình thức / cấu trúc:
普通形 + わけがない
```

**Script:**

Mẫu cuối cùng là quà kê gá nà ì.

Nghĩa cốt lõi:

"không thể nào", "làm gì có chuyện...".

Nếu cần một nhãn rất ngắn,
thì đây là:

"Làm gì có chuyện."

Hình thức / cấu trúc:

thể thường cộng quà kê gá nà ì.

Ví dụ:

[VOICE_JA_01]

Ở đây người nói đang bác bỏ khả năng một cách rất mạnh:

"Không thể nào cậu ấy ghét mọi người được."

Cách dùng / sắc thái:

Mạnh hơn quà kê đê há nà ì rất nhiều.

Nghe như người nói gần như chắc chắn điều đó là không thể.

Trong công ty hoặc khi nói trực tiếp với người trên, cần để ý vì nó có cảm giác bác bỏ khá mạnh.

[TTS_PAUSE_SHORT]

Dấu hiệu chọn mẫu:

Khi vào đề, bạn để ý các tín hiệu như:

- tuyệt đối
- không thể có chuyện đó
- chuyện như vậy
- cảm giác "không đời nào".

Nếu câu đang đi theo hướng phán đoán mạnh về khả năng xảy ra, quà kê gá nà ì rất sáng.

Bẫy dễ nhầm:

[TTS_PAUSE_SHORT]

Đừng trộn nó với quà kê đê há nà ì.

Một bên là sửa hiểu nhầm.

Một bên là bác bỏ khả năng rất mạnh.

**Speaker note:**  
Cần tách rõ với `わけではない`.

**Pause/Emphasis:**

- [NHẤN] "phủ định khả năng rất mạnh"
- [NHẤN] "mạnh hơn わけではない"

---

# Slide 10 – Comparison Map

**Role:**  
Cho người học một tấm bản đồ tổng quan.

**On-screen:**

```text
4 mẫu わけ = 4 mạch logic

わけだ           → kết luận hợp lý
わけではない     → phủ định nhận định
わけがない       → phủ định khả năng mạnh
わけにはいかない → ràng buộc nên không thể làm
```

**Script:**

Đến đây, bạn nên nhìn nhóm này như 4 mạch logic riêng.

Không học theo 4 đáp án rời rạc.

Hãy học theo 4 hành động trong câu:

- kết luận hợp lý
- phủ định một nhận định
- phủ định khả năng rất mạnh
- bị ràng buộc nên không thể làm

Nếu quên nghĩa tiếng Việt, bạn vẫn còn một câu cứu rất mạnh:

Ở câu này, người nói đang muốn nói gì?

**Speaker note:**  
Đây là slide map để viewer sắp xếp lại trong đầu.

**Pause/Emphasis:**

- [NHẤN] "4 mẫu わけ = 4 mạch logic"

---

# Slide 11 – Comparison 1

**Role:**  
Gỡ cặp nhầm lớn nhất.

**On-screen:**

```text
わけではない vs わけがない

Phủ định nhận định
vs
Phủ định khả năng rất mạnh
```

**Script:**

Cặp dễ nhầm nhiều nhất là quà kê đê há nà ì và quà kê gá nà ì.

quà kê đê há nà ì:

Không phải là A, không có nghĩa là A.

quà kê gá nà ì:

Không thể nào là A.

Ví dụ:

ghét na quà kê đê há nà ì

= không phải là ghét.

ghét na quà kê gá nà ì

= không thể nào ghét được.

Bạn có thể tự hỏi rất nhanh thế này.

quà kê đê há nà ì:
người nói đang kéo câu lại cho đúng.

quà kê gá nà ì:
người nói đang chặn luôn khả năng đó.

Một bên là sửa hiểu nhầm hoặc phủ định một nhận định.

Một bên là bác bỏ khả năng rất mạnh.

**Speaker note:**  
Cần cho thấy mức độ mạnh / mềm, nhưng không dùng "phủ định một phần" làm nhãn chính.

**Pause/Emphasis:**

- [NHẤN] "sửa hiểu nhầm" vs "bác bỏ khả năng"

---

# Slide 12 – Comparison 2

**Role:**  
Gỡ cặp nhầm thứ hai.

**On-screen:**

```text
わけがない vs わけにはいかない

Không thể nào xảy ra
vs
Muốn cũng không thể làm vì ràng buộc
```

**Script:**

Cặp thứ hai là quà kê gá nà ì và quà kê ni ha i cá nà ì.

quà kê gá nà ì = không thể nào về mặt khả năng hoặc nhận định.

quà kê ni ha i cá nà ì = muốn cũng không thể làm vì có ràng buộc.

Ví dụ:

[VOICE_JA_01]

= Không thể nào anh ấy nói như vậy.

[VOICE_JA_02]

= Hôm nay không thể nghỉ vì có ràng buộc.

[TTS_PAUSE_SHORT]

Đây cũng là cặp rất hay bị ra kiểu bẫy JLPT.

Một bên là nhận định về khả năng.

Một bên là hành động bị hoàn cảnh giữ lại.

Nếu bạn thấy người nói đang phán đoán "không đời nào xảy ra", nghiêng về quà kê gá nà ì.

Nếu bạn thấy việc đó làm được nhưng bị deadline, trách nhiệm, luật giữ lại, nghiêng về quà kê ni ha i cá nà ì.

**Speaker note:**  
Chốt khác biệt giữa nhận định và hành động bị ràng buộc.

**Pause/Emphasis:**

- [NHẤN] "nhận định" vs "hành động bị ràng buộc"

---

# Slide 13 – Dấu Hiệu Chọn Mẫu

**Role:**  
Biến bài học thành công cụ làm đề và seed CTA sớm. Làm phần này cụ thể hơn bằng mini mapping để viewer biết áp dụng ngay.

**On-screen:**

```text
Dấu hiệu chọn mẫu

Cụm từ đi trước
Cụm từ đi sau
Mạch logic của câu nói

明日N2だから
→ だから行けないわけだ
行きたくない → わけではない
絶対ありえない → わけがない
責任がある → わけにはいかない
```

**Script:**

Khi làm đề, đừng nhìn thấy quà kê rồi đoán.

Hãy nhìn 3 điểm.

Một, `cụm từ đi trước`.

Có lý do đi trước không? Có đang muốn sửa hiểu nhầm không?

Hai, `cụm từ đi sau`.

Sau đó là kết luận, phủ định hay ràng buộc?

Ba, `mạch logic của câu nói`.

Người nói đang kết luận, phủ định, bác bỏ, hay bị ràng buộc?

[TTS_PAUSE_SHORT]
Đây là phần rất đáng tiền trong lúc làm JLPT.

Vì nhiều câu không khó ở từ vựng.

Nó khó ở chỗ bạn đọc ra đúng hành động của người nói hay không.

Ví dụ, nghe ai đó nói vì mai thi N2 hoặc phải gửi tài liệu trong tối nay, rồi từ đó hiểu ra "à, vậy nên không đi được", đó mới là lane của quà kê da.

Thấy câu sửa hiểu nhầm kiểu "không phải là không muốn", đó là quà kê đê há nà ì.

Thấy cảm giác "không thể nào / làm gì có chuyện", đó là quà kê gá nà ì.

Thấy trách nhiệm, deadline, quy tắc, đó là quà kê ni ha i cá nà ì.

Bảng `dấu hiệu chọn mẫu` này mình cũng để trong worksheet cuối video.

**Speaker note:**  
Đây là slide chuyển từ teaching thành exam tool. Cần cho ví dụ mini, không chỉ nói concept.

**Pause/Emphasis:**

- [NHẤN] "cụm từ đi trước / cụm từ đi sau / mạch logic của câu nói"
- [NHẤN] "dấu hiệu này có trong worksheet"

---

# Slide 14 – Worked Example Retrieval

**Role:**  
Quay lại chính câu hook, nhưng lần này dùng nó như worked example ngắn: đọc câu, tìm clue, gọi tên hành động của người nói, loại bẫy sai, rồi mới reveal đáp án.

**On-screen:**

```text
行きたくない＿＿んだけど、
明日N2だから、今夜は遊びに行く＿＿。

A. わけでは / わけには
B. わけが / わけでは
C. わけだ / わけが
```

**Script:**

Quay lại câu hook lúc đầu.

Nhưng lần này mình không nhìn đáp án trước.

Bước 1: đọc chỗ trống đầu tiên.

[TTS_PAUSE_SHORT]
[VOICE_JA_01]

Clue nằm ở phần người nói đang kéo câu theo hướng đính chính:
"không phải là không muốn đi".

Người nói không phủ định mạnh kiểu "làm gì có chuyện". Người nói đang sửa một hiểu nhầm:

"Không phải là tôi không muốn đi."

Vì vậy đáp án là quà kê đê há nà ì.

[TTS_PAUSE_SHORT]
Nếu chọn quà kê gá nà ì, sắc thái sẽ quá mạnh, thành "không thể nào tôi không muốn đi", lệch khỏi mạch câu.

Bước 2: đọc chỗ trống thứ hai.

[TTS_PAUSE_SHORT]
[VOICE_JA_02]

Ở đây có vì mai thi N2: thật ra muốn đi, nhưng ngày mai có kỳ thi nên bị giữ lại.

Người nói không chỉ đang kết luận. Người nói đang bị ràng buộc nên không thể làm.

Vì vậy đáp án là quà kê ni ha i cá nà ì.

Nếu chọn quà kê da, câu chỉ còn là tầng kết luận, không diễn tả được áp lực "muốn cũng không thể đi vì kỳ thi".

[TTS_REVEAL]
Vậy đáp án đúng là A:

[VOICE_JA_03].

Đây là cách mình muốn bạn làm trong đề: đừng nhìn chữ quà kê trước, hãy hỏi người nói đang làm gì.

**Speaker note:**  
Đây là payoff của hook, nên cần có nhịp nghĩ thật rõ. Đừng chỉ reveal đáp án; phải cho người học thấy cách loại đáp án sai.

**Pause/Emphasis:**

- [NHẤN] "đọc clue trước, không nhìn đáp án trước"
- [NHẤN] "sửa hiểu nhầm" vs "phủ định mạnh"
- [NHẤN] "bị ràng buộc nên không thể làm"

---

# Slide 15 – Diagnostic Practice

**Role:**  
Diagnostic practice: kiểm tra xem người học có nhầm sửa hiểu nhầm nhẹ (`わけではない`) với bác bỏ mạnh (`わけがない`) không.

**On-screen:**

```text
あの人がみんなを嫌いな＿＿。

A. わけではない
B. わけがない
C. わけだ
```

**Script:**

Trước khi mình giải, bạn thử tự chọn.

[TTS_PAUSE_MED]

Câu này muốn nói:

"Không thể nào cậu ấy ghét mọi người."

Đây là phủ định khả năng rất mạnh.

Nên chọn quà kê gá nà ì.

[TTS_REVEAL]
[VOICE_JA_01]

Nếu bạn chọn quà kê đê há nà ì, đó là một bẫy rất thường gặp.

quà kê đê há nà ì chỉ là cách sửa một cách hiểu hoặc phủ định một nhận định. Câu chỉ còn là:

"Không phải là ghét."

Nhưng ở đây người nói muốn bác bỏ mạnh:

"Làm gì có chuyện cậu ấy ghét mọi người."

Vì vậy quà kê gá nà ì hợp hơn.

Trap tag của câu này là: nhầm mức độ phủ định.

Bạn không sai vì không biết nghĩa. Bạn sai vì chọn mẫu quá mềm cho một câu đang bác bỏ rất mạnh.

Lưu ý hình thức / cấu trúc:

ghét là tính từ na, nên phải là:

ghét na quà kê gá nà ì.

Trong worksheet và quiz chẩn đoán, dạng này sẽ được tách riêng để bạn biết mình hay sai vì nhầm sắc thái, nhầm clue, hay nhầm form.

**Speaker note:**  
Đây không chỉ là practice mà là diagnostic moment. Cần pause thật trước reveal để người học tự nhận ra trap của mình.

**Pause/Emphasis:**

- [NHẤN] "dừng lại tự chọn trước"
- [NHẤN] "phủ định khả năng rất mạnh"
- [NHẤN] "sửa hiểu nhầm nhẹ" vs "bác bỏ mạnh"
- [NHẤN] "trap tag: nhầm mức độ phủ định"
- [NHẤN] "嫌いなわけがない"

---

# Slide 16 – Recap

**Role:**  
Tổng kết để screenshot. Khi dựng slide, 4 nhãn chính phải lớn hơn phần bonus.

**On-screen:**

```text
わけだ           = kết luận hợp lý
わけではない     = không phải là...
わけがない       = không thể nào...
わけにはいかない = không thể vì ràng buộc

Bonus nhỏ:
Vないわけにはいかない = buộc phải làm
```

**Script:**

Tóm lại, bạn chỉ cần nhớ 4 nhãn chính:

[TTS_PAUSE_SHORT]

quà kê da = kết luận hợp lý.

quà kê đê há nà ì = không phải là... / không có nghĩa là...

quà kê gá nà ì = không thể nào...

quà kê ni ha i cá nà ì = không thể vì ràng buộc.

Bonus nhớ nhẹ:

thể nai quà kê ni ha i cá nà ì nghĩa là không thể không làm, tức là buộc phải làm.

Phần bonus này bạn chỉ cần nhớ thêm, còn 4 dòng chính là phần quan trọng nhất để chụp lại.

**Speaker note:**  
Gọn, sạch, dễ screenshot. Khi thiết kế, 4 dòng chính = lớn; bonus = nhỏ, nằm dưới cùng.

**Pause/Emphasis:**

- [NHẤN] "4 nhãn chính"
- [NHẤN] "bonus nhỏ"

---

# Slide 17 – CTA Worksheet / Diagnostic Quiz

**Role:**  
Dẫn về worksheet và quiz chẩn đoán một cách mềm: người học không chỉ tải PDF, mà biết mình đang rơi vào loại bẫy nào và nên ôn lại phần nào.

**On-screen:**

```text
Nếu hiểu bài rồi
mà vào đề vẫn còn lưỡng lự:

Phần luyện tiếp theo sẽ giúp bạn:

- nhìn lại 4 mẫu qua Ý nghĩa – Dạng – Cách dùng
- luyện dấu hiệu để chọn trong câu thật
- làm bài kiểu JLPT
- xem mình hay nhầm ở đâu
```

**Script:**

Nếu sau video này bạn thấy mình hiểu bài rồi,

nhưng vào đề vẫn hay khựng lại giữa quà kê đê há nà ì và quà kê gá nà ì,

hoặc giữa quà kê gá nà ì và quà kê ni ha i cá nà ì,

[TTS_PAUSE_SHORT]
thì phần luyện tiếp theo ở mô tả sẽ hợp với bạn.

Bạn sẽ đi lại bài này theo đúng thứ tự khi làm đề:

nhìn lại 4 mẫu qua `Ý nghĩa – Dạng – Cách dùng`,

luyện dấu hiệu để chọn trong câu thật,

rồi làm quiz để xem mình hay nhầm ở đâu.

Điểm chính là không chỉ đọc lại lý thuyết cho yên tâm.

Bạn sẽ biết mình hay sai vì dịch theo tiếng Việt, bỏ lỡ dấu hiệu, nhầm sắc thái, hay nhầm dạng.

Sau đó quay lại đúng phần cần ôn, thay vì học lại cả bài từ đầu.

Nếu thấy cách học này dễ hiểu, bạn có thể lưu video lại.

Những bài sau mình sẽ tiếp tục dùng cùng một khung để gỡ các nhóm N2 dễ nhầm khác.

**Speaker note:**  
Không salesy. Nhấn rõ worksheet + quiz giải quyết nỗi sợ "hiểu rồi nhưng vào đề vẫn chọn nhầm", và biến CTA thành bước tiếp theo của học tập.

**Pause/Emphasis:**

- [NHẤN] "hiểu rồi nhưng vào đề vẫn phân vân"
- [NHẤN] "phần luyện tiếp theo"
- [NHẤN] "quiz để xem mình hay nhầm ở đâu"

---

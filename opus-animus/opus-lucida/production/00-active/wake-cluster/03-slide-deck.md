# Wake Cluster Slide Deck - Structure Layer v5

**Status:** Structure layer draft for review  
**Role:** Visual teaching logic before design layer and script rewrite  
**Source of truth:** `01-master-teaching-skeleton.md`  
**Output architecture:** `05-wake-mvp-output-architecture.md`  
**Design direction:** `production/02-assets/design-briefs/lucida-slide-design-direction.md`  
**Production version:** 17 slides  
**Target video length:** 10-13 minutes

---

## 0. Structure Contract

This file currently defines the **Slide Structure Layer** only.

It answers:

```text
What does each slide teach?
What appears on screen?
What reveals in what order?
What must the script explain?
What teaching risk must not be broken?
```

It does not yet define the full **Design Layer**:

```text
Layout
Visual elements
Hierarchy / emphasis
Motion / reveal notes
Design-system link
```

Design layer comes after structure review.

---

## 1. Slide Flow

```text
01. Opening situation
02. Hook quiz
03. Topic intro + dual promise
04. Story
05. 3 cách nhìn + big idea
06. わけではない
07. わけにはいかない
08. わけだ
09. わけがない
10. Comparison map
11. わけではない vs わけがない
12. わけがない vs わけにはいかない
13. Dấu hiệu chọn mẫu
14. Worked example retrieval
15. Diagnostic practice
16. Recap
17. CTA worksheet / diagnostic quiz
```

---

## Slide 01 - Tình huống mở đầu

**Source link:**  
Skeleton §3 Hook Core; Architecture beat 01 Opening situation.

**Role:**  
Đưa pain point vào ngay bằng hook đúng core persona: đêm trước JLPT, hai câu đều có `わけ`, nhưng người nói đang làm hai việc khác nhau.

**On-screen:**

```text
行きたくないわけじゃないんだけど、
明日N2だから、今夜は遊びに行くわけにはいかないんだ。

Cùng có わけ.
Nhưng ý người nói ở hai câu này không giống nhau.
```

**Build / reveal:**

```text
1. Reveal câu 1.
2. Reveal câu 2.
3. Highlight わけじゃない / わけにはいかない.
4. Reveal takeaway: không cùng ý người nói.
```

**Script beat:**  
Mở bằng đúng tình huống người học N2 rất dễ gặp: được rủ đi chơi, nhưng ngày mai có kỳ thi. Chốt thật ngắn: "Không phải là không muốn đi. Nhưng tối nay thì không đi được." Nhấn rằng nhìn đều là `わけ`, nhưng người nói đang làm hai việc khác nhau.

**Teaching check:**  
Chưa dạy ngữ pháp ở đây. Slide này chỉ cần làm người học thấy: "À, mình dễ nhầm thật."

---

## Slide 02 - Thử chọn nhanh

**Source link:**  
Skeleton §3 Hook Quiz / Contrast; Architecture beat 02 Hook quiz.

**Role:**  
Biến hook đêm trước JLPT thành câu hỏi kiểu đề thi để người học thử chọn trước.

**On-screen:**

```text
行きたくない＿＿んだけど、
明日N2だから、今夜は遊びに行く＿＿。

A. わけでは / わけには
B. わけが / わけでは
C. わけだ / わけが
```

**Build / reveal:**

```text
1. Reveal question.
2. Reveal choices.
3. Pause 3 seconds.
4. Reveal answer: A.
5. Temporary payoff:
   わけではない = không phải là theo nghĩa đó
   わけにはいかない = muốn cũng không làm được, vì có ràng buộc
```

**Script beat:**  
Mời người học chọn nhanh trước. Báo trước là cuối video sẽ quay lại đúng câu này và giải theo từng bước: nhìn dấu hiệu nào, người nói đang làm gì, và vì sao đáp án kia nghe có vẻ đúng mà vẫn sai.

**Teaching check:**  
Đây chưa phải phần giải đề đầy đủ. Chỉ cần cho người học thử trước và có một payoff nhỏ để muốn xem tiếp.

---

## Slide 03 - Bài này giúp gì?

**Source link:**  
Skeleton §2 Audience and Promise; Skeleton §5 Big Idea; Architecture beat 03 Topic intro + promise.

**Role:**  
Giới thiệu chủ đề sau hook và chốt hai outcome: làm N2 tốt hơn và hiểu/dùng thực tế tự nhiên hơn.

**On-screen:**

```text
JLPT N2: 4 mẫu わけ hay nhầm

わけだ
わけではない
わけがない
わけにはいかない

Học xong, bạn sẽ đỡ nhầm ở 2 chỗ:

Khi làm đề N2
→ đỡ chọn theo những đáp án nghe na ná nhau

Khi nghe ngoài đời
→ nghe ra người nói đang kết luận, đính chính,
   bác bỏ hay bị ràng buộc
```

**Build / reveal:**

```text
1. Reveal title.
2. Reveal 4 patterns.
3. Reveal outcome 1: Thi N2 tốt hơn.
4. Reveal outcome 2: Dùng thực tế tự nhiên hơn.
5. Reveal guiding question:
   Ở câu này, người nói đang muốn nói theo hướng nào?
```

**Script beat:**  
Nói rõ bài này không phải để học thuộc 4 nghĩa rời nhau. Mục tiêu là khi vào đề, bạn bớt chọn theo cảm giác; còn khi nghe ngoài đời, bạn hiểu người nói đang muốn nói theo hướng nào.

**Teaching check:**  
Không hứa kiểu mẹo vặt "nhìn keyword là ra đáp án". Phải giữ đúng hai trục: làm đề tốt hơn và hiểu câu tự nhiên hơn.

---

## Slide 04 - Tình huống thực tế

**Source link:**  
Skeleton §4 Story Core; Architecture beat 04 Story.

**Role:**  
Mở lớp ví dụ thứ hai mang tính thực tế hơn: bị rủ đi ăn tối, nhưng tối nay phải gửi tài liệu cho khách.

**On-screen:**

```text
Đồng nghiệp rủ đi ăn tối.

Nhưng tối nay còn phải gửi tài liệu cho khách.
```

**Build / reveal:**

```text
1. Reveal lời rủ đi ăn tối.
2. Reveal trách nhiệm phải gửi tài liệu cho khách.
3. Reveal conflict: muốn đi nhưng bị công việc giữ lại.
```

**Script beat:**  
Ở đây vẫn là cùng một mạch: không phải ghét hay không muốn đi. Chỉ là tối nay có việc phải làm nên không đi được. Dùng slide này để kéo từ ngữ cảnh kỳ thi sang ngữ cảnh công việc thật.

**Teaching check:**  
Không map sẵn cả 4 mẫu ngay trong story. Story chỉ tạo tension.

---

## Slide 05 - Cách nhìn để phân biệt

**Source link:**  
Skeleton §5 Big Idea; Skeleton §6 Terminology System; Architecture beat 05 3 cách nhìn + big idea.

**Role:**  
Đặt một cách nhìn chung trước khi vào từng mẫu: nhìn qua Ý nghĩa - Dạng - Cách dùng, rồi xem câu này đang nghiêng về ý nào.

**On-screen:**

```text
Ở câu này, người nói đang muốn nói gì?

Ý nghĩa - Dạng - Cách dùng

Ý nghĩa: ở đây, mẫu này dùng để nói ý gì?
Dạng: mẫu này đi với dạng nào?
Cách dùng: thường dùng trong tình huống nào? nghe có sắc thái gì?

Đừng nhìn chữ わけ trước.
Hãy nhìn xem người nói đang muốn nhấn vào đâu.
```

**Build / reveal:**

```text
1. Reveal guiding question.
2. Reveal Ý nghĩa - Dạng - Cách dùng.
3. Reveal three guiding questions.
4. Reveal mantra.
```

**Script beat:**  
Giải thích cực ngắn cách nhìn cả nhóm này. Nhấn rằng nếu chỉ nhớ nghĩa tiếng Việt, rất dễ chọn nhầm; còn nếu nhìn theo mạch câu và ý người nói, bốn mẫu sẽ tách ra rõ hơn nhiều.

**Teaching check:**  
Không dùng terms English như `Meaning / Form / Usage / Clue Map` trên slide public.

---

## Slide 06 - わけではない

**Source link:**  
Skeleton §7 Grammar point 1; Architecture beat 06 わけではない.

**Role:**  
Dạy mẫu liên quan trực tiếp tới câu hook: người nói đang đính chính lại một cách hiểu dễ bị lệch.

**On-screen:**

```text
わけではない

Ở câu này, người nói đang muốn nói gì?
Không phải là theo nghĩa đó.
Đang đính chính lại cách hiểu.

Ý nghĩa:
không phải là... / không có nghĩa là...

Dạng:
普通形 + わけではない

Cách dùng:
dùng khi muốn gỡ lại một cách hiểu sai

Bẫy dễ nhầm:
đừng kéo sang わけがない nếu câu chỉ đang đính chính

行きたくないわけではありません。
```

**Build / reveal:**

```text
1. Reveal pattern.
2. Reveal speaker action.
3. Reveal meaning.
4. Reveal form.
5. Reveal example.
6. Highlight ではありません.
7. Optional support example:
   既読無視したわけじゃないよ。
   会議中だっただけ。
```

**Script beat:**  
Giải thích theo cách người học dễ chốt trong đầu: ở đây không phải phủ nhận rất mạnh. Người nói đang gỡ lại một cách hiểu sai: "Không phải là mình không muốn đi theo kiểu đó." Có thể thêm đúng một ví dụ gần đời sống: "Không phải là mình seen rồi lơ đâu, lúc đó đang họp thôi."

**Teaching check:**  
Không dạy `わけではない` như một nhãn chết kiểu "phủ định một phần". Cốt lõi là đang đính chính lại cách hiểu. Ví dụ `seen không rep` chỉ dùng ở đây để kéo gần ngữ cảnh, không rải ra cả bài.

---

## Slide 07 - わけにはいかない

**Source link:**  
Skeleton §7 Grammar point 2; Architecture beat 07 わけにはいかない.

**Role:**  
Dạy mẫu thứ hai để hoàn tất payoff của hook: không thể làm vì trách nhiệm / hoàn cảnh / ràng buộc.

**On-screen:**

```text
わけにはいかない

Không phải không làm được.
Mà là có việc khác giữ lại.

Ý nghĩa:
muốn cũng không làm được, vì có ràng buộc

Dạng:
V辞書形 + わけにはいかない

Cách dùng:
hay gặp khi có deadline, trách nhiệm, quy tắc, vai trò

Ví dụ:
今夜は資料を送らないといけないので、
飲みに行くわけにはいきません。

Bẫy dễ nhầm:
đừng kéo sang わけがない

Một bên:
bị ràng buộc nên không làm được

Một bên:
không thể nào lại như thế

Bonus:
Vない + わけにはいかない
= không thể không làm
```

**Build / reveal:**

```text
1. Reveal pattern.
2. Reveal speaker action.
3. Reveal meaning.
4. Reveal main form.
5. Reveal bonus form as secondary.
6. Reveal cue words: 試験 / 締切 / 責任 / ルール.
```

**Script beat:**  
Chốt thật rõ: "không thể" ở đây không phải vì không có khả năng. Vẫn có thể đi, nhưng không thể đi trong tình huống này vì đang bị kỳ thi, deadline, trách nhiệm hay quy tắc giữ lại.

**Teaching check:**  
Phải có `Vないわけにはいかない`, nhưng chỉ như phần mở rộng nhỏ. Trọng tâm vẫn là cảm giác "muốn cũng không làm được vì có ràng buộc".

---

## Slide 08 - わけだ

**Source link:**  
Skeleton §7 Grammar point 3; Architecture beat 08 わけだ.

**Role:**  
Dạy logic rút ra kết luận hợp lý từ lý do / thông tin đã biết.

**On-screen:**

```text
わけだ

Người nói đang:
nghe đến đây thì hiểu ra: à, ra là vậy

Nghĩa:
nghe thông tin rồi rút ra kết luận
thảo nào / ra là vậy

Dạng:
普通形 + わけだ

Cách dùng:
có dữ kiện ở trước
rồi từ đó chốt ra kết luận

Lý do / thông tin
→ kết luận

Ví dụ:
今夜中に資料を送らないといけない
→ だから行けないわけだ

Bẫy dễ nhầm:
わけだ chỉ là kết luận
không tự mang nghĩa bị ràng buộc
```

**Build / reveal:**

```text
1. Reveal pattern.
2. Reveal speaker action.
3. Reveal meaning.
4. Reveal form.
5. Reveal logic arrow.
6. Optional example:
   今夜中に資料を送らないといけない
   → だから行けないわけだ
```

**Script beat:**  
Đừng dừng ở cách dịch "thảo nào". Cốt lõi là: có thông tin ở trước, rồi từ đó người nói hiểu ra và kết luận như vậy. Nhấn mũi tên "nghe thông tin -> rút ra kết luận".

**Teaching check:**  
Không biến `わけだ` thành một câu dịch thuộc lòng. Người học phải thấy được mạch "có dữ kiện trước, có kết luận sau".

---

## Slide 09 - わけがない

**Source link:**  
Skeleton §7 Grammar point 4; Architecture beat 09 わけがない.

**Role:**  
Dạy logic bác bỏ khả năng rất mạnh và chuẩn bị contrast với `わけではない`.

**On-screen:**

```text
わけがない

Người nói đang:
phủ nhận rất mạnh: không thể nào lại như thế

Nghĩa:
không thể nào...
làm gì có chuyện...

Dạng:
普通形 + わけがない

Cách dùng:
dùng khi người nói gần như chắc chắn
điều đó không thể xảy ra

Bẫy dễ nhầm:
nếu câu chỉ đang gỡ hiểu lầm
thì chưa phải わけがない

みんなを嫌っているわけがない
```

**Build / reveal:**

```text
1. Reveal pattern.
2. Reveal speaker action.
3. Reveal meaning.
4. Reveal form.
5. Reveal example.
6. Highlight な in 嫌いな.
```

**Script beat:**  
Nói cho người học nghe ra mức độ: đây là cách bác rất mạnh, kiểu "không thể nào lại như thế được". Dùng khi người nói gần như chắc chắn điều đó không thể xảy ra.

**Teaching check:**  
Phải nhấn `嫌い` là `な-adjective`, nên phải là `嫌いなわけがない`. Vừa nhắc form, vừa nhắc luôn mức độ phủ nhận rất mạnh.

---

## Slide 10 - Nhìn nhanh cả nhóm

**Source link:**  
Skeleton §8 Comparison Core; Architecture beat 10 Comparison map.

**Role:**  
Cho người học bản đồ tổng quan sau khi đã học đủ 4 mẫu.

**On-screen:**

```text
4 mẫu わけ = 4 cách người nói đẩy câu theo 4 hướng khác nhau

わけだ
→ rút ra kết luận hợp lý

わけではない
→ phủ định nhận định / đính chính

わけがない
→ bác bỏ khả năng rất mạnh

わけにはいかない
→ bị ràng buộc nên không thể làm

Nếu thấy nghĩa tiếng Việt nghe na ná nhau:
hỏi người nói đang muốn nói theo hướng nào?
```

**Build / reveal:**

```text
1. Reveal title.
2. Reveal 4 rows one by one.
3. Reveal final question.
```

**Script beat:**  
Chuyển từ từng mẫu riêng lẻ sang bản đồ chung. Nhấn câu chốt: đừng hỏi trước "dịch là gì", hãy hỏi "người nói đang làm gì trong câu này".

**Teaching check:**  
Slide này cần screenshot-friendly và không thêm logic mới.

---

## Slide 11 - わけではない vs わけがない

**Source link:**  
Skeleton §8 Comparison 1; Architecture beat 11 Comparison 1.

**Role:**  
Gỡ cặp nhầm lớn nhất: phủ định nhận định / đính chính khác với bác bỏ khả năng rất mạnh.

**On-screen:**

```text
わけではない
= đính chính lại cách hiểu
= không phải là theo nghĩa A đó

わけがない
= phủ nhận rất mạnh
= không thể nào lại là A

Trục khác nhau:
gỡ lại cách hiểu
vs
bác hẳn khả năng

Ví dụ A:
嫌いなわけではない
= không phải là ghét theo nghĩa đó

Ví dụ B:
嫌いなわけがない
= không thể nào lại ghét được

Bẫy hay gặp:
thấy đều là phủ định
nên chọn theo nghĩa Việt gần nhau
```

**Build / reveal:**

```text
1. Reveal わけではない side.
2. Reveal わけがない side.
3. Reveal minimal pair.
4. Highlight intensity / logic difference.
```

**Script beat:**  
Một bên chỉ đang gỡ lại cách hiểu: "không phải ghét theo nghĩa đó." Một bên thì bác rất mạnh: "không thể nào lại ghét." Người học phải nghe ra độ mạnh này.

**Teaching check:**  
Có thể nói một bên nhẹ hơn, nhưng không được nói mơ hồ kiểu "sửa nhẹ" mà làm mất đi bản chất đính chính của `わけではない`.

---

## Slide 12 - わけがない vs わけにはいかない

**Source link:**  
Skeleton §8 Comparison 2; Architecture beat 12 Comparison 2.

**Role:**  
Gỡ cặp nhầm giữa "không thể nào xảy ra" và "muốn cũng không thể làm vì bị ràng buộc".

**On-screen:**

```text
わけがない
= không thể nào lại xảy ra
= đang bác khả năng xảy ra

わけにはいかない
= muốn cũng không thể làm
= vì đang bị hoàn cảnh giữ lại

Phán đoán về khả năng
vs
Hành động bị ràng buộc nên không làm được

Ví dụ A:
そんなことを言うわけがない
= không thể nào lại nói thế

Ví dụ B:
今日は休むわけにはいかない
= hôm nay không thể nghỉ được

Bẫy hay gặp:
cùng dịch ra "không thể"
nhưng một bên là khả năng, một bên là ràng buộc
```

**Build / reveal:**

```text
1. Reveal わけがない side.
2. Reveal わけにはいかない side.
3. Reveal contrast cue:
   nhận định vs hành động bị giữ lại.
```

**Script beat:**  
Giải thích đúng cái bẫy người Việt rất hay sập: cả hai đều nghe ra "không thể", nhưng một bên là "không thể nào lại như thế", còn một bên là "muốn cũng không làm được vì có ràng buộc".

**Teaching check:**  
Đây là slide rất quan trọng cho N2, vì chỉ cần bám vào chữ "không thể" là rất dễ chọn sai ngay.

---

## Slide 13 - Bản đồ dấu hiệu

**Source link:**  
Skeleton §9 Dấu Hiệu Chọn Mẫu; Architecture beat 13 Clue map.

**Role:**  
Biến bài học thành công cụ làm đề và công cụ hiểu tình huống thật.

**On-screen:**

```text
Dấu hiệu để chọn mẫu

Trước chỗ trống:
đang gỡ hiểu lầm?
đang có lý do / dữ kiện?
đang có deadline / trách nhiệm?
hay đang bác rất mạnh?

Sau chỗ trống:
câu đi về hướng đính chính
hay đi về hướng kết luận
hay chốt là không làm được

Người nói đang muốn làm gì?

Gỡ lại cách hiểu
→ わけではない
→ Bẫy gần nhất: わけがない

Bác rất mạnh: không thể nào lại thế
→ わけがない
→ Bẫy gần nhất: わけではない

Muốn cũng không làm được vì có ràng buộc
→ わけにはいかない
→ Bẫy gần nhất: わけがない / わけだ

Nghe dữ kiện rồi rút ra kết luận
→ わけだ
→ Bẫy gần nhất: わけにはいかない
```

**Build / reveal:**

```text
1. Reveal 3-step checklist.
2. Reveal each mapping row one by one.
3. Highlight:
   Không nhìn đáp án trước, nhìn mạch logic trước.
4. Seed worksheet:
   Bảng này có trong worksheet / quiz.
```

**Script beat:**  
Khi làm đề, đừng nhìn đáp án trước. Hãy nhìn phần trước, phần sau, rồi tự hỏi người nói đang định đính chính, bác bỏ, kết luận hay nói về ràng buộc. Đó mới là cầu nối sang phần luyện.

**Teaching check:**  
Không biến slide này thành bảng keyword. Đây là dấu hiệu để suy luận, chứ không phải cứ thấy một từ là chốt đáp án ngay.

---

## Slide 14 - Giải đề từng bước

**Source link:**  
Skeleton §10 Practice Core - Worked Example Retrieval; Architecture beat 14 Worked example retrieval.

**Role:**  
Quay lại hook và giải theo quy trình: đọc câu, tìm clue, xác định speaker action, loại bẫy, chọn đáp án.

**On-screen:**

```text
行きたくない＿＿んだけど、
明日N2だから、今夜は遊びに行く＿＿。

A. わけでは / わけには
B. わけが / わけでは
C. わけだ / わけが

Step 1:
Blank 1 nhìn vào ＿＿んだけど
→ đang gỡ lại cách hiểu

Step 2:
Blank 1 chọn わけでは
→ B sai vì わけが nghe bác quá mạnh

Step 3:
Blank 2 nhìn vào 明日N2だから
→ có ràng buộc nên không đi được

Step 4:
Blank 2 chọn わけには
→ C sai vì わけだ chỉ là kết luận

Step 5:
Đáp án đúng: A

Rule chốt:
đính chính thì nghĩ わけではない
ràng buộc thì nghĩ わけにはいかない
```

**Build / reveal:**

```text
1. Show full question again.
2. Blank 1:
   ＿＿んだけど
   → đang đính chính lại cách hiểu
   → わけでは
3. Trap 1:
   わけが = mạnh quá, nghe như bác hẳn khả năng
4. Blank 2:
   明日N2だから / 今夜は遊びに行く＿＿
   → muốn cũng không đi được vì đang bị kỳ thi giữ lại
   → わけには
5. Trap 2:
   わけだ = chỉ cho thấy rút ra kết luận
   nhưng câu này còn có ý không đi được vì có ràng buộc
6. Reveal answer: A
```

**Script beat:**  
Giải đúng kiểu think-aloud. Không chỉ chốt A là đúng, mà phải dẫn cho người học thấy vì sao B và C nghe có vẻ ổn mà vẫn lệch mạch câu.

**Teaching check:**  
Đây là worked example bắt buộc. Phải có clue + speaker action + trap elimination.

---

## Slide 15 - Luyện chẩn đoán

**Source link:**  
Skeleton §10 Diagnostic Practice; Architecture beat 15 Diagnostic practice.

**Role:**  
Test transfer: người học có phân biệt được `わけではない` và `わけがない` không.

**On-screen before reveal:**

```text
あの人がみんなを嫌いな＿＿。

A. わけではない
B. わけがない
C. わけだ
```

**On-screen after reveal:**

```text
答え: B. わけがない

嫌いな + わけがない

Trap:
đính chính lại cách hiểu
vs phủ nhận rất mạnh: không thể nào lại như thế
```

**Build / reveal:**

```text
1. Show question and choices.
2. Pause for learner.
3. Reveal clue:
   "không thể nào cậu ấy ghét mọi người"
4. Reveal answer B.
5. Highlight form:
   嫌いな
6. Label trap:
   わけではない = phủ định nhận định / đính chính
   nhưng ở đây cần bác bỏ khả năng rất mạnh
```

**Script beat:**  
Nếu ý muốn nói là "không thể nào cậu ấy ghét mọi người", thì phải dùng kiểu bác rất mạnh là `わけがない`. `わけではない` ở đây chưa đủ lực.

**Teaching check:**  
Phải nói rõ `嫌い` là `な-adjective`, nên cần `嫌いな`.

---

## Slide 16 - Tổng kết nhanh

**Source link:**  
Skeleton §12 Production Slide Mapping / Recap; Architecture beat 16 Recap.

**Role:**  
Tóm tắt 4 mẫu thành bảng nhớ nhanh, screenshot-friendly.

**On-screen:**

```text
わけだ
= nghe thông tin rồi rút ra kết luận

わけではない
= không phải là theo nghĩa đó / không hẳn là như vậy

わけがない
= không thể nào lại như thế

わけにはいかない
= muốn cũng không làm được vì có ràng buộc

Bonus:
Vないわけにはいかない
= buộc phải làm
```

**Build / reveal:**

```text
1. Reveal 4 main rows.
2. Reveal bonus smaller.
3. Final reminder:
   Ở câu này, người nói đang muốn nói gì?
```

**Script beat:**  
Nhắc lại đúng 4 hướng ý nghĩa để người học chụp lại và nhớ. Không mở thêm kiến thức mới ở đây.

**Teaching check:**  
Bonus phải nhỏ hơn 4 mẫu chính để không làm loãng recap.

---

## Slide 17 - Worksheet & quiz

**Source link:**  
Skeleton §2 Worksheet Promise; Skeleton §14 Worksheet Contract; Architecture beat 17 CTA worksheet / diagnostic quiz.

**Role:**  
Dẫn sang worksheet + quiz như bước luyện chọn mẫu và chẩn đoán bẫy, không phải generic PDF summary.

**On-screen:**

```text
Nếu hiểu bài rồi
mà vào đề vẫn còn lưỡng lự:

Phần luyện tiếp theo sẽ giúp bạn:

- nhìn lại 4 mẫu qua Ý nghĩa - Dạng - Cách dùng
- luyện dấu hiệu để chọn trong câu thật
- làm bài kiểu JLPT
- xem mình hay nhầm ở đâu
```

**Build / reveal:**

```text
1. Reveal problem:
   hiểu rồi nhưng vào đề vẫn phân vân
2. Reveal practice steps.
3. Reveal quiz diagnostic angle:
   biết mình hay sập bẫy nào.
4. End screen / link cue.
```

**Script beat:**  
Nếu bạn thấy học xong thì hiểu, nhưng vào đề vẫn còn lưỡng lự, thì phần luyện thêm này là bước tiếp theo: nhìn lại 4 mẫu, luyện dấu hiệu trong câu thật, rồi dùng quiz để xem mình đang hay nhầm ở đâu.

**Teaching check:**  
CTA phải bán diagnosis + guided practice, không phải tài liệu tóm tắt chung chung.

---

## 2. Structure QA Checklist

- 17 slides match locked Wake architecture.
- Every slide has `Source link`, `Role`, `On-screen`, `Build / reveal`, `Script beat`, `Teaching check`.
- Skeleton sections are mapped to slide functions.
- Slide 03 promises both N2 exam transfer and real-life usage.
- Slide 14 is a worked example with trap elimination.
- Slide 15 is diagnostic practice with retrieval before reveal.
- Slide 17 points to worksheet + diagnostic quiz as trap practice.
- Design layer is intentionally pending.

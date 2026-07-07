"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { quizQuestions } from "@/lib/data";
import { track } from "@/lib/tracking";

// ── Màn hình 4 & 5: Quiz ẩn danh + màn kết quả (Sign-up Trigger) ──
// Toàn màn hình, không bottom nav — người học tập trung tuyệt đối.
export default function QuizPage() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [lineDone, setLineDone] = useState(false);
  const [m1Joined, setM1Joined] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    track("quiz_start");
  }, []);

  const q = quizQuestions[index];
  const total = quizQuestions.length;
  const progress = ((index + (checked ? 1 : 0)) / total) * 100;

  function check() {
    if (selected === null) return;
    setChecked(true);
    const correct = selected === q.answer;
    if (correct) setCorrectCount((c) => c + 1);
    setResults((r) => [...r, correct]);
  }

  function next() {
    if (index + 1 >= total) {
      track("quiz_complete", { score: correctCount, total });
      setFinished(true);
    } else {
      setIndex(index + 1);
      setSelected(null);
      setChecked(false);
    }
  }

  // ── Màn hình 5: kết quả + Gradual Engagement ──
  if (finished) {
    const seconds = Math.round((Date.now() - startTime) / 1000);
    return (
      <main className="flex flex-col gap-4 px-4 pt-10 pb-10 min-h-dvh">
        <div className="text-center pop-in">
          <span className="text-7xl">{correctCount >= 4 ? "🏆" : correctCount >= 2 ? "🎉" : "💪"}</span>
          <h1 className="text-[28px]! mt-3">
            {correctCount >= 4 ? "Xuất sắc!" : correctCount >= 2 ? "Làm tốt lắm!" : "Khởi đầu tốt!"}
          </h1>
          <p className="text-slate-500 mt-1">Bạn vừa hoàn thành 5 câu ngữ pháp N2</p>
        </div>

        {/* 📋 Phiếu điểm — kết quả CỦA TÔI, lý do rời SNS (growth plan mục 6) */}
        <div className="bento p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[16px]!">📋 Phiếu điểm N2</h3>
            <span className="text-[12px] text-slate-400">
              {new Date().toLocaleDateString("vi-VN")}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {quizQuestions.map((qq, i) => (
              <div key={i} className="flex items-center gap-2 text-[14px]">
                <span>{results[i] ? "✅" : "❌"}</span>
                <span className="flex-1 text-slate-600 truncate">
                  Câu {i + 1}: {qq.options[qq.answer]}
                </span>
              </div>
            ))}
          </div>
          {results.some((r) => !r) && (
            <p className="text-[13px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
              💡 Điểm yếu của bạn:{" "}
              <b>
                {quizQuestions
                  .filter((_, i) => !results[i])
                  .map((qq) => qq.options[qq.answer])
                  .join("、")}
              </b>{" "}
              — ôn lại nhóm ngữ pháp này trước.
            </p>
          )}
        </div>

        {/* M1 — waitlist THẤY GIÁ dưới phiếu điểm (đo WTP thật, growth plan mục 10) */}
        <div className="rounded-2xl bg-ink text-white p-5">
          {m1Joined ? (
            <div className="text-center py-2 pop-in">
              <span className="text-4xl">🙌</span>
              <p className="font-semibold mt-2">Đã giữ chỗ cho bạn!</p>
              <p className="text-[13px] text-slate-300 mt-1">
                Chưa thu tiền. Khi khóa mở (dự kiến T9), chúng tôi báo qua LINE —
                bạn quyết định lúc đó.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[12px] font-semibold text-emerald-400 uppercase tracking-wide">
                Sắp ra mắt · giới hạn 30 chỗ đầu
              </p>
              <p className="font-semibold text-[17px] mt-1">
                Khóa luyện N2 có chấm chữa từng câu — <b>¥4,900</b>
              </p>
              <p className="text-slate-300 text-[13px] mt-1">
                60 câu chuẩn format đề (100% tự biên soạn) + phiếu điểm chi tiết
                mỗi tuần + giải thích lỗi sai của riêng bạn.
              </p>
              <button
                onClick={() => {
                  track("m1_waitlist_join", { price: 4900, score: correctCount });
                  setM1Joined(true);
                }}
                className="tap w-full rounded-xl bg-accent text-white font-semibold mt-4 active:scale-[0.98] transition-transform"
              >
                Giữ Chỗ Waitlist — ¥4,900 (chưa thu tiền)
              </button>
            </>
          )}
        </div>

        {/* Thẻ Bento thống kê kết quả */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bento p-4 text-center">
            <p className="text-[24px] font-bold text-accent">{correctCount}/{total}</p>
            <p className="text-[12px] text-slate-500">Câu đúng</p>
          </div>
          <div className="bento p-4 text-center">
            <p className="text-[24px] font-bold text-primary">{seconds}s</p>
            <p className="text-[12px] text-slate-500">Thời gian</p>
          </div>
          <div className="bento p-4 text-center">
            <p className="text-[24px] font-bold text-amber-500">🔥 1</p>
            <p className="text-[12px] text-slate-500">Ngày streak</p>
          </div>
        </div>

        {/* Gradual Engagement — mời đăng nhập LINE để lưu tiến trình */}
        {lineDone ? (
          <div className="bento p-5 text-center pop-in">
            <span className="text-4xl">✅</span>
            <p className="font-semibold mt-2">Đã lưu tiến trình qua LINE!</p>
            <p className="text-[13px] text-slate-500 mt-1">
              Ngày mai quay lại để giữ chuỗi streak nhé.
            </p>
          </div>
        ) : (
          <div className="bento p-5">
            <p className="font-semibold text-[16px] text-center">
              Lưu tiến trình để ngày mai học tiếp?
            </p>
            <p className="text-[13px] text-slate-500 text-center mt-1 mb-4">
              Một chạm qua LINE — không cần mật khẩu, không cần điền form.
            </p>
            <button
              onClick={() => {
                track("quiz_save_line_click");
                setLineDone(true);
              }}
              className="tap w-full rounded-2xl bg-line text-white font-semibold active:scale-[0.98] transition-transform"
            >
              Xác Thực Một Chạm Bằng LINE
            </button>
          </div>
        )}

        {/* Viral loop — chia sẻ thành tích (Dynamic Stories OG: backend sinh ảnh sau) */}
        <button
          onClick={() => track("result_share_click", { score: correctCount })}
          className="tap w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold active:scale-[0.98] transition-transform"
        >
          Chia Sẻ Thành Tích Lên Stories 📸
        </button>

        <Link href="/" className="text-center text-[14px] text-slate-400 py-3">
          Về trang chủ
        </Link>
      </main>
    );
  }

  // ── Màn hình 4: làm quiz ──
  return (
    <main className="flex flex-col px-4 pt-4 pb-8 min-h-dvh">
      {/* Nút thoát + thanh tiến độ */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="tap w-12 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500"
        >
          ✕
        </Link>
        <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[13px] font-semibold text-slate-500">
          {index + 1}/{total}
        </span>
      </div>

      {/* Câu hỏi + furigana */}
      <div className="bento p-5 mb-4">
        <p className="text-[12px] font-semibold text-primary uppercase tracking-wide mb-2">
          Ngữ pháp N2
        </p>
        <p className="text-[20px] font-semibold leading-relaxed">{q.question}</p>
        {q.furigana && (
          <p className="text-[13px] text-slate-400 mt-2">{q.furigana}</p>
        )}
      </div>

      {/* Phương án — thẻ bo tròn 12px, vùng chạm >48px */}
      <div className="flex flex-col gap-2.5">
        {q.options.map((opt, i) => {
          let style = "bg-white border-slate-200";
          if (checked) {
            if (i === q.answer) style = "bg-emerald-50 border-accent";
            else if (i === selected) style = "bg-rose-50 border-alert";
          } else if (i === selected) {
            style = "bg-indigo-50 border-primary";
          }
          return (
            <button
              key={i}
              disabled={checked}
              onClick={() => setSelected(i)}
              className={`tap w-full rounded-xl border-2 px-4 py-3 text-left text-[16px] font-medium transition-colors ${style}`}
            >
              {opt}
              {checked && i === q.answer && " ✓"}
              {checked && i === selected && i !== q.answer && " ✗"}
            </button>
          );
        })}
      </div>

      {/* Giải thích hiện ngay sau khi chọn đáp án */}
      {checked && (
        <div className="pop-in bento p-4 mt-4 border-l-4 border-l-accent">
          <p className="text-[13px] font-semibold text-accent mb-1">
            {selected === q.answer ? "Chính xác! 🎯" : "Chưa đúng — cùng xem giải thích:"}
          </p>
          <p className="text-[14px] text-slate-600">{q.explanation}</p>
        </div>
      )}

      {/* CTA vùng ngón cái */}
      <div className="mt-auto pt-6">
        {checked ? (
          <button
            onClick={next}
            className="tap w-full rounded-2xl bg-primary text-white font-semibold text-[16px] active:scale-[0.98] transition-transform"
          >
            {index + 1 >= total ? "Xem Kết Quả 🏁" : "Câu Tiếp Theo →"}
          </button>
        ) : (
          <button
            onClick={check}
            disabled={selected === null}
            className={`tap w-full rounded-2xl font-semibold text-[16px] transition-all active:scale-[0.98] ${
              selected === null
                ? "bg-slate-200 text-slate-400"
                : "bg-accent text-white shadow-lg shadow-emerald-200"
            }`}
          >
            Kiểm Tra Đáp Án
          </button>
        )}
      </div>
    </main>
  );
}

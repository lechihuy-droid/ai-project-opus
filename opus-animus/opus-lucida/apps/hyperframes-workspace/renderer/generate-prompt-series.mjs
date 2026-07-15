import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = path.resolve("scene-schema/examples/prompt-engineering-series");
const W = 1080;
const H = 1920;
const FPS = 30;
const SCENE_DURATION = 4;

const colors = {
  bg: "#080b10",
  panel: "#111720",
  panelSoft: "#151d28",
  ink: "#f4f7f8",
  muted: "#aab7c4",
  cyan: "#32d6c5",
  blue: "#6d8cff",
  coral: "#ff6b5f",
  amber: "#f7c95c",
  green: "#54dc8b",
};

const episodes = [
  {
    id: "01-v1-context-failure",
    label: "V1 · CONTEXT",
    title: "AI biến tai nạn ô tô thành... trượt tuyết",
    subtitle: "Một prompt quá ngắn có thể khiến mô hình tự nối dữ liệu sai.",
    accent: colors.coral,
    prompt: "Hãy xem form tai nạn này và xác định ai có lỗi.",
    wrong: "Sự cố trượt tuyết tại phố Chappangan",
    diagnosis: ["Không có vai trò", "Không có ngữ cảnh nghiệp vụ", "Dữ liệu ảnh chứa nhiễu"],
    takeaway: "Prompt engineering là khoa học thực nghiệm: thử, quan sát lỗi, rồi lặp lại.",
    cta: "Tập 2: Chặn hallucination bằng role và confidence boundary.",
  },
  {
    id: "02-v2-confidence-boundary",
    label: "V2 · CONFIDENCE",
    title: "Muốn AI bớt nói càn? Hãy đặt ranh giới tự tin",
    subtitle: "Đừng chỉ yêu cầu trả lời đúng. Hãy quy định khi nào được phép kết luận.",
    accent: colors.amber,
    prompt: "Bạn là trợ lý thẩm định bảo hiểm. Không phán quyết nếu dữ liệu chưa đủ chắc chắn.",
    wrong: "Tôi chưa có đủ thông tin để kết luận bên nào có lỗi.",
    diagnosis: ["Role: đúng nghiệp vụ", "Task: đọc checkbox", "Boundary: được quyền từ chối"],
    takeaway: "Role + nhiệm vụ + ranh giới tự tin = ít hallucination hơn.",
    cta: "Tập 3: Tách context tĩnh để giảm chi phí và latency.",
  },
  {
    id: "03-v3-system-prompt-caching",
    label: "V3 · CACHING",
    title: "Dữ liệu không đổi? Đừng bắt AI đọc lại mỗi lần",
    subtitle: "Tách cấu trúc form cố định khỏi dữ liệu của từng hồ sơ.",
    accent: colors.cyan,
    prompt: "SYSTEM: định nghĩa 17 dòng + quy tắc đọc dấu viết tay\nUSER: ảnh hồ sơ mới",
    wrong: "CACHE HIT · Context tĩnh được tái sử dụng",
    diagnosis: ["System prompt: cấu trúc cố định", "Runtime input: dữ liệu thay đổi", "Prompt cache: giảm token và độ trễ"],
    takeaway: "Static context + dynamic input là cấu trúc tốt cho xử lý hàng loạt.",
    cta: "Tập 4: Ép AI phân tích theo đúng thứ tự của chuyên gia.",
  },
  {
    id: "04-v4-order-of-analysis",
    label: "V4 · ANALYSIS ORDER",
    title: "AI có đủ dữ liệu vẫn sai nếu nhìn sai thứ tự",
    subtitle: "Hãy biến quy trình của chuyên gia thành trình tự bắt buộc.",
    accent: colors.blue,
    prompt: "1. Đọc form → 2. Lấy ô được đánh dấu → 3. Đối chiếu sơ đồ → 4. Kết luận",
    wrong: "FORM  →  CHECKBOX  →  DIAGRAM  →  VERDICT",
    diagnosis: ["Form tạo dữ liệu nền", "Hình vẽ chỉ để đối chiếu", "Kết luận sau khi kiểm tra chéo"],
    takeaway: "Thứ tự phân tích tốt làm logic chặt hơn, nhưng có thể khiến output quá dài.",
    cta: "Tập 5: Đóng gói output để backend sử dụng được.",
  },
  {
    id: "05-v5-structured-output",
    label: "V5 · OUTPUT",
    title: "Câu trả lời đúng vẫn chưa đủ cho production",
    subtitle: "Output phải ngắn, ổn định và có thể được máy bóc tách.",
    accent: colors.green,
    prompt: "Tóm tắt ngắn. Chỉ trả kết luận trong thẻ <final_verdict>.",
    wrong: "<final_verdict>Vehicle B</final_verdict>",
    diagnosis: ["Bỏ lời dẫn thừa", "Cấu trúc ổn định", "Backend → parser → SQL"],
    takeaway: "Prompt chỉ trở thành sản phẩm khi output có contract rõ ràng.",
    cta: "Tập 6: Vision few-shot, prefill và extended thinking.",
  },
  {
    id: "06-advanced-techniques",
    label: "ADVANCED · 3 KỸ THUẬT",
    title: "Ba kỹ thuật prompt nâng cao đáng thử",
    subtitle: "Dùng khi zero-shot và instruction thông thường chưa đủ ổn định.",
    accent: colors.cyan,
    prompt: "VISION FEW-SHOT\nĐưa ca mẫu gồm hình ảnh + đáp án vào examples.",
    wrong: "PREFILL\nMở sẵn cấu trúc phản hồi để giảm lời dẫn.",
    diagnosis: ["Few-shot: dạy bằng ví dụ", "Prefill: neo định dạng đầu ra", "Extended thinking: dành cho bài toán khó"],
    takeaway: "Audit bằng bằng chứng và dữ liệu trung gian; không phụ thuộc vào nhật ký tư duy ẩn.",
    cta: "Tập 7: Ghép V1–V5 thành workflow production hoàn chỉnh.",
  },
  {
    id: "07-production-framework",
    label: "FRAMEWORK · V1 → V5",
    title: "Từ prompt lỗi đến workflow chạy production",
    subtitle: "Mỗi failure là dữ liệu để thiết kế phiên bản prompt tiếp theo.",
    accent: colors.coral,
    prompt: "V1 Context → V2 Confidence → V3 Caching → V4 Order → V5 Output",
    wrong: "TEST  →  EVALUATE  →  MONITOR  →  ITERATE",
    diagnosis: ["Context và ranh giới", "Trình tự và output contract", "Bộ test + giám sát production"],
    takeaway: "Prompt production-ready là một hệ thống, không phải một câu lệnh thần kỳ.",
    cta: "Lưu framework này cho workflow AI tiếp theo của bạn.",
  },
];

await mkdir(OUTPUT_DIR, { recursive: true });
for (const [index, episode] of episodes.entries()) {
  const manifest = buildEpisode(episode, index + 1, episodes.length);
  const file = path.join(OUTPUT_DIR, `${episode.id}.json`);
  await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`[prompt-series] wrote ${file}`);
}

function buildEpisode(episode, episodeNumber, totalEpisodes) {
  const sceneBuilders = [buildHook, buildPrompt, buildSignal, buildBreakdown, buildTakeaway];
  const scenes = sceneBuilders.map((builder, index) =>
    builder(episode, index, episodeNumber, totalEpisodes),
  );
  return {
    metadata: {
      id: `prompt-series-${episode.id}`,
      title: `Prompt Engineering V1–V5 · ${episode.label}`,
      description: "Video dọc 9:16 thuộc series prompt engineering thực nghiệm.",
      author: "Opus AI Video Engine",
      version: "1.0.0",
      width: W,
      height: H,
      fps: FPS,
      background: colors.bg,
    },
    duration: sceneBuilders.length * SCENE_DURATION,
    assets: [],
    scenes,
    transitions: scenes.slice(0, -1).map((scene, index) => ({
      from: scene.id,
      to: scenes[index + 1].id,
      type: "cut",
      duration: 0,
    })),
  };
}

function buildHook(ep, index, episodeNumber, totalEpisodes) {
  const id = `${ep.id}-hook`;
  return makeScene(id, index, [
    ...chrome(id, ep, episodeNumber, totalEpisodes, index),
    shape(id, "accent-line", 84, 312, 132, 12, ep.accent, 6, enter("draw-x", 0.12, 0.55)),
    text(id, "title", ep.title, 84, 382, 900, 430, 88, 860, colors.ink, enter("wipe-up", 0.24, 0.72), 0.98),
    text(id, "subtitle", ep.subtitle, 88, 890, 850, 180, 40, 580, colors.muted, enter("fade-up", 0.88, 0.62), 1.18),
    shape(id, "orb-a", 820, 1260, 190, 190, `${ep.accent}22`, 95, enter("scale-in", 1.15, 0.55), emphasis("float", 1.7, 1.8, "infinite")),
    shape(id, "orb-b", 690, 1398, 90, 90, `${colors.blue}33`, 45, enter("scale-in", 1.35, 0.45), emphasis("float", 1.9, 1.4, "infinite")),
    text(id, "swipe", "PROMPT LAB / CASE STUDY", 84, 1560, 700, 44, 28, 780, ep.accent, enter("fade", 1.5, 0.5)),
  ]);
}

function buildPrompt(ep, index, episodeNumber, totalEpisodes) {
  const id = `${ep.id}-prompt`;
  return makeScene(id, index, [
    ...chrome(id, ep, episodeNumber, totalEpisodes, index),
    text(id, "eyebrow", "PROMPT / INPUT", 84, 260, 620, 42, 26, 820, ep.accent, enter("fade-down", 0.08, 0.42)),
    terminal(id, "prompt-box", 84, 350, 912, 640, ep.prompt, enter("scale-in", 0.22, 0.62)),
    shape(id, "cursor", 122, 910, 18, 44, ep.accent, 2, enter("fade", 0.9, 0.25), emphasis("pulse", 1.2, 0.7, "infinite")),
    text(id, "question", episodeNumber === 1 ? "Điều gì có thể sai?" : "Thay đổi nhỏ. Hành vi khác hẳn.", 84, 1128, 900, 120, 58, 820, colors.ink, enter("fade-up", 1.05, 0.62), 1.04),
    text(id, "hint", "Quan sát output trước khi thêm instruction tiếp theo.", 88, 1320, 830, 100, 34, 560, colors.muted, enter("fade-up", 1.45, 0.55), 1.16),
  ]);
}

function buildSignal(ep, index, episodeNumber, totalEpisodes) {
  const id = `${ep.id}-signal`;
  const isFailure = episodeNumber === 1;
  const signalColor = isFailure ? colors.coral : ep.accent;
  return makeScene(id, index, [
    ...chrome(id, ep, episodeNumber, totalEpisodes, index),
    text(id, "eyebrow", isFailure ? "OUTPUT SAI" : "TÍN HIỆU CHÍNH", 84, 258, 620, 44, 28, 840, signalColor, enter("fade-down", 0.08, 0.42)),
    shape(id, "signal-panel", 84, 372, 912, 600, colors.panelSoft, 24, enter("slide-right", 0.24, 0.62), emphasis("glow", 1.1, 1.5, 2)),
    text(id, "signal", ep.wrong, 132, 482, 810, 330, episodeNumber === 5 ? 46 : 58, 820, colors.ink, enter("wipe-up", 0.55, 0.65), 1.1),
    shape(id, "scan-line", 112, 900, 856, 4, signalColor, 2, enter("draw-x", 0.82, 0.6), emphasis("scan", 1.4, 1.0, "infinite")),
    text(id, "status", isFailure ? "FAILURE ≠ DEAD END" : "OBSERVE → COMPARE → UPDATE", 84, 1140, 900, 64, 34, 820, signalColor, enter("fade-up", 1.05, 0.5)),
    text(id, "status-copy", isFailure ? "Lỗi này cho biết prompt đang thiếu ngữ cảnh nào." : "Đo sự thay đổi hành vi sau mỗi phiên bản.", 88, 1250, 850, 150, 48, 720, colors.ink, enter("fade-up", 1.32, 0.6), 1.08),
  ]);
}

function buildBreakdown(ep, index, episodeNumber, totalEpisodes) {
  const id = `${ep.id}-breakdown`;
  const layers = [
    ...chrome(id, ep, episodeNumber, totalEpisodes, index),
    text(id, "title", "Ba điểm cần nhớ", 84, 250, 900, 100, 66, 850, colors.ink, enter("fade-up", 0.08, 0.55)),
  ];
  ep.diagnosis.forEach((item, itemIndex) => {
    const y = 430 + itemIndex * 300;
    const delay = 0.35 + itemIndex * 0.28;
    layers.push(shape(id, `rail-${itemIndex}`, 84, y, 12, 220, itemIndex === 0 ? ep.accent : itemIndex === 1 ? colors.blue : colors.amber, 6, enter("wipe-up", delay, 0.5)));
    layers.push(text(id, `number-${itemIndex}`, `0${itemIndex + 1}`, 132, y + 4, 120, 54, 26, 850, colors.muted, enter("fade", delay + 0.08, 0.42)));
    layers.push(text(id, `item-${itemIndex}`, item, 132, y + 62, 790, 130, 50, 790, colors.ink, enter("fade-up", delay + 0.12, 0.55), 1.08));
  });
  return makeScene(id, index, layers);
}

function buildTakeaway(ep, index, episodeNumber, totalEpisodes) {
  const id = `${ep.id}-takeaway`;
  return makeScene(id, index, [
    ...chrome(id, ep, episodeNumber, totalEpisodes, index),
    text(id, "eyebrow", "KẾT LUẬN", 84, 260, 620, 44, 28, 840, ep.accent, enter("fade-down", 0.08, 0.42)),
    text(id, "takeaway", ep.takeaway, 84, 400, 900, 500, 76, 850, colors.ink, enter("wipe-up", 0.24, 0.76), 1.02),
    shape(id, "divider", 84, 1030, 912, 4, `${ep.accent}aa`, 2, enter("draw-x", 0.95, 0.65)),
    text(id, "cta-label", episodeNumber === totalEpisodes ? "LƯU LẠI" : "VIDEO TIẾP THEO", 84, 1140, 700, 40, 26, 820, colors.muted, enter("fade", 1.18, 0.45)),
    text(id, "cta", ep.cta, 84, 1225, 880, 250, 46, 760, ep.accent, enter("fade-up", 1.34, 0.62), 1.12),
    shape(id, "pulse-dot", 84, 1580, 22, 22, ep.accent, 11, enter("scale-in", 1.7, 0.38), emphasis("pulse", 2.0, 0.9, "infinite")),
    text(id, "brand", "OPUS · PROMPT ENGINEERING LAB", 130, 1576, 620, 36, 24, 760, colors.muted, enter("fade", 1.78, 0.45)),
  ]);
}

function makeScene(id, index, layers) {
  return {
    id,
    title: id,
    start: index * SCENE_DURATION,
    duration: SCENE_DURATION,
    composition: { type: "html", html: "" },
    layers,
    animation: [],
  };
}

function chrome(id, ep, episodeNumber, totalEpisodes, sceneIndex) {
  const progress = Math.round(((sceneIndex + 1) / 5) * 912);
  return [
    shape(id, "top-rule", 0, 0, W, 10, ep.accent, 0, enter("draw-x", 0, 0.45)),
    text(id, "episode", `TẬP ${String(episodeNumber).padStart(2, "0")} / ${String(totalEpisodes).padStart(2, "0")}`, 84, 78, 240, 36, 24, 820, ep.accent, enter("fade-down", 0.02, 0.4)),
    text(id, "label", ep.label, 350, 78, 640, 36, 24, 760, colors.muted, enter("fade-down", 0.08, 0.4), 1, "right"),
    shape(id, "grid-v1", 84, 178, 912, 1, "rgba(255,255,255,0.08)", 0, enter("draw-x", 0.08, 0.45)),
    shape(id, "progress-base", 84, 1742, 912, 8, "rgba(255,255,255,0.10)", 4, enter("fade", 0.05, 0.35)),
    shape(id, "progress-fill", 84, 1742, progress, 8, ep.accent, 4, enter("draw-x", 0.18, 0.65)),
    text(id, "footer", "PROMPT ENGINEERING · THỰC NGHIỆM V1 → V5", 84, 1790, 912, 28, 20, 720, colors.muted, enter("fade", 0.32, 0.4), 1, "center"),
  ];
}

function text(prefix, name, value, x, y, width, height, fontSize, fontWeight, color, motion, lineHeight = 1.08, align) {
  return {
    id: `${prefix}-${name}`,
    kind: "text",
    text: value,
    x, y, width, height, fontSize, fontWeight, color, lineHeight,
    ...(align ? { align } : {}),
    ...(motion?.enter ? { enter: motion.enter } : motion ? { enter: motion } : {}),
    ...(motion?.emphasis ? { emphasis: motion.emphasis } : {}),
  };
}

function shape(prefix, name, x, y, width, height, fill, radius, motion, emphasisMotion) {
  return {
    id: `${prefix}-${name}`,
    kind: "shape",
    x, y, width, height, fill, radius,
    ...(motion ? { enter: motion } : {}),
    ...(emphasisMotion ? { emphasis: emphasisMotion } : {}),
  };
}

function terminal(prefix, name, x, y, width, height, value, motion) {
  return {
    id: `${prefix}-${name}`,
    kind: "terminal",
    x, y, width, height,
    fontSize: 35,
    lines: ["$ prompt.run", "", ...value.split("\n"), "", "▌"],
    enter: motion,
  };
}

function enter(preset, delay, duration) {
  return { preset, delay, duration };
}

function emphasis(preset, delay, duration, iterations = 1) {
  return { preset, delay, duration, iterations };
}

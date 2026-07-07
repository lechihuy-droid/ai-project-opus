// ============================================================
// Đo lường theo growth-plan-final.md mục 1 & 8:
// - Mọi link mang pipeline_id (?pid=...) — first-touch, lưu localStorage
// - Event taxonomy object_action + property {pipeline_id, src}
// Giai đoạn 1: log vào localStorage + console để kiểm tra funnel.
// TODO(backend): gửi event sang Plausible (qua proxy) / API riêng.
// ============================================================

const PID_KEY = "vjhub_pid";
const EVENTS_KEY = "vjhub_events";

export type FirstTouch = { pid: string; src: string; ts: string };

// Gọi 1 lần khi app mở — bắt ?pid= và ?utm_source= từ link SNS.
// First-touch: đã có pid thì KHÔNG ghi đè (đo đúng nguồn đầu tiên).
export function captureFirstTouch() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(PID_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("pid");
    const src = params.get("utm_source") || params.get("src") || "direct";
    if (pid) {
      const ft: FirstTouch = { pid, src, ts: new Date().toISOString() };
      localStorage.setItem(PID_KEY, JSON.stringify(ft));
    }
  } catch {
    // localStorage bị chặn (private mode) — bỏ qua, không chặn UX
  }
}

export function getFirstTouch(): FirstTouch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PID_KEY);
    return raw ? (JSON.parse(raw) as FirstTouch) : null;
  } catch {
    return null;
  }
}

// track("quiz_start"), track("event_deposit_click", { event: slug }) ...
// Tên event theo chuẩn object_action.
export function track(event: string, props: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  const ft = getFirstTouch();
  const payload = {
    event,
    pipeline_id: ft?.pid ?? "organic",
    src: ft?.src ?? "direct",
    ts: new Date().toISOString(),
    ...props,
  };
  try {
    const list = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
    list.push(payload);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(list.slice(-500)));
  } catch {
    // bỏ qua
  }
  console.log("[vjhub-track]", payload);
}

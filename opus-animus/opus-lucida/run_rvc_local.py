"""
run_rvc_local.py — RVC voice conversion chạy local (CPU).
Convert toàn bộ slide-*.mp3 trong audio/ → rvc-slide-*.wav trong audio-rvc/.

Usage:
  python run_rvc_local.py [audio_dir] [out_dir]

Defaults:
  audio_dir = production/00-active/wake-cluster/audio
  out_dir   = production/00-active/wake-cluster/audio-rvc
"""

import sys
import time
from pathlib import Path

from rvc_python.infer import RVCInference

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).parent
MODEL_PTH = ROOT / "models/rvc/my-project-lucida_200e_6400s.pth"
INDEX     = ROOT / "models/rvc/my-project-lucida.index"

AUDIO_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "production/00-active/wake-cluster/audio"
OUT_DIR   = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "production/00-active/wake-cluster/audio-rvc"

# ── RVC params ────────────────────────────────────────────────────────────────
F0_UP_KEY     = 0        # KHÔNG shift pitch — giữ nguyên pitch accent JP
F0_METHOD     = "rmvpe"
INDEX_RATE    = 0      # faiss-cpu Windows bug with IndexIVF — disable index locally
FILTER_RADIUS = 3
RESAMPLE_SR   = 0
RMS_MIX_RATE  = 0.25
PROTECT       = 0.33

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    slides = sorted(AUDIO_DIR.glob("slide-*.mp3"))
    if not slides:
        print(f"[rvc] Không tìm thấy slide-*.mp3 trong {AUDIO_DIR}")
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[rvc] Load model: {MODEL_PTH.name}")
    rvc = RVCInference(device="cpu")
    rvc.load_model(str(MODEL_PTH), index_path=str(INDEX))
    rvc.set_params(
        f0up_key=F0_UP_KEY,
        f0method=F0_METHOD,
        index_rate=INDEX_RATE,
        filter_radius=FILTER_RADIUS,
        resample_sr=RESAMPLE_SR,
        rms_mix_rate=RMS_MIX_RATE,
        protect=PROTECT,
    )
    print(f"[rvc] {len(slides)} slides -> {OUT_DIR}\n")

    total_start = time.time()
    for i, src in enumerate(slides, 1):
        dst = OUT_DIR / f"rvc-{src.stem}.wav"
        print(f"  [{i:02d}/{len(slides)}] {src.name} ...", end=" ", flush=True)
        t0 = time.time()
        rvc.infer_file(str(src), str(dst))
        elapsed = time.time() - t0
        size_kb = dst.stat().st_size // 1024
        eta = elapsed * (len(slides) - i)
        print(f"{elapsed:.0f}s | {size_kb}KB | ETA ~{eta/60:.0f}min")

    total = time.time() - total_start
    print(f"\n[rvc] Xong — {len(slides)} files trong {total/60:.1f} phút")
    print(f"[rvc] Output: {OUT_DIR}")


if __name__ == "__main__":
    main()

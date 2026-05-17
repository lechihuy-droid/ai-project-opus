"""
rvc_agent.py — Remote RVC voice conversion via FastAPI endpoint.

Takes per-slide MP3s from tts_agent, passes each through a remote RVC
model to unify voice timbre, outputs WAV files for assembly_agent.

CRITICAL: f0_up_key=0 — pitch is NEVER shifted. JP pitch accent preserved.

Remote endpoint: HuggingFace Space URL in .env:
  GRADIO_API_URL=https://chihuy-lucida.hf.space

Usage:
  python rvc_agent.py <audio_dir> <out_dir> [--dry-run]
"""

import argparse
import os
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

# ── Config ────────────────────────────────────────────────────────────────────

RVC_URL         = os.getenv("GRADIO_API_URL", "").strip().rstrip("/")
MAX_RETRIES     = 3
RETRY_DELAY_SEC = 5
TIMEOUT_SEC     = 300  # CPU inference can be slow


# ── Core ─────────────────────────────────────────────────────────────────────

def _infer(audio_path: Path, out_path: Path) -> None:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with open(audio_path, "rb") as f:
                r = httpx.post(
                    f"{RVC_URL}/infer",
                    files={"audio": (audio_path.name, f, "audio/mpeg")},
                    timeout=TIMEOUT_SEC,
                )
            r.raise_for_status()
            out_path.write_bytes(r.content)
            return
        except Exception as e:
            if attempt == MAX_RETRIES:
                raise RuntimeError(
                    f"RVC failed after {MAX_RETRIES} attempts for {audio_path.name}: {e}"
                ) from e
            print(f"  [rvc] retry {attempt}/{MAX_RETRIES} — {e}")
            time.sleep(RETRY_DELAY_SEC)


def convert_dir(audio_dir: Path, out_dir: Path, dry_run: bool = False) -> list[Path]:
    if not RVC_URL:
        raise ValueError("GRADIO_API_URL is not set in .env")

    out_dir.mkdir(parents=True, exist_ok=True)
    inputs = sorted(audio_dir.glob("slide-*.mp3"))

    if not inputs:
        raise FileNotFoundError(f"No slide-*.mp3 found in {audio_dir}")

    if dry_run:
        print(f"[rvc] DRY RUN — {len(inputs)} files via {RVC_URL}")
        for f in inputs:
            print(f"  {f.name}")
        return []

    print(f"[rvc] {len(inputs)} files -> {RVC_URL}")
    outputs: list[Path] = []
    for src in inputs:
        dst = out_dir / f"rvc-{src.stem}.wav"
        print(f"  {src.name} -> {dst.name} ...", end=" ", flush=True)
        t0 = time.time()
        _infer(src, dst)
        print(f"{time.time()-t0:.0f}s | {dst.stat().st_size//1024}KB")
        outputs.append(dst)

    return outputs


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("audio_dir")
    ap.add_argument("out_dir")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    paths = convert_dir(Path(args.audio_dir), Path(args.out_dir), args.dry_run)
    if paths:
        print(f"[rvc] done — {len(paths)} files")


if __name__ == "__main__":
    main()

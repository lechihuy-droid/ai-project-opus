"""
assembly_agent.py - Assemble PNG frames + MP3/WAV audio into a final MP4.

Usage:
    python assembly_agent.py <frames_dir> <audio_dir> <output_mp4> [--fps 30] [--tmp-dir D:\\lucida-temp]

The sync contract is the numeric slide prefix:
    slide-01.png            -> slide-01.mp3
    slide-01-wake-01.png    -> slide-01.mp3
    slide-01-wake-01.png    -> rvc-slide-01.wav
"""

import argparse
import re
import shutil
import subprocess
from pathlib import Path

import imageio_ffmpeg

_FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def _run(cmd: list[str], label: str = "") -> None:
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        msg = result.stderr.decode(errors="replace")[-1200:]
        raise RuntimeError(f"ffmpeg failed{' (' + label + ')' if label else ''}:\n{msg}")


def _slide_number(stem: str) -> str:
    match = re.match(r"^slide-(\d{2})(?:-|$)", stem)
    if not match:
        raise ValueError(f"Frame name must start with slide-NN: {stem}")
    return match.group(1)


def _find_audio(audio_dir: Path, frame_stem: str) -> Path:
    nn = _slide_number(frame_stem)
    candidates = [
        audio_dir / f"{frame_stem}.mp3",
        audio_dir / f"{frame_stem}.wav",
        audio_dir / f"slide-{nn}.mp3",
        audio_dir / f"slide-{nn}.wav",
        audio_dir / f"rvc-slide-{nn}.wav",
        audio_dir / f"rvc-slide-{nn}.mp3",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    tried = ", ".join(candidate.name for candidate in candidates)
    raise FileNotFoundError(f"Audio missing for {frame_stem}. Tried: {tried}")


def _segment_duration(seg: Path) -> str:
    result = subprocess.run([_FFMPEG, "-i", str(seg)], capture_output=True, text=True, errors="replace")
    for line in result.stderr.splitlines():
        if "Duration" in line:
            return line.strip().split(",")[0].replace("Duration:", "").strip()
    return ""


def assemble(frames_dir: Path, audio_dir: Path, output: Path, fps: int = 30, tmp_dir: Path | None = None) -> None:
    frames = sorted(frames_dir.glob("slide-*.png"), key=lambda p: int(_slide_number(p.stem)))
    if not frames:
        raise FileNotFoundError(f"No slide-*.png in {frames_dir}")

    output.parent.mkdir(parents=True, exist_ok=True)
    temp_parent = tmp_dir or output.parent
    temp_parent.mkdir(parents=True, exist_ok=True)

    tmp = temp_parent / "lucida_assembly_work"
    if tmp.exists():
        shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir(parents=True, exist_ok=True)

    try:
        segments: list[Path] = []
        for frame in frames:
            stem = frame.stem
            audio = _find_audio(audio_dir, stem)
            seg = tmp / f"{stem}.mp4"
            _run([
                _FFMPEG, "-y",
                "-loop", "1", "-framerate", str(fps), "-i", str(frame),
                "-i", str(audio),
                "-c:v", "libx264", "-preset", "fast", "-tune", "stillimage",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-shortest",
                str(seg),
            ], stem)
            segments.append(seg)
            print(f"  {stem}  {_segment_duration(seg)}")

        concat_list = tmp / "concat.txt"
        concat_list.write_text("\n".join(f"file '{seg.as_posix()}'" for seg in segments), encoding="utf-8")

        print(f"[assembly] concat {len(segments)} segments -> {output.name}")
        _run([
            _FFMPEG, "-y",
            "-f", "concat", "-safe", "0", "-i", str(concat_list),
            "-c", "copy",
            "-movflags", "+faststart",
            str(output),
        ], "concat")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print(f"[assembly] done - {output}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("frames_dir")
    parser.add_argument("audio_dir")
    parser.add_argument("output_mp4")
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--tmp-dir", type=Path, default=None)
    args = parser.parse_args()

    assemble(
        Path(args.frames_dir),
        Path(args.audio_dir),
        Path(args.output_mp4),
        fps=args.fps,
        tmp_dir=args.tmp_dir,
    )


if __name__ == "__main__":
    main()

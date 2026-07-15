"""Word-level transcription via faster-whisper (bypasses broken whisperx VAD/align in this venv).

Output JSON shape matches what voice-align.mjs expects from WhisperX:
{"segments": [{"start", "end", "text", "words": [{"word", "start", "end"}]}]}
"""

import argparse
import json

from faster_whisper import WhisperModel


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio")
    parser.add_argument("--language", default="vi")
    parser.add_argument("--model", default="small")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, _info = model.transcribe(args.audio, language=args.language, word_timestamps=True)

    out = {"language": args.language, "segments": []}
    for segment in segments:
        out["segments"].append(
            {
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
                "words": [
                    {"word": word.word, "start": word.start, "end": word.end}
                    for word in (segment.words or [])
                ],
            }
        )

    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(out, handle, ensure_ascii=False, indent=2)
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()

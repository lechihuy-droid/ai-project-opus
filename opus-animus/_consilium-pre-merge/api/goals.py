import re
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .data import parse_goals

router = APIRouter()

GOALS_PATH = Path(__file__).parent.parent.parent / "GOALS.md"

TRACK_HEADERS = {
    "1": "Track 1",
    "2": "Track 2",
    "3": "Track 3",
    "4": "Track 4",
}


class GoalsUpdate(BaseModel):
    track: str   # "1", "2", "3"
    field: str   # exact row label (col 0 of markdown table)
    value: str   # new current value


@router.get("/goals")
def get_goals():
    return parse_goals()


@router.post("/goals")
def update_goals(body: GoalsUpdate):
    if not GOALS_PATH.exists():
        raise HTTPException(404, "GOALS.md not found")

    content = GOALS_PATH.read_text(encoding="utf-8")
    header = TRACK_HEADERS.get(body.track)
    if not header:
        raise HTTPException(400, f"Unknown track: {body.track}")

    field_escaped = re.escape(body.field)
    # Match the table row: | field | current_value | ... |
    # Replace only the second column (current value)
    pattern = re.compile(
        rf"(\|\s*`?{field_escaped}`?\s*\|)\s*[^|\n]*(\|)",
        re.IGNORECASE
    )

    # Only replace within the correct Track section
    lines = content.splitlines(keepends=True)
    in_track = False
    out = []
    replaced = False
    for line in lines:
        if header in line:
            in_track = True
        elif in_track and line.startswith("## ") and header not in line:
            in_track = False

        if in_track and not replaced:
            new_line, n = pattern.subn(rf"\1 {body.value} \2", line, count=1)
            if n:
                line = new_line
                replaced = True
        out.append(line)

    if not replaced:
        raise HTTPException(404, f"Field '{body.field}' not found in Track {body.track}")

    GOALS_PATH.write_text("".join(out), encoding="utf-8")
    return {"ok": True, "track": body.track, "field": body.field, "value": body.value}

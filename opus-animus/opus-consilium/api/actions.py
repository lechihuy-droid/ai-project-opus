import uuid
import subprocess
import sys
import threading
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter()

AGENT_DIR = Path(__file__).parent.parent
PYTHON = sys.executable

ACTIONS = {
    "collect_dry_run": [PYTHON, "run_collect.py", "--dry-run"],
    "intel_synthesis": [PYTHON, "-c", "print('Intel synthesis placeholder: deterministic report is available at /api/intel/report. LLM synthesis is intentionally gated as a separate future step.')"],
    "collect":  [PYTHON, "run_collect.py"],
    "research": [PYTHON, "run_research.py", "AI"],
    "reflect":  [PYTHON, "run_wiki.py", "reflect"],
}

_jobs: dict[str, dict] = {}  # job_id → {proc, output_lines, status}

@router.get("/actions")
def list_actions():
    return {"actions": sorted(ACTIONS)}


def _capture_output(job: dict) -> None:
    proc = job["proc"]
    try:
        for line in proc.stdout:
            job["lines"].append(line.rstrip())
            if len(job["lines"]) > 200:
                job["lines"] = job["lines"][-200:]
    finally:
        proc.wait()
        job["status"] = "done" if proc.returncode == 0 else "error"


@router.post("/run/{action}")
def run_action(action: str):
    if action not in ACTIONS:
        raise HTTPException(400, f"Unknown action: {action}. Valid: {list(ACTIONS)}")

    job_id = str(uuid.uuid4())[:8]
    cmd = ACTIONS[action]
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(AGENT_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        _jobs[job_id] = {"proc": proc, "lines": [], "status": "running", "action": action}
        threading.Thread(target=_capture_output, args=(_jobs[job_id],), daemon=True).start()
    except Exception as e:
        raise HTTPException(500, str(e))

    return {"job_id": job_id, "action": action, "status": "running"}


@router.get("/run/{job_id}")
def poll_job(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(404, f"Job {job_id} not found")

    proc = job["proc"]

    return {
        "job_id": job_id,
        "action": job["action"],
        "status": job["status"],
        "output": "\n".join(job["lines"]),
        "returncode": proc.returncode,
    }

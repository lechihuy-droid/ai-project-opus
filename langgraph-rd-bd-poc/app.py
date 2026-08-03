import uuid

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from langgraph.types import Command
from main import build_graph, load_requirement

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
graph = build_graph()
_known_thread_ids: list[str] = []


class ResumeRequest(BaseModel):
    decision: str


def _pending_interrupt(snapshot):
    for task in snapshot.tasks:
        if task.interrupts:
            return task.interrupts[0].value
    return None


def _build_response(thread_id: str, snapshot) -> dict:
    interrupt_payload = _pending_interrupt(snapshot)
    status = "interrupted" if interrupt_payload is not None else "done"
    values = snapshot.values
    config = {"configurable": {"thread_id": thread_id}}
    checkpoints = len(list(graph.get_state_history(config)))
    return {
        "thread_id": thread_id,
        "status": status,
        "current_node": snapshot.next[0] if snapshot.next else None,
        "interrupt": interrupt_payload,
        "result": None
        if status == "interrupted"
        else {
            "review_status": values.get("review_status"),
            "review_score": values.get("review_score"),
            "revision_count": values.get("revision_count"),
            "human_decision": values.get("human_decision"),
        },
        "checkpoints": checkpoints,
    }


def _run_and_respond(thread_id: str, *invoke_args, **invoke_kwargs) -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    graph.invoke(*invoke_args, config=config, **invoke_kwargs)
    snapshot = graph.get_state(config)
    return _build_response(thread_id, snapshot)


@app.get("/")
def index():
    return FileResponse("static/index.html")


@app.get("/graph")
def graph_page():
    return FileResponse("static/graph.html")


@app.get("/api/graph")
def get_graph_diagram():
    return {"mermaid": graph.get_graph().draw_mermaid()}


@app.get("/api/runs")
def list_runs():
    runs = []
    for thread_id in _known_thread_ids:
        config = {"configurable": {"thread_id": thread_id}}
        snapshot = graph.get_state(config)
        interrupt_payload = _pending_interrupt(snapshot)
        runs.append(
            {
                "thread_id": thread_id,
                "status": "interrupted" if interrupt_payload is not None else "done",
            }
        )
    return runs


@app.post("/api/runs")
def create_run():
    thread_id = uuid.uuid4().hex
    _known_thread_ids.append(thread_id)
    return _run_and_respond(
        thread_id, {"requirement": load_requirement(), "revision_count": 0}
    )


@app.post("/api/runs/{thread_id}/resume")
def resume_run(thread_id: str, body: ResumeRequest):
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = graph.get_state(config)
    if not snapshot.values:
        raise HTTPException(404, "Unknown thread_id")
    if not snapshot.next:
        raise HTTPException(400, "This run has already finished; nothing to resume.")

    pending = _pending_interrupt(snapshot)
    if pending is None:
        raise HTTPException(400, "This run is not currently waiting for a decision.")

    allowed_actions = pending["allowed_actions"]
    if body.decision not in allowed_actions:
        raise HTTPException(
            400, f"Invalid decision '{body.decision}'. Allowed: {allowed_actions}"
        )

    return _run_and_respond(thread_id, Command(resume=body.decision))


@app.get("/api/runs/{thread_id}")
def get_run(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = graph.get_state(config)
    if not snapshot.values:
        raise HTTPException(404, "Unknown thread_id")
    return _build_response(thread_id, snapshot)

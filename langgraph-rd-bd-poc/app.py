import uuid

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from langgraph.types import Command
from main import build_graph, load_requirement

app = FastAPI()
graph = build_graph()


class ResumeRequest(BaseModel):
    decision: str


def _pending_interrupt(snapshot):
    for task in snapshot.tasks:
        if task.interrupts:
            return task.interrupts[0].value
    return None


def _build_response(thread_id: str, values: dict, interrupt_payload) -> dict:
    status = "interrupted" if interrupt_payload is not None else "done"
    config = {"configurable": {"thread_id": thread_id}}
    checkpoints = len(list(graph.get_state_history(config)))
    return {
        "thread_id": thread_id,
        "status": status,
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


def _response_from_invoke(thread_id: str, result: dict) -> dict:
    if "__interrupt__" in result:
        payload = result["__interrupt__"][0].value
        values = {k: v for k, v in result.items() if k != "__interrupt__"}
    else:
        payload = None
        values = result
    return _build_response(thread_id, values, payload)


@app.get("/")
def index():
    return FileResponse("static/index.html")


@app.post("/api/runs")
def create_run():
    thread_id = uuid.uuid4().hex
    config = {"configurable": {"thread_id": thread_id}}
    result = graph.invoke(
        {"requirement": load_requirement(), "revision_count": 0},
        config=config,
    )
    return _response_from_invoke(thread_id, result)


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

    result = graph.invoke(Command(resume=body.decision), config=config)
    return _response_from_invoke(thread_id, result)


@app.get("/api/runs/{thread_id}")
def get_run(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = graph.get_state(config)
    if not snapshot.values:
        raise HTTPException(404, "Unknown thread_id")
    return _build_response(thread_id, snapshot.values, _pending_interrupt(snapshot))

import uuid

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from langgraph.types import Command
from main import build_graph, load_requirement
from graph_builder import compile_definition, validate_definition

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
graph = build_graph()
_known_thread_ids: list[str] = []

# Milestone 8: user-created custom graphs, alongside the built-in "rd_bd" one.
_graph_definitions: dict[str, dict] = {}
_compiled_graphs: dict[str, object] = {"rd_bd": graph}
_runs_by_graph: dict[str, list[str]] = {"rd_bd": _known_thread_ids}


class ResumeRequest(BaseModel):
    decision: str


class GraphDefinitionRequest(BaseModel):
    name: str
    nodes: list[dict]
    edges: list[dict]


def _pending_interrupt(snapshot):
    for task in snapshot.tasks:
        if task.interrupts:
            return task.interrupts[0].value
    return None


def _build_response(graph_obj, thread_id: str, snapshot) -> dict:
    interrupt_payload = _pending_interrupt(snapshot)
    status = "interrupted" if interrupt_payload is not None else "done"
    values = snapshot.values
    config = {"configurable": {"thread_id": thread_id}}
    checkpoints = len(list(graph_obj.get_state_history(config)))
    return {
        "thread_id": thread_id,
        "status": status,
        "current_node": snapshot.next[0] if snapshot.next else None,
        "interrupt": interrupt_payload,
        "result": None if status == "interrupted" else values,
        "checkpoints": checkpoints,
    }


def _run_and_respond(graph_obj, thread_id: str, *invoke_args, **invoke_kwargs) -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    graph_obj.invoke(*invoke_args, config=config, **invoke_kwargs)
    snapshot = graph_obj.get_state(config)
    return _build_response(graph_obj, thread_id, snapshot)


def _get_compiled_graph(graph_id: str):
    graph_obj = _compiled_graphs.get(graph_id)
    if graph_obj is None:
        raise HTTPException(404, f"Unknown graph_id '{graph_id}'")
    return graph_obj


@app.get("/")
def index():
    return FileResponse("static/index.html")


@app.get("/graph")
def graph_page():
    return FileResponse("static/graph.html")


@app.get("/builder")
def builder_page():
    return FileResponse("static/builder.html")


@app.get("/run")
def run_page():
    return FileResponse("static/run.html")


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
        graph, thread_id, {"requirement": load_requirement(), "revision_count": 0}
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

    return _run_and_respond(graph, thread_id, Command(resume=body.decision))


@app.get("/api/runs/{thread_id}")
def get_run(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = graph.get_state(config)
    if not snapshot.values:
        raise HTTPException(404, "Unknown thread_id")
    return _build_response(graph, thread_id, snapshot)


# ---- Milestone 8: custom user-created graphs -----------------------------


@app.post("/api/graphs/preview")
def preview_graph_definition(body: dict):
    errors = validate_definition(body)
    if errors:
        return {"valid": False, "errors": errors, "mermaid": None}
    compiled = compile_definition(body)
    return {"valid": True, "errors": [], "mermaid": compiled.get_graph().draw_mermaid()}


@app.get("/api/graphs")
def list_graph_definitions():
    result = [{"graph_id": "rd_bd", "name": "RD → BD (có sẵn)", "builtin": True}]
    for graph_id, definition in _graph_definitions.items():
        result.append(
            {"graph_id": graph_id, "name": definition["name"], "builtin": False}
        )
    return result


@app.post("/api/graphs")
def create_graph_definition(body: GraphDefinitionRequest):
    definition = body.model_dump()
    errors = validate_definition(definition)
    if errors:
        raise HTTPException(400, {"errors": errors})
    compiled = compile_definition(definition)
    graph_id = uuid.uuid4().hex
    _graph_definitions[graph_id] = definition
    _compiled_graphs[graph_id] = compiled
    _runs_by_graph[graph_id] = []
    return {"graph_id": graph_id, "name": definition["name"]}


@app.get("/api/graphs/{graph_id}")
def get_graph_definition(graph_id: str):
    if graph_id == "rd_bd":
        return {
            "graph_id": "rd_bd",
            "name": "RD → BD (có sẵn)",
            "builtin": True,
            "mermaid": graph.get_graph().draw_mermaid(),
        }
    definition = _graph_definitions.get(graph_id)
    if definition is None:
        raise HTTPException(404, f"Unknown graph_id '{graph_id}'")
    compiled = _get_compiled_graph(graph_id)
    return {
        "graph_id": graph_id,
        "name": definition["name"],
        "nodes": definition["nodes"],
        "edges": definition["edges"],
        "builtin": False,
        "mermaid": compiled.get_graph().draw_mermaid(),
    }


@app.put("/api/graphs/{graph_id}")
def update_graph_definition(graph_id: str, body: GraphDefinitionRequest):
    if graph_id == "rd_bd":
        raise HTTPException(400, "The built-in RD→BD graph cannot be edited here.")
    if graph_id not in _graph_definitions:
        raise HTTPException(404, f"Unknown graph_id '{graph_id}'")
    definition = body.model_dump()
    errors = validate_definition(definition)
    if errors:
        raise HTTPException(400, {"errors": errors})
    compiled = compile_definition(definition)
    _graph_definitions[graph_id] = definition
    _compiled_graphs[graph_id] = compiled
    _runs_by_graph.setdefault(graph_id, [])
    return {"graph_id": graph_id, "name": definition["name"]}


@app.get("/api/graphs/{graph_id}/runs")
def list_graph_runs(graph_id: str):
    _get_compiled_graph(graph_id)
    graph_obj = _compiled_graphs[graph_id]
    runs = []
    for thread_id in _runs_by_graph.get(graph_id, []):
        config = {"configurable": {"thread_id": thread_id}}
        snapshot = graph_obj.get_state(config)
        interrupt_payload = _pending_interrupt(snapshot)
        runs.append(
            {
                "thread_id": thread_id,
                "status": "interrupted" if interrupt_payload is not None else "done",
            }
        )
    return runs


@app.post("/api/graphs/{graph_id}/runs")
def create_graph_run(graph_id: str):
    graph_obj = _get_compiled_graph(graph_id)
    thread_id = uuid.uuid4().hex
    _runs_by_graph.setdefault(graph_id, []).append(thread_id)
    return _run_and_respond(graph_obj, thread_id, {})


@app.post("/api/graphs/{graph_id}/runs/{thread_id}/resume")
def resume_graph_run(graph_id: str, thread_id: str, body: ResumeRequest):
    graph_obj = _get_compiled_graph(graph_id)
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = graph_obj.get_state(config)
    if not snapshot.values:
        raise HTTPException(404, "Unknown thread_id")
    if not snapshot.next:
        raise HTTPException(400, "This run has already finished; nothing to resume.")
    if _pending_interrupt(snapshot) is None:
        raise HTTPException(400, "This run is not currently waiting for a decision.")
    return _run_and_respond(graph_obj, thread_id, Command(resume=body.decision))


@app.get("/api/graphs/{graph_id}/runs/{thread_id}")
def get_graph_run(graph_id: str, thread_id: str):
    graph_obj = _get_compiled_graph(graph_id)
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = graph_obj.get_state(config)
    if not snapshot.values:
        raise HTTPException(404, "Unknown thread_id")
    return _build_response(graph_obj, thread_id, snapshot)

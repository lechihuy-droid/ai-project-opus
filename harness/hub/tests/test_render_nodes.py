from __future__ import annotations

import json
from pathlib import Path
import sys
from typing import Any

import pytest

import config
from services import runtime_interrupts, runtime_state, workflow, workflow_exec


@pytest.fixture()
def render_target(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> dict[str, Any]:
    script = tmp_path / "renderer.py"
    script.write_text(
        "import json, pathlib, sys, time\n"
        "props = pathlib.Path(sys.argv[sys.argv.index('--props') + 1])\n"
        "mode = json.loads(props.read_text()).get('mode', 'ok')\n"
        "if mode == 'sleep': time.sleep(2)\n"
        "if mode == 'fail': print('render failed', file=sys.stderr); raise SystemExit(7)\n"
        "out = pathlib.Path('render-output'); out.mkdir(exist_ok=True)\n"
        "video = out / 'video.mp4'; video.write_bytes(b'video')\n"
        "(out / 'render-report.json').write_text(json.dumps({'video': 'video.mp4'}))\n",
        encoding="utf-8",
    )
    target = {
        "cwd": config.HUB_DIR,
        "command": [sys.executable, str(script), "--props", "{props}"],
        # Generous on purpose: only the "sleep" case in
        # test_render_timeout_nonzero_block_and_default_gate exercises the
        # timeout path, and it overrides this down to a tight value at the
        # point of use. The "fail" and "ok" cases below don't assert on
        # timing at all, so they shouldn't be racing a real Python cold
        # start (import + interpreter startup) against a 1s budget -
        # that race is what made this file flaky under load.
        "timeout_seconds": 30,
        "risk_tier": "execute",
        "env": {},
        "output_hint": "render-output",
    }
    monkeypatch.setattr(config, "RENDER_TARGETS", {"test": target})
    yield target
    output = config.HUB_DIR / "render-output"
    if output.exists():
        for path in output.iterdir():
            path.unlink()
        output.rmdir()


def _data(render: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": "render-test",
        "nodes": [
            {"id": "map", "agent": "reviewer", "prompt": "map", "gate": "none"},
            render,
        ],
        "edges": [["map", render["id"]]],
        "stop": {"max_nodes": 4, "max_seconds": 60},
    }


def _render_node(**changes: Any) -> dict[str, Any]:
    return {"id": "render", "type": "render", "target": "test", "props_from": "map", **changes}


def _run() -> str:
    return str(runtime_state.create_run(agent_id="lead", metadata={"objective": "render"})["run_id"])


def test_render_schema_validates_and_builds_ir(render_target: dict[str, Any], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(workflow.runtime_agents, "list_agents", lambda: [{"id": "reviewer"}])
    data = _data(_render_node())
    assert workflow.validate_workflow(data) == []
    ir = workflow.build_ir(data)
    assert ir[1]["gate"] == "approval"
    assert ir[1]["render_target"]["command"] == render_target["command"]


@pytest.mark.parametrize("node, expected", [
    (_render_node(target="unknown"), "unknown"),
    (_render_node(props_from="missing"), "props_from"),
    (_render_node(props_from="render"), "props_from"),
    (_render_node(command=["bad"]), "may not supply"),
    (_render_node(cwd="bad"), "may not supply"),
    (_render_node(args=["bad"]), "may not supply"),
    (_render_node(env={}), "may not supply"),
])
def test_render_schema_rejects_unsafe_or_invalid_nodes(render_target: dict[str, Any], monkeypatch: pytest.MonkeyPatch, node: dict[str, Any], expected: str) -> None:
    monkeypatch.setattr(workflow.runtime_agents, "list_agents", lambda: [{"id": "reviewer"}])
    assert expected in "; ".join(workflow.validate_workflow(_data(node)))


def _ir(target: dict[str, Any], props: str, **node_changes: Any) -> dict[str, Any]:
    return {"id": "render", "type": "render", "target": "test", "render_target": target, "props_from": "map", "gate": "none", "risk_tier": target["risk_tier"], "order": 0, **node_changes}


def test_render_success_uses_only_config_argv_and_registers_real_artifact(render_target: dict[str, Any], monkeypatch: pytest.MonkeyPatch) -> None:
    captured: list[list[str]] = []
    original = workflow_exec.procs.registry.spawn
    monkeypatch.setattr(workflow_exec.procs.registry, "spawn", lambda argv, **kwargs: (captured.append(argv), original(argv, **kwargs))[1])
    run_id = _run()
    ir = _ir(render_target, '{"mode":"ok"}')
    state = runtime_state.update_run_state(run_id, {"metadata": {"node_outputs": {"map": '{"mode":"ok"}'}}})
    list(workflow_exec.run_workflow([ir], stop={"max_nodes": 4, "max_seconds": 60}, objective="x", run_id=run_id))
    assert captured[0][:-1] == render_target["command"][:-1]
    assert captured[0][-1].endswith("render-props.json")
    artifact = runtime_state.read_run(run_id)["artifacts"][0]
    assert Path(artifact["path"]).is_file() and artifact["size"] == 5


def test_render_timeout_nonzero_block_and_default_gate(render_target: dict[str, Any], monkeypatch: pytest.MonkeyPatch) -> None:
    # This is the only sub-case in this test that actually exercises the
    # timeout path, so it gets its own tight timeout at the point of use
    # instead of racing the shared fixture's timeout against a cold Python
    # start. The script sleeps for 2s, so a 1s timeout still fires
    # deterministically before the sleep would ever complete on its own -
    # system load only makes the process take *longer* than 2s, never
    # shorter, so the timeout always wins the race.
    sleep_target = {**render_target, "timeout_seconds": 1}
    run_id = _run()
    runtime_state.update_run_state(run_id, {"metadata": {"node_outputs": {"map": '{"mode":"sleep"}'}}})
    list(workflow_exec.run_workflow([_ir(sleep_target, "")], stop={"max_nodes": 4, "max_seconds": 60}, objective="x", run_id=run_id))
    assert runtime_state.read_run(run_id)["status"] == "failed"

    node = _ir(render_target, "")
    run_id = _run()
    runtime_state.update_run_state(run_id, {"metadata": {"node_outputs": {"map": '{"mode":"fail"}'}}})
    list(workflow_exec.run_workflow([node], stop={"max_nodes": 4, "max_seconds": 60}, objective="x", run_id=run_id))
    assert "code 7" in runtime_state.read_run(run_id)["metadata"]["error"]

    monkeypatch.setattr(config, "JOB_BLOCKED_TIERS", ["execute"])
    run_id = _run()
    runtime_state.update_run_state(run_id, {"metadata": {"node_outputs": {"map": '{"mode":"ok"}'}}})
    list(workflow_exec.run_workflow([node], stop={"max_nodes": 4, "max_seconds": 60}, objective="x", run_id=run_id))
    assert "risk_tier 'execute' blocked" in runtime_state.read_run(run_id)["metadata"]["error"]

    monkeypatch.setattr(config, "JOB_BLOCKED_TIERS", [])
    run_id = _run()
    gated = {**node, "gate": "approval"}
    runtime_state.update_run_state(run_id, {"metadata": {"node_outputs": {"map": '{"mode":"ok"}'}}})
    list(workflow_exec.run_workflow([gated], stop={"max_nodes": 4, "max_seconds": 60}, objective="x", run_id=run_id))
    assert runtime_state.read_run(run_id)["interrupts"][0]["reason"] == "approval_required"


def test_render_props_path_cannot_escape_artifacts(render_target: dict[str, Any]) -> None:
    run_id = _run()
    node = _ir(render_target, "") | {"id": "../../escape"}
    runtime_state.update_run_state(run_id, {"metadata": {"node_outputs": {"map": "{}"}}})
    list(workflow_exec.run_workflow([node], stop={"max_nodes": 4, "max_seconds": 60}, objective="x", run_id=run_id))
    assert "outside allowed root" in runtime_state.read_run(run_id)["metadata"]["error"]

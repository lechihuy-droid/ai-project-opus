from __future__ import annotations

from pathlib import Path
from typing import Any, Iterator

import pytest

import config
from services import fsbrowse, governance, runtime_agents, runtime_checkpoint, runtime_interrupts, runtime_state, skill_library, workflow_exec
from services.providers import claude_cli, codex_cli, registry


@pytest.fixture()
def runtime_tmp(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    base = tmp_path / "runtime"
    monkeypatch.setattr(config, "RUNTIME_DIR", base)
    monkeypatch.setattr(config, "RUNTIME_THREADS_DIR", base / "threads")
    monkeypatch.setattr(config, "RUNTIME_RUNS_DIR", base / "runs")
    monkeypatch.setattr(config, "RUNTIME_STORE_DIR", base / "store")
    monkeypatch.setattr(config, "GOVERNANCE_STATE_FILE", base / "governance.json")
    return base


class FakeProvider:
    def __init__(self, scripts: list[list[dict[str, Any]]]) -> None:
        self.scripts = scripts
        self.messages: list[list[dict[str, str]]] = []
        self.tool_policies: list[dict[str, Any] | None] = []

    def status(self) -> dict[str, Any]:
        return {"id": "fake", "available": True}

    def stream_chat(self, messages: list[dict[str, str]], session_id: str | None = None, model: str | None = None, **kwargs: Any) -> Iterator[dict[str, Any]]:
        self.messages.append(messages)
        self.tool_policies.append(kwargs.get("tool_policy"))
        yield from self.scripts.pop(0)


def _agent(*, max_calls: int = 5) -> dict[str, Any]:
    return {
        "id": "reviewer", "provider": "fake", "model": None, "system_prompt": "Review carefully.",
        "budget": {"seconds": 60, "max_calls": max_calls}, "skills": [], "permission": "read_only", "risk_tier": "read_only",
    }


def test_workspace_dir_policy_without_grant_has_no_workspace_access() -> None:
    agent = _agent() | {"allowed_paths": ["profile-path"]}

    assert workflow_exec._tool_policy(agent) == {
        "permission": "read_only", "allowed_tools": [], "allowed_paths": ["profile-path"], "writable_paths": ["profile-path"],
        "allowed_origins": [], "allowed_capabilities": [],
    }
    policy = workflow_exec._tool_policy(agent, "demo", "external-folder")
    assert "external-folder" not in policy["allowed_paths"]
    assert "external-folder" not in policy["writable_paths"]
    assert "cwd" not in policy


def test_workspace_dir_stays_read_only_without_write_consent_even_with_capabilities() -> None:
    """Capability grants are not a second route to write access: without consent the
    workspace folder stays out of writable_paths and cwd."""
    agent = _agent() | {"allowed_paths": ["profile-path"], "capabilities": ["fs.search"]}

    policy = workflow_exec._tool_policy(agent, "demo", "external-folder")

    assert "external-folder" not in policy["writable_paths"]
    assert "cwd" not in policy
    assert policy["writable_paths"] == ["profile-path"]
    assert policy["allowed_capabilities"] == ["fs.search"]
    assert "external-folder" not in policy["allowed_paths"]


def test_cli_commands_exclude_read_only_workspace_dir() -> None:
    policy = workflow_exec._tool_policy(_agent() | {"permission": "workspace_write"}, "demo", "external-folder")

    assert "external-folder" not in claude_cli._build_cmd("do", None, tool_policy=policy)
    assert "external-folder" not in " ".join(codex_cli._build_cmd("do", None, tool_policy=policy))


def test_resume_restores_workspace_scope_from_metadata(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    ir = [{"id": "approve", "agent": _agent(), "prompt": "Do {{objective}}", "gate": "approval", "order": 0}]
    run_id = _pinned_run(ir, {"id": "demo", "nodes": [], "edges": [], "stop": {"max_nodes": 1, "max_seconds": 60}})
    folder = Path("external-folder").resolve()
    folder.mkdir(parents=True, exist_ok=True)
    governance.grant_folder("demo", folder)
    runtime_state.update_run_state(run_id, {"metadata": {"workflow_id": "demo", "workspace_dir": str(folder)}})

    list(workflow_exec.run_workflow(ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship", run_id=run_id))
    interrupt = runtime_state.read_run(run_id)["interrupts"][0]
    runtime_interrupts.resolve_interrupt(run_id, interrupt["interrupt_id"], resume_payload={"approved": True})
    list(workflow_exec.run_workflow([], stop={}, objective="", run_id=run_id))

    assert fake.tool_policies == [{
        "permission": "read_only", "allowed_tools": [], "allowed_paths": [str(folder)],
        "writable_paths": [str(folder)], "allowed_origins": [], "allowed_capabilities": [],
        "cwd": str(folder),
    }]


def test_grant_policy_covers_children_not_parent(runtime_tmp: Path, tmp_path: Path) -> None:
    folder = tmp_path / "A"; child = folder / "child"; folder.mkdir(); child.mkdir()
    governance.grant_folder("demo", folder)
    assert "cwd" not in workflow_exec._tool_policy(_agent(), "other", str(folder.parent))
    assert workflow_exec._tool_policy(_agent(), "demo", str(child))["cwd"] == str(child.resolve())


def test_grant_is_scoped_to_workflow(runtime_tmp: Path, tmp_path: Path) -> None:
    folder = tmp_path / "A"; folder.mkdir()
    governance.grant_folder("demo", folder)
    assert "cwd" not in workflow_exec._tool_policy(_agent(), "other", str(folder))


def test_deny_list_cannot_be_granted(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    denied = tmp_path / ".ssh"; denied.mkdir()
    monkeypatch.setattr(fsbrowse, "is_denied", lambda _path: True)
    with pytest.raises(ValueError): governance.grant_folder("demo", denied)


def test_grant_resolves_against_current_target(runtime_tmp: Path, tmp_path: Path) -> None:
    original = tmp_path / "original"; replacement = tmp_path / "replacement"; original.mkdir(); replacement.mkdir()
    governance.grant_folder("demo", original)
    state = governance._load_state(); state["folder_grants"][0]["path"] = str(replacement.resolve()); governance._save_state(state)
    assert "cwd" not in workflow_exec._tool_policy(_agent(), "demo", str(original))


def test_revoke_removes_next_policy(runtime_tmp: Path, tmp_path: Path) -> None:
    folder = tmp_path / "A"; folder.mkdir()
    governance.grant_folder("demo", folder)
    assert "cwd" in workflow_exec._tool_policy(_agent(), "demo", str(folder))
    assert governance.revoke_folder_grant("demo", str(folder))
    assert "cwd" not in workflow_exec._tool_policy(_agent(), "demo", str(folder))


def _run() -> str:
    return str(runtime_state.create_run(agent_id="lead", metadata={"objective": "ship feature"})["run_id"])


def _pin_skill(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, source: str = "project") -> Path:
    root = tmp_path / source
    skill = root / "demo"
    skill.mkdir(parents=True)
    path = skill / "SKILL.md"
    path.write_text("---\nname: demo\n---\nOld instructions.", encoding="utf-8")
    monkeypatch.setattr(config, "SKILL_SOURCES", {source: root}, raising=False)
    skill_library._clear_cache()
    return path


def _pinned_run(ir: list[dict[str, Any]], data: dict[str, Any]) -> str:
    snapshot = workflow_exec._workflow_snapshot(data, ir)
    return str(runtime_state.create_run(agent_id="lead", metadata={"objective": "ship", "workflow_snapshot": snapshot, "snapshot_status": "pinned"})["run_id"])


def test_snapshot_keeps_original_skill_text_after_edit(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    path = _pin_skill(monkeypatch, tmp_path)
    monkeypatch.setitem(registry, "fake", FakeProvider([]))
    ir = [{"id": "a", "agent": _agent() | {"skills": ["demo"]}, "prompt": "Original prompt", "gate": "none", "order": 0}]
    snapshot = workflow_exec._workflow_snapshot({"id": "demo", "nodes": [], "edges": [], "stop": {"max_nodes": 1, "max_seconds": 60}}, ir)

    path.write_text("---\nname: demo\n---\nNew instructions.", encoding="utf-8")

    pin = snapshot["ir"][0]["agent"]["skill_pins"][0]
    assert pin["content"] == "---\nname: demo\n---\nOld instructions."
    assert "New instructions." not in pin["content"]


def test_pinned_skill_hash_drift_fails_closed(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    path = _pin_skill(monkeypatch, tmp_path)
    fake = FakeProvider([[{"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    ir = [{"id": "a", "agent": _agent() | {"skills": ["demo"]}, "prompt": "A", "gate": "none", "order": 0}]
    run_id = _pinned_run(ir, {"id": "demo", "nodes": [], "edges": [], "stop": {"max_nodes": 1, "max_seconds": 60}})
    path.write_text("---\nname: demo\n---\nChanged instructions.", encoding="utf-8")

    list(workflow_exec.run_workflow(ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship", run_id=run_id))

    state = runtime_state.read_run(run_id)
    assert state["status"] == "failed"
    assert state["metadata"]["error"] == "Pinned skill content drift: demo"
    assert fake.messages == []


def test_pinned_skill_source_shadowing_fails_closed(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    original = _pin_skill(monkeypatch, tmp_path, "low")
    fake = FakeProvider([[{"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    ir = [{"id": "a", "agent": _agent() | {"skills": ["demo"]}, "prompt": "A", "gate": "none", "order": 0}]
    run_id = _pinned_run(ir, {"id": "demo", "nodes": [], "edges": [], "stop": {"max_nodes": 1, "max_seconds": 60}})
    high_root = tmp_path / "high"; high_skill = high_root / "demo"; high_skill.mkdir(parents=True)
    high_skill.joinpath("SKILL.md").write_text(original.read_text(encoding="utf-8"), encoding="utf-8")
    monkeypatch.setattr(config, "SKILL_SOURCES", {"high": high_root, "low": original.parents[1]}, raising=False)
    skill_library._clear_cache()

    list(workflow_exec.run_workflow(ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship", run_id=run_id))

    assert runtime_state.read_run(run_id)["metadata"]["error"] == "Pinned skill source drift: demo"
    assert fake.messages == []


def test_workflow_snapshot_ignores_later_definition_edit(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    original_ir = [{"id": "a", "agent": _agent(), "prompt": "Original workflow prompt", "gate": "none", "order": 0}]
    data = {"id": "demo", "nodes": [{"prompt": "Original workflow prompt"}], "edges": [], "stop": {"max_nodes": 1, "max_seconds": 60}}
    run_id = _pinned_run(original_ir, data)
    data["nodes"][0]["prompt"] = "Edited workflow prompt"
    edited_ir = [{"id": "a", "agent": _agent(), "prompt": "Edited workflow prompt", "gate": "none", "order": 0}]

    list(workflow_exec.run_workflow(edited_ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship", run_id=run_id))

    assert fake.messages[0][1]["content"] == "Original workflow prompt"
    assert runtime_state.read_run(run_id)["metadata"]["workflow_snapshot"]["definition"]["nodes"][0]["prompt"] == "Original workflow prompt"


def test_agent_snapshot_keeps_profile_and_resolved_route(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    monkeypatch.setitem(config.MODEL_CLASS_ROUTING, "cheap", {"provider": "fake", "model": "pinned-model"})
    original_ir = [{"id": "a", "agent": _agent() | {"provider": "cheap", "system_prompt": "Original profile"}, "prompt": "A", "gate": "none", "order": 0}]
    run_id = _pinned_run(original_ir, {"id": "demo", "nodes": [], "edges": [], "stop": {"max_nodes": 1, "max_seconds": 60}})
    monkeypatch.setitem(config.MODEL_CLASS_ROUTING, "cheap", {"provider": "changed", "model": "changed-model"})
    edited_ir = [{"id": "a", "agent": _agent() | {"provider": "cheap", "system_prompt": "Edited profile"}, "prompt": "A", "gate": "none", "order": 0}]

    list(workflow_exec.run_workflow(edited_ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship", run_id=run_id))

    assert fake.messages[0][0]["content"] == "SYSTEM INSTRUCTIONS:\nOriginal profile"


def test_legacy_run_without_snapshot_marks_live_read(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    run_id = _run()
    ir = [{"id": "a", "agent": _agent(), "prompt": "A", "gate": "none", "order": 0}]

    list(workflow_exec.run_workflow(ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship", run_id=run_id))

    assert runtime_state.read_run(run_id)["status"] == "succeeded"
    assert runtime_state.read_run(run_id)["metadata"]["snapshot_status"] == "legacy_live_read"


def test_two_node_chain_renders_output_and_checkpoints(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([
        [{"type": "delta", "text": "foo"}, {"type": "delta", "text": "bar"}, {"type": "done", "usage": {"total_tokens": 2}}],
        [{"type": "delta", "text": "done"}, {"type": "done", "usage": {"total_tokens": 3}}],
    ])
    monkeypatch.setitem(registry, "fake", fake)
    ir = [
        {"id": "a", "agent": _agent(), "prompt": "Plan {{objective}}", "gate": "none", "order": 0},
        {"id": "b", "agent": _agent(), "prompt": "Use {{a_output}}", "gate": "none", "order": 1},
    ]
    run_id = _run()

    events = list(workflow_exec.run_workflow(ir, stop={"max_nodes": 2, "max_seconds": 60}, objective="ship feature", run_id=run_id))

    state = runtime_state.read_run(run_id)
    assert state["status"] == "succeeded"
    assert state["metadata"]["node_outputs"] == {"a": "foobar", "b": "done"}
    assert "foobar" in fake.messages[1][1]["content"]
    assert any("event: done" in event for event in events)
    checkpoints = runtime_checkpoint.list_checkpoints(state["thread_id"])
    assert {item["reason"] for item in checkpoints} >= {"node:a", "node:b"}


def test_agent_skills_are_appended_to_provider_system_instructions(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    monkeypatch.setattr(skill_library, "read_skill_content", lambda name: {"first": "First rules.", "second": "Second rules."}[name])
    ir = [{"id": "a", "agent": _agent() | {"skills": ["first", "second"]}, "prompt": "A", "gate": "none", "order": 0}]

    list(workflow_exec.run_workflow(ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship", run_id=_run()))

    assert fake.messages[0][0]["content"] == "SYSTEM INSTRUCTIONS:\nReview carefully.\n\n[Activated skills]\nFirst rules.\n\n---\n\nSecond rules."


def test_agent_without_skills_keeps_existing_system_instructions(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    monkeypatch.setattr(skill_library, "read_skill_content", lambda _name: (_ for _ in ()).throw(AssertionError("unexpected skill read")))
    ir = [{"id": "a", "agent": _agent(), "prompt": "A", "gate": "none", "order": 0}]

    list(workflow_exec.run_workflow(ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship", run_id=_run()))

    assert fake.messages[0][0]["content"] == "SYSTEM INSTRUCTIONS:\nReview carefully."


def test_missing_agent_skill_warns_and_run_continues(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "delta", "text": "ok"}, {"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    monkeypatch.setattr(skill_library, "read_skill_content", lambda _name: (_ for _ in ()).throw(FileNotFoundError("gone")))
    ir = [{"id": "a", "agent": _agent() | {"skills": ["gone"]}, "prompt": "A", "gate": "none", "order": 0}]

    events = list(workflow_exec.run_workflow(ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship", run_id=_run()))

    assert fake.messages[0][0]["content"] == "SYSTEM INSTRUCTIONS:\nReview carefully."
    assert any("event: warning" in event and "Skill unavailable and skipped: gone" in event for event in events)


def test_model_class_routes_to_fake_provider_without_changing_budget(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "delta", "text": "routed"}, {"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    monkeypatch.setitem(config.MODEL_CLASS_ROUTING, "cheap", {"provider": "fake", "model": None})
    ir = [{"id": "a", "agent": _agent() | {"provider": "cheap"}, "prompt": "A", "gate": "none", "order": 0}]
    run_id = _run()

    list(workflow_exec.run_workflow(ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship", run_id=run_id))

    state = runtime_state.read_run(run_id)
    assert state["status"] == "succeeded"
    assert state["metadata"]["agent_calls"] == {"reviewer": 1}
    assert fake.messages


def test_approval_gate_reenters_same_node(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "delta", "text": "approved output"}, {"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    ir = [{"id": "approve", "agent": _agent(), "prompt": "Do {{objective}}", "gate": "approval", "order": 0}]
    run_id = _run()

    first = list(workflow_exec.run_workflow(ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship feature", run_id=run_id))
    state = runtime_state.read_run(run_id)
    assert any("event: interrupt" in event for event in first)
    assert state["status"] == "interrupted"
    assert state["metadata"]["node_index"] == 0
    assert state["metadata"]["node_outputs"] == {}

    interrupt = state["interrupts"][0]
    runtime_interrupts.resolve_interrupt(run_id, interrupt["interrupt_id"], resume_payload={"approved": True})
    list(workflow_exec.run_workflow(ir, stop={"max_nodes": 1, "max_seconds": 60}, objective="ship feature", run_id=run_id))
    state = runtime_state.read_run(run_id)
    assert state["status"] == "succeeded"
    assert state["metadata"]["node_outputs"] == {"approve": "approved output"}


def test_agent_call_budget_stops_before_second_provider_call(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "done", "usage": {}}]])
    monkeypatch.setitem(registry, "fake", fake)
    ir = [
        {"id": "a", "agent": _agent(max_calls=1), "prompt": "A", "gate": "none", "order": 0},
        {"id": "b", "agent": _agent(max_calls=1), "prompt": "B", "gate": "none", "order": 1},
    ]
    run_id = _run()

    list(workflow_exec.run_workflow(ir, stop={"max_nodes": 2, "max_seconds": 60}, objective="ship feature", run_id=run_id))

    state = runtime_state.read_run(run_id)
    assert state["status"] == "failed"
    assert "budget_exceeded: agent max_calls (reviewer)" == state["metadata"]["error"]
    assert len(fake.messages) == 1


def test_provider_error_stops_remaining_nodes(runtime_tmp: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeProvider([[{"type": "delta", "text": "partial"}, {"type": "error", "message": "upstream failed"}]])
    monkeypatch.setitem(registry, "fake", fake)
    ir = [
        {"id": "bad", "agent": _agent(), "prompt": "Bad", "gate": "none", "order": 0},
        {"id": "never", "agent": _agent(), "prompt": "Never", "gate": "none", "order": 1},
    ]
    run_id = _run()

    list(workflow_exec.run_workflow(ir, stop={"max_nodes": 2, "max_seconds": 60}, objective="ship feature", run_id=run_id))

    state = runtime_state.read_run(run_id)
    assert state["status"] == "failed"
    assert state["metadata"]["error"] == "upstream failed"
    assert state["metadata"]["node_outputs"] == {}
    assert state["metadata"]["completed_nodes"] == []
    assert len(fake.messages) == 1

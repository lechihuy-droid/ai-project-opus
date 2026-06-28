from __future__ import annotations

import io
import subprocess
from pathlib import Path

import pytest

import config
from services import boundary, gitjobs


def run_git(cwd: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(cwd), *args],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        shell=False,
        check=True,
    )


@pytest.fixture()
def temp_repo(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    repo = tmp_path / "repo"
    repo.mkdir()
    subprocess.run(["git", "init", str(repo)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    run_git(repo, "config", "user.email", "hub-tests@example.test")
    run_git(repo, "config", "user.name", "Hub Tests")

    (repo / "README.md").write_text("# tmp\n", encoding="utf-8")
    run_git(repo, "add", "README.md")
    run_git(repo, "commit", "-m", "initial")
    (repo / "second.txt").write_text("second\n", encoding="utf-8")
    run_git(repo, "add", "second.txt")
    run_git(repo, "commit", "-m", "second")

    jobs_dir = repo / "harness" / "hub" / "jobs"
    monkeypatch.setattr(config, "ROOT", repo)
    monkeypatch.setattr(config, "JOBS_DIR", jobs_dir)
    monkeypatch.setattr(config, "JOB_ALLOW_AGENTS", {"codex"})
    monkeypatch.setattr(config, "JOB_AGENT_CMD", "codex")
    monkeypatch.setattr(config, "JOB_TIME_CAP_SECONDS", 10)
    monkeypatch.setattr(boundary, "ROOT_RESOLVED", repo.resolve())
    gitjobs._STREAMS.clear()
    return repo


def test_job_lifecycle_uses_temp_repo_and_worktree_only(
    temp_repo: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    spawned: list[tuple[list[str], Path]] = []

    class FakeProcess:
        stdout = io.StringIO("agent wrote file\n")
        stderr = io.StringIO("")

        def wait(self, timeout: int | None = None) -> int:
            return 0

        def kill(self) -> None:
            return None

    def fake_spawn(command: list[str], cwd: Path, env: dict[str, str]) -> FakeProcess:
        spawned.append((command, Path(cwd)))
        (Path(cwd) / "agent-output.txt").write_text("created by fake agent\n", encoding="utf-8")
        return FakeProcess()

    monkeypatch.setattr(gitjobs, "_spawn_agent", fake_spawn)

    job = gitjobs.create_job("write a file", "codex")
    worktree = Path(job["worktree"])

    assert job["status"] == "awaiting-approval"
    assert worktree.is_dir()
    assert job["base_sha"] == run_git(temp_repo, "rev-parse", "HEAD").stdout.strip()

    running = gitjobs.approve(job["id"])
    assert running["status"] == "running"
    assert spawned
    assert spawned[0][0][0] == "codex"
    assert spawned[0][1] == worktree

    streamed = "".join(gitjobs.stream_events(job["id"]))
    assert "agent wrote file" in streamed
    assert "event: exit" in streamed

    reviewed = gitjobs.get_job(job["id"])
    assert reviewed["status"] == "awaiting-review"
    assert reviewed["diffstat"]["files"] == 1
    assert reviewed["diffstat"]["insertions"] == 1
    assert "agent-output.txt" in gitjobs.diff(job["id"])

    rolled_back = gitjobs.rollback(job["id"])
    assert rolled_back["status"] == "rolledback"
    assert run_git(worktree, "status", "--porcelain").stdout.strip() == ""
    assert not (worktree / "agent-output.txt").exists()

    rejected = gitjobs.create_job("reject before run", "codex")
    rejected_wt = Path(rejected["worktree"])
    assert rejected_wt.is_dir()

    rejected = gitjobs.reject(rejected["id"])
    assert rejected["status"] == "rejected"
    assert not rejected_wt.exists()

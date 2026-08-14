from __future__ import annotations

import subprocess
import time
from pathlib import Path

import pytest

import config
from services import cicd


def run_git(cwd: Path, *args: str) -> None:
    subprocess.run(
        ["git", "-C", str(cwd), *args],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding="utf-8", errors="replace", shell=False, check=True,
    )


@pytest.fixture()
def temp_repo(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    repo = tmp_path / "repo"
    repo.mkdir()
    subprocess.run(["git", "init", "-b", "main", str(repo)], check=True,
                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    run_git(repo, "config", "user.email", "hub-tests@example.test")
    run_git(repo, "config", "user.name", "Hub Tests")
    (repo / "README.md").write_text("# tmp\n", encoding="utf-8")
    run_git(repo, "add", "README.md")
    run_git(repo, "commit", "-m", "first commit")
    monkeypatch.setattr(config, "ROOT", repo)
    cicd.refresh_cache()
    return repo


def test_run_git_returns_stdout(temp_repo: Path) -> None:
    assert cicd._run_git(["branch", "--show-current"]) == "main"


def test_run_git_returns_empty_string_on_failure(temp_repo: Path) -> None:
    assert cicd._run_git(["cat-file", "-p", "does-not-exist"]) == ""


def test_token_status_unavailable_without_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "")
    monkeypatch.setattr(cicd, "_gh_cli_token", lambda: "")
    cicd.refresh_cache()
    status = cicd.get_github_token_status()
    assert status["available"] is False
    assert status["reason"]


def test_token_status_available_with_env_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "ghp_fake")
    cicd.refresh_cache()
    assert cicd.get_github_token_status() == {"available": True, "reason": ""}


def test_token_status_never_leaks_the_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "ghp_supersecret")
    cicd.refresh_cache()
    assert "ghp_supersecret" not in str(cicd.get_github_token_status())


def test_cache_expires_after_ttl(monkeypatch: pytest.MonkeyPatch) -> None:
    cicd.refresh_cache()
    cicd._cache_set("k", 1)
    assert cicd._cache_get("k") == 1
    later = time.time() + config.CICD_CACHE_TTL_SECONDS + 1
    monkeypatch.setattr(cicd.time, "time", lambda: later)
    assert cicd._cache_get("k") is None


def test_local_branches_lists_current_branch(temp_repo: Path) -> None:
    branches = cicd.get_local_branches()
    names = [branch["name"] for branch in branches]
    assert "main" in names
    entry = next(branch for branch in branches if branch["name"] == "main")
    assert entry["last_commit_subject"] == "first commit"
    assert entry["last_commit_date"]


def test_remote_branches_empty_without_remote(temp_repo: Path) -> None:
    assert cicd.get_remote_branches() == []


def test_branches_bundle_shape(temp_repo: Path) -> None:
    data = cicd.get_branches()
    assert set(data) == {"local", "remote", "current"}
    assert data["current"] == "main"


def test_recent_commits_returns_newest_first(temp_repo: Path) -> None:
    (temp_repo / "second.txt").write_text("x\n", encoding="utf-8")
    run_git(temp_repo, "add", "second.txt")
    run_git(temp_repo, "commit", "-m", "second commit")
    cicd.refresh_cache()
    commits = cicd.get_recent_commits(5)
    assert commits[0]["subject"] == "second commit"
    assert commits[0]["author_name"] == "Hub Tests"
    assert len(commits[0]["sha"]) == 40


def test_commit_subject_with_pipe_is_not_split(temp_repo: Path) -> None:
    (temp_repo / "third.txt").write_text("x\n", encoding="utf-8")
    run_git(temp_repo, "add", "third.txt")
    run_git(temp_repo, "commit", "-m", "fix: a|b parsing")
    cicd.refresh_cache()
    assert cicd.get_recent_commits(1)[0]["subject"] == "fix: a|b parsing"


def test_worktrees_lists_the_main_checkout(temp_repo: Path) -> None:
    worktrees = cicd.get_worktrees()
    assert len(worktrees) == 1
    assert worktrees[0]["branch"] == "main"
    assert len(worktrees[0]["head"]) == 40


def test_git_functions_return_empty_outside_a_repo(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setattr(config, "ROOT", tmp_path)
    cicd.refresh_cache()
    assert cicd.get_local_branches() == []
    assert cicd.get_worktrees() == []
    assert cicd.get_recent_commits(5) == []
    assert cicd.get_current_branch() == ""


class _FakeResponse:
    def __init__(self, payload: object, status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code

    def json(self) -> object:
        return self._payload


class _FakeClient:
    """Stands in for httpx.Client. Records the paths it was asked for."""

    calls: list[tuple[str, dict[str, object] | None]] = []
    payload: object = {}
    raises: Exception | None = None

    def __init__(self, *args: object, **kwargs: object) -> None:
        pass

    def __enter__(self) -> "_FakeClient":
        return self

    def __exit__(self, *args: object) -> bool:
        return False

    def get(self, url: str, params: dict[str, object] | None = None, headers: object = None) -> _FakeResponse:
        _FakeClient.calls.append((url, params))
        if _FakeClient.raises is not None:
            raise _FakeClient.raises
        return _FakeResponse(_FakeClient.payload)


@pytest.fixture()
def fake_github(monkeypatch: pytest.MonkeyPatch) -> type[_FakeClient]:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "ghp_fake")
    monkeypatch.setattr(config, "GITHUB_OWNER", "acme")
    monkeypatch.setattr(config, "GITHUB_REPO", "widget")
    monkeypatch.setattr(cicd.httpx, "Client", _FakeClient)
    _FakeClient.calls = []
    _FakeClient.payload = {}
    _FakeClient.raises = None
    cicd.refresh_cache()
    return _FakeClient


def test_workflows_are_mapped_to_the_ui_shape(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflows": [
        {"id": 12, "name": "CI", "path": ".github/workflows/ci.yml",
         "state": "active", "updated_at": "2026-08-01T00:00:00Z"},
    ]}
    workflows = cicd.get_workflows()
    assert workflows == [{
        "id": "12", "name": "CI", "path": ".github/workflows/ci.yml",
        "state": "active", "updated_at": "2026-08-01T00:00:00Z",
    }]


def test_workflows_empty_without_token(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "")
    monkeypatch.setattr(cicd, "_gh_cli_token", lambda: "")
    cicd.refresh_cache()
    assert cicd.get_workflows() == []


def test_workflow_runs_use_the_repo_wide_endpoint_without_an_id(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflow_runs": []}
    cicd.get_workflow_runs()
    url, params = fake_github.calls[0]
    assert url.endswith("/repos/acme/widget/actions/runs")
    assert params == {"per_page": 30}


def test_workflow_runs_use_the_workflow_scoped_endpoint_with_an_id(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflow_runs": []}
    cicd.get_workflow_runs("12", 5)
    url, params = fake_github.calls[0]
    assert url.endswith("/repos/acme/widget/actions/workflows/12/runs")
    assert params == {"per_page": 5}


def test_workflow_run_duration_is_derived_from_timestamps(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflow_runs": [{
        "id": 99, "name": "CI", "status": "completed", "conclusion": "success",
        "head_branch": "main", "created_at": "2026-08-01T10:00:00Z",
        "updated_at": "2026-08-01T10:02:30Z", "html_url": "https://example.test/99",
    }]}
    run = cicd.get_workflow_runs()[0]
    assert run["id"] == "99"
    assert run["branch"] == "main"
    assert run["duration_seconds"] == 150.0


def test_workflow_run_duration_is_none_when_still_running(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflow_runs": [{
        "id": 100, "name": "CI", "status": "in_progress", "conclusion": None,
        "head_branch": "main", "created_at": "2026-08-01T10:00:00Z",
        "updated_at": "", "html_url": "",
    }]}
    run = cicd.get_workflow_runs()[0]
    assert run["duration_seconds"] is None
    assert run["conclusion"] == ""


def test_github_errors_degrade_to_empty_lists(fake_github: type[_FakeClient]) -> None:
    fake_github.raises = RuntimeError("boom")
    assert cicd.get_workflows() == []
    assert cicd.get_workflow_runs() == []


def test_workflows_are_cached_between_calls(fake_github: type[_FakeClient]) -> None:
    fake_github.payload = {"workflows": []}
    cicd.get_workflows()
    cicd.get_workflows()
    assert len(fake_github.calls) == 1


def test_project_health_lists_top_level_dirs(temp_repo: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "")
    monkeypatch.setattr(cicd, "_gh_cli_token", lambda: "")
    (temp_repo / "alpha").mkdir()
    (temp_repo / "alpha" / "README.md").write_text("# alpha\n", encoding="utf-8")
    (temp_repo / "alpha" / "test_alpha.py").write_text("def test_x(): pass\n", encoding="utf-8")
    (temp_repo / ".hidden").mkdir()
    cicd.refresh_cache()

    projects = cicd.get_project_health()["projects"]
    names = [project["name"] for project in projects]
    assert "alpha" in names
    assert ".hidden" not in names
    alpha = next(project for project in projects if project["name"] == "alpha")
    assert alpha["test_count"] == 1
    assert alpha["file_count"] == 2
    assert alpha["has_readme"] is True
    assert alpha["has_git"] is False
    assert alpha["last_modified"]


def test_overview_stats_shape_without_github(temp_repo: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "GITHUB_TOKEN", "")
    monkeypatch.setattr(cicd, "_gh_cli_token", lambda: "")
    cicd.refresh_cache()
    stats = cicd.get_overview_stats()
    assert set(stats) == {
        "active_workflows", "total_projects", "test_files", "local_branches",
        "remote_branches", "worktrees", "recent_commits", "github_available",
    }
    assert stats["github_available"] is False
    assert stats["active_workflows"] == 0
    assert stats["local_branches"] == 1


def test_recent_activity_merges_commits_and_runs_newest_first(
    temp_repo: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(cicd, "get_workflow_runs", lambda workflow_id="", per_page=30: [{
        "id": "1", "name": "CI", "status": "completed", "conclusion": "success",
        "branch": "main", "duration_seconds": 10.0,
        "created_at": "2099-01-01T00:00:00+00:00", "html_url": "",
    }])
    cicd.refresh_cache()
    activity = cicd.get_recent_activity(5)
    assert activity[0]["kind"] == "run"
    assert activity[0]["status"] == "success"
    assert any(item["kind"] == "commit" for item in activity)


def test_recent_activity_respects_the_limit(temp_repo: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(cicd, "get_workflow_runs", lambda workflow_id="", per_page=30: [])
    cicd.refresh_cache()
    assert len(cicd.get_recent_activity(1)) <= 1

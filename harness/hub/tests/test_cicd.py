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

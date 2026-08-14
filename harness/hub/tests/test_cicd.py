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

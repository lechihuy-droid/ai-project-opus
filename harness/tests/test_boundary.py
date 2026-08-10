from __future__ import annotations

import sys
from pathlib import Path

import pytest

import run_harness as rh


def _ctx() -> dict[str, str]:
    py = str(Path(sys.executable))
    return {
        "root": str(rh.ROOT),
        "harness": str(rh.HARNESS_DIR),
        "runs": str(rh.RUNS_DIR),
        "run_dir": str(rh.RUNS_DIR),
        "python": py,
        "py311": py,
    }


def test_bare_python_inline_c_is_blocked() -> None:
    # Named bypass from the P0.3 audit: bare "python -c ..." ran unrestricted
    # because the unconditional allowlist (old line 297) plus the inline-code
    # gap let it through the boundary untouched.
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary(["python", "-c", "import shutil"], rh.ROOT, _ctx(), {})


def test_bare_python_module_flag_is_blocked() -> None:
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary(["python", "-m", "http.server"], rh.ROOT, _ctx(), {})


def test_absolute_python_with_script_argument_is_allowed() -> None:
    ctx = _ctx()
    rh._enforce_command_boundary([ctx["python"], "harness/some_script.py"], rh.ROOT, ctx, {})


def test_absolute_python_inline_c_allowed_with_explicit_opt_in() -> None:
    ctx = _ctx()
    rh._enforce_command_boundary(
        [ctx["python"], "-c", "print('ok')"],
        rh.ROOT,
        ctx,
        {"allow_inline_code": True},
    )


def test_shell_launcher_without_allow_shell_is_blocked() -> None:
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary(["bash", "-lc", "ls"], rh.ROOT, _ctx(), {})


def test_looks_like_path_argument_does_not_detect_inline_code() -> None:
    # Documents the real limit of the heuristic: it recognizes path-shaped
    # strings only, never arbitrary code text passed to -c/-m.
    assert rh._looks_like_path_argument("import shutil") is False


def test_absolute_path_argument_outside_root_is_blocked() -> None:
    ctx = _ctx()
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary([ctx["python"], "/etc/passwd"], rh.ROOT, ctx, {})


def test_bare_python_exe_name_is_blocked() -> None:
    # Bare "python.exe" must no longer be auto-allowlisted now that line 297
    # is gone.
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary(["python.exe", "--version"], rh.ROOT, _ctx(), {})

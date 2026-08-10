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
    # gap let it through the boundary untouched. Blocked here because a bare
    # name is never allowlisted anymore (separately from the interpreter-arg
    # gate exercised below).
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


def test_absolute_python_inline_c_without_opt_in_is_blocked() -> None:
    # Exercises the interpreter-arg gate itself (not the executable-identity
    # gate): a fully-trusted, allowlisted interpreter path must still be
    # blocked from "-c" unless allow_inline_code is set.
    ctx = _ctx()
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary([ctx["python"], "-c", "import shutil"], rh.ROOT, ctx, {})


def test_absolute_python_attached_c_flag_is_blocked() -> None:
    # "-cimport shutil" as a single argv token is Python's attached-value
    # short-flag spelling of -c; a set keyed on exact "-c" misses it.
    ctx = _ctx()
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary([ctx["python"], "-cimport shutil"], rh.ROOT, ctx, {})


def test_absolute_python_attached_m_flag_is_blocked() -> None:
    ctx = _ctx()
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary([ctx["python"], "-mhttp.server"], rh.ROOT, ctx, {})


def test_absolute_python_combined_short_flag_cluster_is_blocked() -> None:
    # "-Ic" bundles -I (safe) with -c (inline code) into one token.
    ctx = _ctx()
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary([ctx["python"], "-Ic", "import shutil"], rh.ROOT, ctx, {})


def test_absolute_python_bare_dash_stdin_is_blocked() -> None:
    # "-" tells the interpreter to read the program from stdin.
    ctx = _ctx()
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary([ctx["python"], "-"], rh.ROOT, ctx, {})


def test_absolute_python_safe_flags_are_allowed() -> None:
    # Proves the allowlist isn't too tight: real no-code-injection flags plus
    # a normal script argument must still pass with no special check flags.
    ctx = _ctx()
    rh._enforce_command_boundary(
        [ctx["python"], "-I", "-u", "harness/some_script.py"], rh.ROOT, ctx, {}
    )


def test_allow_system_executable_bare_python_inline_c_is_blocked() -> None:
    # Bare "python" admitted via allow_system_executable still must not skip
    # the interpreter-arg gate -- the gate is keyed off executable identity
    # (name/path), not off which allowlist rule let the executable through.
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary(
            ["python", "-c", "import shutil"],
            rh.ROOT,
            _ctx(),
            {"allow_system_executable": True},
        )


def test_allowed_executables_bare_python_inline_c_is_blocked() -> None:
    # Same as above, but admitted via allowed_executables instead.
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary(
            ["python", "-c", "import shutil"],
            rh.ROOT,
            _ctx(),
            {"allowed_executables": ["python"]},
        )


def test_in_root_interpreter_inline_c_is_blocked() -> None:
    # A python living inside root (e.g. the .ih/ Inspect AI venv documented
    # in harness/README.md) passes _inside_root unconditionally; the gate
    # must still trigger by basename, not only by exact safe_external_paths
    # match, or every in-repo interpreter install would bypass it.
    ctx = _ctx()
    in_root_python = str(rh.ROOT / ".ih" / "bin" / "python")
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary([in_root_python, "-c", "import shutil"], rh.ROOT, ctx, {})


def test_shell_launcher_without_allow_shell_is_blocked() -> None:
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary(["bash", "-lc", "ls"], rh.ROOT, _ctx(), {})


def test_looks_like_path_argument_does_not_detect_inline_code() -> None:
    # Documents the real limit of the heuristic: it recognizes path-shaped
    # strings only, never arbitrary code text passed to -c/-m.
    assert rh._looks_like_path_argument("import shutil") is False


def test_absolute_path_argument_outside_root_is_blocked() -> None:
    # Built from rh.ROOT via pathlib (not a hardcoded POSIX literal like
    # "/etc/passwd") so it is unambiguously outside root and path-like on
    # Windows too, where a bare "/etc/passwd" string has no drive letter and
    # would not even satisfy _looks_like_path_argument's own heuristic.
    ctx = _ctx()
    outside_path = str(rh.ROOT.parent / "outside-boundary-probe.txt")
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary([ctx["python"], outside_path], rh.ROOT, ctx, {})


def test_bare_python_exe_name_is_blocked() -> None:
    # Bare "python.exe" must no longer be auto-allowlisted now that line 297
    # is gone.
    with pytest.raises(rh.BoundaryPolicyError):
        rh._enforce_command_boundary(["python.exe", "--version"], rh.ROOT, _ctx(), {})

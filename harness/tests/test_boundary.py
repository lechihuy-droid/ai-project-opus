from pathlib import Path
import sys

import pytest

from harness.run_harness import (
    BoundaryPolicyError,
    ROOT,
    _enforce_command_boundary,
    _looks_like_path_argument,
)


@pytest.fixture
def context() -> dict[str, str]:
    python = str(Path(sys.executable).resolve())
    return {
        "root": str(ROOT),
        "python": python,
        "py311": python,
    }


def enforce(command: list[str], context: dict[str, str], check: dict | None = None) -> None:
    _enforce_command_boundary(command, ROOT, context, check or {})


def test_python_inline_import_is_rejected(context: dict[str, str]) -> None:
    with pytest.raises(BoundaryPolicyError):
        enforce(["python", "-c", "import shutil"], context)


def test_python_module_execution_is_rejected(context: dict[str, str]) -> None:
    with pytest.raises(BoundaryPolicyError):
        enforce(["python", "-m", "http.server"], context)


def test_allowlisted_python_path_can_run_script(context: dict[str, str]) -> None:
    enforce([context["python"], "harness/some_script.py"], context)


def test_inline_code_requires_explicit_opt_in(context: dict[str, str]) -> None:
    enforce([context["python"], "-c", "import shutil"], context, {"allow_inline_code": True})


def test_shell_launcher_requires_explicit_opt_in(context: dict[str, str]) -> None:
    with pytest.raises(BoundaryPolicyError, match="allow_shell"):
        enforce(["bash", "-lc", "ls"], context)


def test_inline_code_is_not_detected_as_path_argument() -> None:
    assert _looks_like_path_argument("import shutil") is False


def test_absolute_argument_outside_root_is_rejected(context: dict[str, str]) -> None:
    with pytest.raises(BoundaryPolicyError, match="command argument outside project root"):
        enforce([context["python"], r"C:\outside\probe.py"], context)


def test_bare_python_exe_is_rejected(context: dict[str, str]) -> None:
    with pytest.raises(BoundaryPolicyError, match="system executable is not allowlisted"):
        enforce(["python.exe", "harness/some_script.py"], context)

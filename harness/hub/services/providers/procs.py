from __future__ import annotations

import os
import re
import shutil
import subprocess
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
import uuid

import config


_SHIM_TARGET = re.compile(r'"([^"\r\n]+\.(?:cjs|mjs|js|exe))"', re.IGNORECASE)
# npm's shim generator emits either the direct parameter-expansion token
# (older npm: %~dp0) or, once it switched to a two-step CALL :find_dp0 dance
# to dodge Windows' 260-char command-line limit, the plain batch variable
# %dp0% set earlier in the file (current npm/pnpm). Both name "this shim's
# own directory" and both must be expanded before the path is usable.
_DP0_TOKEN = re.compile(r"%~dp0|%dp0%", re.IGNORECASE)


def _batch_shim_target(shim: str) -> list[str] | None:
    """Return the argv prefix that runs the real program behind an npm/pnpm
    Windows batch shim, if — and only if — it can be pinned down unambiguously.

    npm/pnpm generate ``.cmd``/``.bat`` shims for Windows; CreateProcess cannot
    execute those directly. The shim's own body names its real target in a
    quoted path: usually a ``.js``/``.cjs``/``.mjs`` file meant to run under
    Node, but some packages (e.g. compiled CLIs bundled as a native binary)
    point straight at a ``.exe``. Read that path out of the shim text and
    return how to invoke it directly — never through cmd.exe, which would
    reinterpret chat/job arguments as shell syntax.
    """
    path = Path(shim)
    candidates: list[Path] = [path.with_suffix(".js")]
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        content = ""
    for match in _SHIM_TARGET.finditer(content):
        target = match.group(1)
        # A lambda replacement (not a plain string) so backslashes in the
        # Windows path — e.g. "\U..." — are never parsed as regex escapes.
        target = _DP0_TOKEN.sub(lambda _m: str(path.parent) + os.sep, target)
        candidate = Path(target)
        candidates.append(candidate if candidate.is_absolute() else path.parent / candidate)
    for candidate in candidates:
        if not candidate.is_file():
            continue
        if candidate.suffix.lower() == ".exe":
            return [str(candidate.resolve())]
        node_exe = shutil.which("node.exe") or shutil.which("node")
        if node_exe is None:
            continue
        return [node_exe, str(candidate.resolve())]
    return None


def resolve_cmd(cmd: list[str]) -> list[str]:
    """Make cmd[0] runnable without handing untrusted argv to ``cmd.exe``.

    npm/pnpm Windows shims are batch files, which CreateProcess cannot execute
    directly. Resolve their underlying entry point instead of using
    ``cmd /c``: cmd.exe would parse chat/job arguments as shell syntax.

    Raises ``ValueError`` if a ``.cmd``/``.bat`` shim's real target can't be
    pinned down (no recognizable quoted path in its body, or that path
    doesn't exist on disk). That failure is deliberate: silently falling back
    to ``cmd /c <shim>`` would reopen the shell-parsing hole above. Callers
    that probe multiple providers (see services/providers/__init__.py) must
    catch this per provider so one unresolvable shim doesn't take the rest
    down with it.
    """
    if not cmd:
        return cmd
    exe = str(cmd[0])
    resolved = shutil.which(exe) or exe
    if os.name == "nt" and not resolved.lower().endswith((".cmd", ".bat", ".exe")):
        for ext in (".cmd", ".exe", ".bat"):
            if os.path.exists(resolved + ext):
                resolved = resolved + ext
                break
    if resolved.lower().endswith((".cmd", ".bat")):
        target = _batch_shim_target(resolved)
        if target is None:
            raise ValueError(f"Cannot safely resolve entry point for batch shim: {resolved}")
        return [*target, *cmd[1:]]
    return [resolved, *cmd[1:]]


class BusyError(RuntimeError):
    """Raised when the concurrent CLI process cap (config.MAX_CONCURRENT_CLI) is reached."""


@dataclass
class ProcEntry:
    proc_id: str
    process: subprocess.Popen[str]
    provider: str
    timeout: float
    started_monotonic: float = field(default_factory=time.monotonic)
    timed_out: bool = False


class ProcessRegistry:
    """Tracks CLI subprocesses spawned by provider adapters.

    Responsibilities: enforce max concurrent CLI processes, kill processes that
    exceed their timeout, and provide a kill_all() for FastAPI lifespan shutdown
    (NFR-104). Pattern mirrors services/trigger.py and services/gitjobs.py
    (shell=False, text-mode pipes, daemon watcher thread).
    """

    def __init__(self) -> None:
        self._procs: dict[str, ProcEntry] = {}
        self._lock = threading.Lock()

    def _live_count_locked(self) -> int:
        return sum(1 for entry in self._procs.values() if entry.process.poll() is None)

    def count_live(self) -> int:
        with self._lock:
            return self._live_count_locked()

    def spawn(
        self,
        cmd: list[str],
        cwd: Path | str | None = None,
        env: dict[str, str] | None = None,
        timeout: float | None = None,
        provider: str = "",
        stdin: int | None = subprocess.DEVNULL,
    ) -> str:
        resolved_timeout = float(timeout if timeout is not None else getattr(config, "CHAT_CLI_TIMEOUT", 300))
        max_concurrent = int(getattr(config, "MAX_CONCURRENT_CLI", 3))
        with self._lock:
            if self._live_count_locked() >= max_concurrent:
                raise BusyError(f"max concurrent CLI processes reached ({max_concurrent})")
            process = subprocess.Popen(
                resolve_cmd(cmd),
                cwd=str(cwd) if cwd else None,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=stdin,
                text=True,
                encoding="utf-8",
                errors="replace",
                bufsize=1,
                shell=False,
                env=env,
            )
            proc_id = uuid.uuid4().hex
            entry = ProcEntry(proc_id=proc_id, process=process, provider=provider, timeout=resolved_timeout)
            self._procs[proc_id] = entry
        threading.Thread(target=self._watch, args=(entry,), daemon=True).start()
        return proc_id

    def _watch(self, entry: ProcEntry) -> None:
        try:
            entry.process.wait(timeout=entry.timeout)
        except subprocess.TimeoutExpired:
            entry.timed_out = True
            try:
                entry.process.kill()
            except OSError:
                pass
            try:
                entry.process.wait(timeout=5)
            except Exception:
                pass

    def get(self, proc_id: str) -> subprocess.Popen[str] | None:
        with self._lock:
            entry = self._procs.get(proc_id)
        return entry.process if entry else None

    def is_timed_out(self, proc_id: str) -> bool:
        with self._lock:
            entry = self._procs.get(proc_id)
        return bool(entry and entry.timed_out)

    def unregister(self, proc_id: str) -> None:
        with self._lock:
            self._procs.pop(proc_id, None)

    def kill_all(self) -> None:
        with self._lock:
            entries = list(self._procs.values())
            self._procs.clear()
        for entry in entries:
            try:
                entry.process.kill()
            except OSError:
                pass


registry = ProcessRegistry()


def kill_all() -> None:
    """Module-level convenience wrapper for FastAPI lifespan shutdown (`procs.kill_all()`)."""
    registry.kill_all()

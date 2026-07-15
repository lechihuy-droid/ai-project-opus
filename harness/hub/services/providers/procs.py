from __future__ import annotations

import subprocess
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
import uuid

import config


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
                cmd,
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

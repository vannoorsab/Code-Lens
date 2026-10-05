"""CodeLens RunFix - Sandboxed Execution Engine.

Executes commands in an isolated workspace with:
- Strict timeouts and resource safety limits
- Real-time line-by-line stdout & stderr capturing
- Process lifecycle tracking and graceful cancellation
- Environment variable sanitization (preventing secret leakage)
"""

from __future__ import annotations

import asyncio
import os
import platform
import signal
import subprocess
import time
import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from pydantic import BaseModel, Field

from app.core.config import settings


@dataclass
class LogEntry:
    timestamp: float
    stream: str  # "stdout", "stderr", "system"
    text: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "stream": self.stream,
            "text": self.text,
            "formatted_time": time.strftime("%H:%M:%S", time.localtime(self.timestamp)),
        }


class ExecutionResult(BaseModel):
    execution_id: str
    command: str
    workspace_dir: str
    exit_code: int | None = None
    duration_seconds: float = 0.0
    stdout: str = ""
    stderr: str = ""
    all_logs: list[dict[str, Any]] = Field(default_factory=list)
    success: bool = False
    timed_out: bool = False
    error_summary: str | None = None


class SandboxSession:
    def __init__(self, workspace_dir: str | Path, timeout_seconds: int | None = None):
        self.workspace_dir = Path(workspace_dir).resolve()
        self.timeout_seconds = (
            settings.RUNFIX_SANDBOX_TIMEOUT_SECONDS if timeout_seconds is None else timeout_seconds
        )
        if self.timeout_seconds < 1:
            raise ValueError("timeout_seconds must be positive.")
        self.execution_id = str(uuid.uuid4())
        self.logs: list[LogEntry] = []
        self.process: asyncio.subprocess.Process | None = None
        self.is_running = False
        self._stopped_by_user = False

    def sanitize_env(self) -> dict[str, str]:
        """Sanitizes environment variables to prevent leaking host secrets to executed child processes."""
        safe_env = os.environ.copy()
        # Strip sensitive API keys & credentials
        blacklist_prefixes = [
            "AWS_", "ANTHROPIC_", "OPENAI_", "GROQ_", "OPENROUTER_",
            "GITHUB_TOKEN", "GH_TOKEN", "DATABASE_URL", "SECRET", "PASSWORD", "PRIVATE_KEY"
        ]
        for key in list(safe_env.keys()):
            upper_key = key.upper()
            if any(upper_key.startswith(b) or b in upper_key for b in blacklist_prefixes):
                safe_env.pop(key, None)

        safe_env["NODE_ENV"] = "development"
        safe_env["CI"] = "false"
        safe_env["FORCE_COLOR"] = "1"
        return safe_env

    async def run_command_stream(
        self,
        command: str,
        env_overrides: dict[str, str] | None = None
    ) -> AsyncIterator[LogEntry]:
        """Executes command asynchronously and yields LogEntry objects in real time."""
        self.is_running = True
        self._stopped_by_user = False
        start_time = time.time()

        env = self.sanitize_env()
        if env_overrides:
            env.update(env_overrides)

        # Emit system header log
        header_log = LogEntry(
            timestamp=start_time,
            stream="system",
            text=f"$ {command} [workspace: {self.workspace_dir.name}]"
        )
        self.logs.append(header_log)
        yield header_log

        is_windows = platform.system() == "Windows"
        shell_cmd = command if is_windows else ["/bin/bash", "-c", command]

        try:
            if is_windows:
                proc = await asyncio.create_subprocess_shell(
                    command,
                    cwd=str(self.workspace_dir),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=env,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
                )
            else:
                proc = await asyncio.create_subprocess_exec(
                    "/bin/bash", "-c", command,
                    cwd=str(self.workspace_dir),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=env,
                    start_new_session=True,
                )
            self.process = proc

            async def read_stream(stream: asyncio.StreamReader, stream_name: str) -> list[LogEntry]:
                entries: list[LogEntry] = []
                while True:
                    line_bytes = await stream.readline()
                    if not line_bytes:
                        break
                    line = line_bytes.decode("utf-8", errors="replace").rstrip("\r\n")
                    entry = LogEntry(timestamp=time.time(), stream=stream_name, text=line)
                    entries.append(entry)
                return entries

            # We use an async queue to interleave stdout and stderr as they arrive
            queue: asyncio.Queue[LogEntry | None] = asyncio.Queue()

            async def pump_reader(stream: asyncio.StreamReader, stream_name: str):
                try:
                    while True:
                        line_bytes = await stream.readline()
                        if not line_bytes:
                            break
                        line = line_bytes.decode("utf-8", errors="replace").rstrip("\r\n")
                        entry = LogEntry(timestamp=time.time(), stream=stream_name, text=line)
                        self.logs.append(entry)
                        await queue.put(entry)
                except Exception as err:
                    err_entry = LogEntry(timestamp=time.time(), stream="system", text=f"Stream read error: {err}")
                    self.logs.append(err_entry)
                    await queue.put(err_entry)

            stdout_task = asyncio.create_task(pump_reader(proc.stdout, "stdout"))
            stderr_task = asyncio.create_task(pump_reader(proc.stderr, "stderr"))

            async def wait_process():
                await proc.wait()
                await asyncio.gather(stdout_task, stderr_task)
                await queue.put(None)  # Sentinel to finish queue

            waiter_task = asyncio.create_task(wait_process())

            timed_out = False
            deadline = start_time + self.timeout_seconds

            while True:
                time_left = max(0.1, deadline - time.time())
                try:
                    entry = await asyncio.wait_for(queue.get(), timeout=time_left)
                    if entry is None:
                        break
                    yield entry
                except asyncio.TimeoutError:
                    timed_out = True
                    break

            if timed_out and proc.returncode is None:
                await self._terminate_process_tree(force=True)
                timeout_entry = LogEntry(
                    timestamp=time.time(),
                    stream="system",
                    text=f"Process exceeded timeout limit ({self.timeout_seconds}s) and was terminated."
                )
                self.logs.append(timeout_entry)
                yield timeout_entry

            await waiter_task

            exit_code = proc.returncode if proc.returncode is not None else -1
            end_log = LogEntry(
                timestamp=time.time(),
                stream="system",
                text=f"Process exited with code {exit_code} (took {round(time.time() - start_time, 2)}s)"
            )
            self.logs.append(end_log)
            yield end_log

        except Exception as err:
            err_log = LogEntry(
                timestamp=time.time(),
                stream="stderr",
                text=f"Execution failed to launch: {str(err)}"
            )
            self.logs.append(err_log)
            yield err_log

        finally:
            if self.process and self.process.returncode is None:
                await self._terminate_process_tree(force=True)
            self.is_running = False

    async def _terminate_process_tree(self, force: bool) -> None:
        process = self.process
        if process is None or process.returncode is not None:
            return

        if platform.system() == "Windows":
            taskkill = await asyncio.create_subprocess_exec(
                "taskkill",
                "/PID",
                str(process.pid),
                "/T",
                "/F",
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            await taskkill.wait()
        else:
            try:
                os.killpg(process.pid, signal.SIGKILL if force else signal.SIGTERM)
            except ProcessLookupError:
                pass

        if process.returncode is None:
            try:
                await asyncio.wait_for(process.wait(), timeout=2)
            except asyncio.TimeoutError:
                if platform.system() == "Windows":
                    process.kill()
                else:
                    try:
                        os.killpg(process.pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                await process.wait()

    async def stop(self):
        """Terminates the running process gracefully, or forcefully kills if stubborn."""
        self._stopped_by_user = True
        await self._terminate_process_tree(force=True)
        self.is_running = False


class SandboxManager:
    """Manages active sandbox execution sessions across the application."""
    def __init__(self):
        self._active_sessions: dict[str, SandboxSession] = {}

    def create_session(self, workspace_dir: str | Path, timeout_seconds: int | None = None) -> SandboxSession:
        session = SandboxSession(workspace_dir, timeout_seconds=timeout_seconds)
        self._active_sessions[session.execution_id] = session
        return session

    def get_session(self, execution_id: str) -> SandboxSession | None:
        return self._active_sessions.get(execution_id)

    def remove_session(self, execution_id: str) -> None:
        self._active_sessions.pop(execution_id, None)

    async def stop_session(self, execution_id: str) -> bool:
        session = self._active_sessions.get(execution_id)
        if session:
            await session.stop()
            return True
        return False


sandbox_manager = SandboxManager()

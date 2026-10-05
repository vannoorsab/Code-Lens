"""CodeLens RunFix - Orchestrator Agent & Autonomous State Machine.

Coordinates the multi-agent workflow:
Project Detection -> Sandboxed Run -> Error Capture -> AI Diagnosis -> Patch Generation
-> Patch Application -> Verification -> Test Generation -> Pull Request Readiness.
"""

from __future__ import annotations

import time
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any
from pydantic import BaseModel, Field

from app.core.config import settings
from app.runfix.debug_agent import DiagnosisReport, debug_agent
from app.runfix.detector import DetectedProject, detect_project
from app.runfix.error_parser import parse_execution_errors
from app.runfix.fix_agent import ProposedFix, fix_agent
from app.runfix.github_workflow import ChangeSummary, github_workflow
from app.runfix.sandbox import sandbox_manager
from app.runfix.test_agent import TestSuiteResult, test_agent


class TimelineEvent(BaseModel):
    timestamp: float
    time_formatted: str
    phase: str  # "DETECT", "RUN", "FAIL", "DIAGNOSE", "FIX", "VERIFY", "TEST", "SUCCESS"
    icon: str   # "✓", "▶", "✗", "◉", "⚡", "🛡️"
    title: str
    detail: str | None = None


class RunFixState(BaseModel):
    state: str = "IDLE"  # IDLE, ANALYZING, PREPARING, RUNNING, FAILED, DIAGNOSING, FIX_PROPOSED, APPLYING_FIX, VERIFYING, TESTING, SUCCESS
    iteration: int = 0
    max_iterations: int = 5
    project: DetectedProject | None = None
    latest_diagnosis: DiagnosisReport | None = None
    latest_fix: ProposedFix | None = None
    latest_tests: TestSuiteResult | None = None
    change_summary: ChangeSummary | None = None
    timeline: list[TimelineEvent] = Field(default_factory=list)
    is_autonomous: bool = False
    is_repaired: bool = False
    error_message: str | None = None


class Orchestrator:
    """Master controller for autonomous project repair and verification."""

    def __init__(self):
        self.state = RunFixState()

    def add_timeline_event(self, phase: str, icon: str, title: str, detail: str | None = None) -> TimelineEvent:
        now = time.time()
        event = TimelineEvent(
            timestamp=now,
            time_formatted=time.strftime("%H:%M:%S", time.localtime(now)),
            phase=phase,
            icon=icon,
            title=title,
            detail=detail
        )
        self.state.timeline.append(event)
        return event

    async def run_autonomous_repair_stream(
        self,
        workspace_dir: str | Path,
        mode: str = "autonomous",  # "autonomous" or "manual"
        command_override: str | None = None,
    ) -> AsyncIterator[dict[str, Any]]:
        """Streams real-time state transitions and log events throughout the repair lifecycle."""
        workspace = Path(workspace_dir).resolve()
        self.state = RunFixState(is_autonomous=(mode == "autonomous"), max_iterations=settings.RUNFIX_MAX_ITERATIONS)

        # ── 1. PROJECT DETECTION PHASE ─────────────────────────────────────────
        self.state.state = "ANALYZING"
        evt = self.add_timeline_event("DETECT", "✓", f"Inspecting repository structure at {workspace.name}")
        yield {"type": "timeline", "event": evt.model_dump(), "state": self.state.model_dump()}

        project = detect_project(workspace)
        self.state.project = project
        evt = self.add_timeline_event("DETECT", "✓", f"Detected {project.framework} ({project.language}) - {project.package_manager}")
        yield {"type": "timeline", "event": evt.model_dump(), "state": self.state.model_dump()}

        cmd = command_override or project.run_command or project.build_command
        iteration = 0
        verified = False

        while iteration < self.state.max_iterations:
            iteration += 1
            self.state.iteration = iteration

            # ── 2. EXECUTION PHASE ─────────────────────────────────────────────
            self.state.state = "RUNNING"
            evt = self.add_timeline_event("RUN", "▶", f"Executing target command: '{cmd}' (Attempt {iteration})")
            yield {"type": "timeline", "event": evt.model_dump(), "state": self.state.model_dump()}

            session = sandbox_manager.create_session(
                workspace,
                timeout_seconds=settings.RUNFIX_SANDBOX_TIMEOUT_SECONDS,
            )
            stdout_acc = []
            stderr_acc = []

            try:
                async for log in session.run_command_stream(cmd):
                    if log.stream == "stdout":
                        stdout_acc.append(log.text)
                    elif log.stream == "stderr":
                        stderr_acc.append(log.text)
                    yield {"type": "log", "log": log.to_dict()}
            finally:
                sandbox_manager.remove_session(session.execution_id)

            # Determine exit status
            exit_code = session.process.returncode if session.process else -1
            full_stdout = "\n".join(stdout_acc)
            full_stderr = "\n".join(stderr_acc)
            parsed_errors = parse_execution_errors(full_stdout, full_stderr)

            if exit_code == 0 and not parsed_errors:
                # Execution Succeeded!
                verified = True
                self.state.state = "VERIFYING"
                evt = self.add_timeline_event("VERIFY", "✓", "Build and execution finished cleanly with exit code 0")
                yield {"type": "timeline", "event": evt.model_dump(), "state": self.state.model_dump()}
                break

            # ── 3. DIAGNOSIS PHASE ─────────────────────────────────────────────
            self.state.state = "DIAGNOSING"
            evt = self.add_timeline_event("FAIL", "✗", f"Execution failed (exit code {exit_code}). Debug Agent analyzing...")
            yield {"type": "timeline", "event": evt.model_dump(), "state": self.state.model_dump()}

            diagnosis = debug_agent.diagnose(project, cmd, exit_code, full_stdout, full_stderr, workspace)
            self.state.latest_diagnosis = diagnosis

            evt = self.add_timeline_event("DIAGNOSE", "✓", f"Root cause identified: {diagnosis.root_cause} ({diagnosis.confidence}% confidence)")
            yield {"type": "timeline", "event": evt.model_dump(), "diagnosis": diagnosis.model_dump(), "state": self.state.model_dump()}

            # ── 4. FIX GENERATION PHASE ────────────────────────────────────────
            self.state.state = "FIX_PROPOSED"
            evt = self.add_timeline_event("FIX", "◉", "Fix Agent synthesizing minimal surgical patch...")
            yield {"type": "timeline", "event": evt.model_dump(), "state": self.state.model_dump()}

            fix = fix_agent.propose_fix(project, diagnosis, workspace)
            self.state.latest_fix = fix

            evt = self.add_timeline_event("FIX", "⚡", f"Proposed minimal diff for {fix.affected_file}")
            yield {"type": "timeline", "event": evt.model_dump(), "fix": fix.model_dump(), "state": self.state.model_dump()}

            if mode == "manual":
                # Pause and yield to user for approval
                yield {"type": "approval_required", "fix": fix.model_dump(), "state": self.state.model_dump()}
                return

            # ── 5. APPLY FIX (AUTONOMOUS) ──────────────────────────────────────
            self.state.state = "APPLYING_FIX"
            applied = fix_agent.apply_fix(fix, workspace)
            if applied:
                evt = self.add_timeline_event("FIX", "✓", f"Successfully applied patch to {fix.affected_file}")
            else:
                evt = self.add_timeline_event("FIX", "✗", f"Failed to write patch to {fix.affected_file}")
            yield {"type": "timeline", "event": evt.model_dump(), "state": self.state.model_dump()}
            if not applied:
                self.state.state = "FAILED"
                self.state.error_message = "No applicable fix was available; manual review is required."
                break

            # Continue to next verification loop iteration

        # ── 6. TEST & VERIFICATION PHASE ───────────────────────────────────────
        if not verified:
            if self.state.state != "FAILED":
                self.state.state = "FAILED"
                self.state.error_message = f"The project did not pass verification after {iteration} attempt(s)."
            evt = self.add_timeline_event("FAIL", "✗", self.state.error_message or "Verification failed")
            yield {
                "type": "timeline",
                "event": evt.model_dump(),
                "state": self.state.model_dump(),
                "done": True,
            }
            return

        self.state.state = "TESTING"
        evt = self.add_timeline_event("TEST", "◉", "Generating automated regression test suite...")
        yield {"type": "timeline", "event": evt.model_dump(), "state": self.state.model_dump()}

        if self.state.latest_fix:
            tests = test_agent.generate_tests(project, self.state.latest_fix, workspace)
            self.state.latest_tests = tests
            evt = self.add_timeline_event(
                "TEST",
                "◉",
                f"Generated {tests.total_tests} pending test case(s) for {tests.framework}; tests were not executed.",
            )
            yield {"type": "timeline", "event": evt.model_dump(), "tests": tests.model_dump(), "state": self.state.model_dump()}

            # Prepare PR Change Summary
            summary = github_workflow.create_change_summary(project.name, self.state.latest_fix, tests)
            self.state.change_summary = summary

        self.state.state = "SUCCESS"
        self.state.is_repaired = bool(
            verified and self.state.latest_fix and self.state.latest_fix.status == "APPLIED"
        )
        evt = self.add_timeline_event("SUCCESS", "✓", "The selected project command completed successfully.")
        yield {"type": "timeline", "event": evt.model_dump(), "state": self.state.model_dump(), "done": True}


orchestrator = Orchestrator()

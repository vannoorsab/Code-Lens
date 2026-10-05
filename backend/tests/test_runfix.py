from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.api.runfix_routes import ApplyFixRequest, RunRequest, _workspace_path, api_apply_fix
from app.runfix.debug_agent import DiagnosisReport
from app.runfix.detector import DetectedProject
from app.runfix.error_parser import ParsedError
from app.runfix.fix_agent import FixAgent, ProposedFix
from app.runfix.github_workflow import GitHubWorkflow
from app.runfix.orchestrator import Orchestrator
from app.runfix.sandbox import SandboxSession, sandbox_manager
from app.runfix.test_agent import TestAgent as RunFixTestAgent


def test_fix_agent_updates_only_a_real_relative_import(tmp_path: Path) -> None:
    source = tmp_path / "src" / "api.ts"
    (tmp_path / "src" / "config").mkdir(parents=True)
    (tmp_path / "src" / "config" / "index.ts").write_text("export default {};\n")
    source.write_text('import config from "./config";\n')
    diagnosis = DiagnosisReport(
        root_cause="src/api.ts imports './config', but the file or package does not exist.",
        affected_file="src/api.ts",
        explanation="Module resolution failed.",
        fix_strategy="Use the index module.",
        parsed_errors=[
            ParsedError(
                error_type="MODULE_NOT_FOUND",
                symbol="./config",
                message="Missing module",
            )
        ],
    )
    agent = FixAgent()

    fix = agent.propose_fix(DetectedProject(language="TypeScript"), diagnosis, tmp_path)

    assert fix.full_fixed_content == 'import config from "./config/index";\n'
    assert agent.apply_fix(fix, tmp_path)
    assert source.read_text() == fix.full_fixed_content


def test_apply_fix_rejects_paths_outside_workspace(tmp_path: Path) -> None:
    outside = tmp_path.parent / "outside-runfix-test.txt"
    fix = ProposedFix(
        fix_id="outside",
        affected_file="../outside-runfix-test.txt",
        explanation="must not write outside the workspace",
        diff="+blocked",
        full_fixed_content="blocked",
    )

    with pytest.raises(ValueError, match="inside the workspace"):
        FixAgent().apply_fix(fix, tmp_path)
    assert not outside.exists()


def test_unrecognized_diagnosis_is_not_reported_as_an_applicable_fix(tmp_path: Path) -> None:
    source = tmp_path / "main.py"
    source.write_text("print('original')\n")
    diagnosis = DiagnosisReport(
        root_cause="Unknown runtime failure.",
        affected_file="main.py",
        explanation="No structured cause was found.",
        fix_strategy="Review the logs.",
    )
    agent = FixAgent()

    fix = agent.propose_fix(DetectedProject(language="Python"), diagnosis, tmp_path)

    assert fix.action == "REVIEW"
    assert not fix.diff
    assert fix.full_fixed_content is None
    assert not agent.apply_fix(fix, tmp_path)
    assert source.read_text() == "print('original')\n"


def test_generated_tests_are_pending_until_they_are_run() -> None:
    suite = RunFixTestAgent().generate_tests(
        DetectedProject(language="Python", test_framework="PyTest"),
        ProposedFix(
            fix_id="change",
            affected_file="app/service.py",
            explanation="Update service.",
            diff="",
        ),
    )

    assert suite.total_tests == 1
    assert suite.passed_tests == 0
    assert not suite.is_verified
    assert suite.test_cases[0].status == "PENDING"
    assert "assert True" not in suite.test_code


def test_unexecuted_fix_is_not_reported_as_verified_or_a_created_pr() -> None:
    fix = ProposedFix(
        fix_id="review",
        affected_file="service.py",
        action="REVIEW",
        explanation="Manual review required.",
        diff="",
        status="REVIEW",
    )
    summary = GitHubWorkflow(token="unused").create_change_summary("owner/repo", fix)

    assert summary.pr_url is None
    assert summary.files_changed == 0
    assert summary.lines_added == 0
    assert summary.build_status != "SUCCESS"
    assert summary.tests_passed == 0
    assert summary.security_verdict == "Not assessed"


def test_workspace_must_be_a_directory(tmp_path: Path) -> None:
    file_path = tmp_path / "not-a-directory"
    file_path.write_text("file")

    with pytest.raises(HTTPException) as exc:
        _workspace_path(str(file_path))
    assert exc.value.status_code == 400


def test_run_request_rejects_empty_commands_and_unbounded_timeouts() -> None:
    with pytest.raises(ValueError):
        RunRequest(command="")
    with pytest.raises(ValueError):
        RunRequest(command="python app.py", timeout_seconds=3601)


def test_applying_review_only_fix_returns_unprocessable(tmp_path: Path) -> None:
    fix = ProposedFix(
        fix_id="review",
        affected_file="main.py",
        action="REVIEW",
        explanation="Manual review required.",
        diff="",
        status="REVIEW",
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(api_apply_fix(ApplyFixRequest(fix=fix, workspace_path=str(tmp_path))))
    assert exc.value.status_code == 422


def test_sandbox_streams_a_completed_command(tmp_path: Path) -> None:
    command = f'"{sys.executable}" -c "print(\'sandbox-ok\')"'

    async def collect_logs():
        session = SandboxSession(tmp_path)
        logs = [entry async for entry in session.run_command_stream(command)]
        return session, logs

    session, logs = asyncio.run(collect_logs())

    assert session.process is not None
    assert session.process.returncode == 0
    assert any(entry.stream == "stdout" and entry.text == "sandbox-ok" for entry in logs)


def test_failed_repair_loop_ends_in_failed_state_and_releases_session(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    (tmp_path / "package.json").write_text('{"name":"test","scripts":{"run":"run"}}')
    monkeypatch.setattr("app.runfix.orchestrator.settings.RUNFIX_MAX_ITERATIONS", 1)
    command = f'"{sys.executable}" -c "raise SystemExit(1)"'
    runner = Orchestrator()
    sessions_before = set(sandbox_manager._active_sessions)

    events = asyncio.run(
        _collect_events(runner.run_autonomous_repair_stream(tmp_path, command_override=command))
    )

    assert events[-1]["done"] is True
    assert events[-1]["state"]["state"] == "FAILED"
    assert events[-1]["state"]["is_repaired"] is False
    assert set(sandbox_manager._active_sessions) == sessions_before


async def _collect_events(stream) -> list[dict]:
    return [event async for event in stream]


def test_sandbox_rejects_nonpositive_timeout(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="must be positive"):
        SandboxSession(tmp_path, timeout_seconds=0)

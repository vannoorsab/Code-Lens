"""CodeLens RunFix - API Endpoints.

Provides REST and SSE endpoints for:
- Project detection
- Sandboxed execution & log streaming
- AI diagnosis & patch generation
- Verification & test generation
- Autonomous multi-agent repair loop
- GitHub PR workflows & Demo sample setups
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.config import settings
from app.runfix.debug_agent import DiagnosisReport, debug_agent
from app.runfix.demo_samples import setup_broken_python_demo, setup_broken_react_demo
from app.runfix.detector import DetectedProject, detect_project
from app.runfix.fix_agent import ProposedFix, fix_agent
from app.runfix.github_workflow import ChangeSummary, github_workflow
from app.runfix.orchestrator import Orchestrator
from app.runfix.sandbox import sandbox_manager
from app.runfix.test_agent import TestSuiteResult, test_agent

router = APIRouter(prefix="/api/runfix", tags=["RunFix Autonomous Engine"])


def _workspace_path(raw_path: str) -> Path:
    path = Path(raw_path).expanduser().resolve()
    if not path.exists():
        raise HTTPException(status_code=404, detail="Workspace directory not found.")
    if not path.is_dir():
        raise HTTPException(status_code=400, detail="Workspace path must be a directory.")
    return path


class DetectRequest(BaseModel):
    workspace_path: str = Field(default=".", min_length=1, max_length=4096)


class RunRequest(BaseModel):
    command: str = Field(min_length=1, max_length=4096)
    workspace_path: str = Field(default=".", min_length=1, max_length=4096)
    timeout_seconds: int = Field(
        default=settings.RUNFIX_SANDBOX_TIMEOUT_SECONDS,
        ge=1,
        le=3600,
    )


class DiagnoseRequest(BaseModel):
    command: str
    exit_code: int | None = 1
    stdout: str = ""
    stderr: str = ""
    workspace_path: str = Field(default=".", min_length=1, max_length=4096)


class FixRequest(BaseModel):
    diagnosis: DiagnosisReport
    workspace_path: str = Field(default=".", min_length=1, max_length=4096)


class ApplyFixRequest(BaseModel):
    fix: ProposedFix
    workspace_path: str = Field(default=".", min_length=1, max_length=4096)


class GenerateTestsRequest(BaseModel):
    fix: ProposedFix
    workspace_path: str = "."


class AutoRepairRequest(BaseModel):
    workspace_path: str = Field(default=".", min_length=1, max_length=4096)
    mode: Literal["autonomous", "manual"] = "autonomous"
    command: str | None = Field(default=None, max_length=4096)


class DemoSetupRequest(BaseModel):
    project_type: Literal["react", "python"] = "react"


@router.post("/detect", response_model=DetectedProject)
async def api_detect_project(req: DetectRequest):
    """Inspects a repository path and extracts project metadata, package manager, and run scripts."""
    path = _workspace_path(req.workspace_path)
    return detect_project(path)


@router.post("/run")
async def api_run_command_stream(req: RunRequest):
    """Executes a command inside the sandbox and streams stdout/stderr via Server-Sent Events (SSE)."""
    path = _workspace_path(req.workspace_path)

    session = sandbox_manager.create_session(path, timeout_seconds=req.timeout_seconds)

    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'session_created', 'execution_id': session.execution_id})}\n\n"
            async for log_entry in session.run_command_stream(req.command):
                yield f"data: {json.dumps({'type': 'log', 'log': log_entry.to_dict()})}\n\n"
            yield f"data: {json.dumps({'type': 'complete', 'execution_id': session.execution_id})}\n\n"
        finally:
            sandbox_manager.remove_session(session.execution_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/stop")
async def api_stop_execution(execution_id: str = Query(...)):
    """Terminates a running sandbox execution process."""
    stopped = await sandbox_manager.stop_session(execution_id)
    return {"stopped": stopped, "execution_id": execution_id}


@router.post("/diagnose", response_model=DiagnosisReport)
async def api_diagnose(req: DiagnoseRequest):
    """Runs the AI Diagnosis Agent on captured execution logs and source context."""
    path = _workspace_path(req.workspace_path)
    project = detect_project(path)
    return debug_agent.diagnose(project, req.command, req.exit_code, req.stdout, req.stderr, path)


@router.post("/fix", response_model=ProposedFix)
async def api_propose_fix(req: FixRequest):
    """Generates a minimal surgical code patch for the diagnosed failure."""
    path = _workspace_path(req.workspace_path)
    project = detect_project(path)
    return fix_agent.propose_fix(project, req.diagnosis, path)


@router.post("/apply")
async def api_apply_fix(req: ApplyFixRequest):
    """Applies a proposed patch to the repository file on disk."""
    path = _workspace_path(req.workspace_path)
    try:
        success = fix_agent.apply_fix(req.fix, path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not success:
        raise HTTPException(status_code=422, detail="This proposed fix does not contain an applicable patch.")
    return {"success": success, "file": req.fix.affected_file}


@router.post("/tests", response_model=TestSuiteResult)
async def api_generate_tests(req: GenerateTestsRequest):
    """Synthesizes an automated regression test suite in Vitest/Jest/PyTest."""
    path = _workspace_path(req.workspace_path)
    project = detect_project(path)
    try:
        return test_agent.generate_tests(project, req.fix, path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/auto")
async def api_autonomous_repair_stream(req: AutoRepairRequest):
    """Launches the complete Autonomous AI Debugging & Repair Loop with live SSE streaming."""
    path = _workspace_path(req.workspace_path)

    async def sse_stream():
        runner = Orchestrator()
        async for event_data in runner.run_autonomous_repair_stream(
            path,
            mode=req.mode,
            command_override=req.command,
        ):
            yield f"data: {json.dumps(event_data)}\n\n"

    return StreamingResponse(
        sse_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/demo/setup")
async def api_setup_demo(req: DemoSetupRequest):
    """Instantly creates a sandbox workspace with a realistic broken project for interactive demo."""
    temp_dir = Path(tempfile.mkdtemp(prefix="codelens-demo-"))
    if req.project_type == "python":
        workspace = setup_broken_python_demo(temp_dir)
    else:
        workspace = setup_broken_react_demo(temp_dir)

    project_info = detect_project(workspace)
    return {
        "workspace_path": str(workspace),
        "project": project_info,
        "sample_type": req.project_type,
        "message": f"Successfully set up broken {req.project_type.capitalize()} demo sandbox."
    }


@router.post("/github/pr", response_model=ChangeSummary)
async def api_create_github_pr(repo_name: str, fix: ProposedFix, tests: TestSuiteResult | None = None):
    """Generates PR change summary and optionally submits to GitHub."""
    return github_workflow.create_change_summary(repo_name, fix, tests)

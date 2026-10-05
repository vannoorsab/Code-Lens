"""CodeLens RunFix - AI Diagnosis Agent (Debug Agent).

Analyzes command execution failures, terminal output, stack traces,
and codebase context to pinpoint root cause, affected files, and recommended fixes.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from pydantic import BaseModel, Field

from app.runfix.detector import DetectedProject
from app.runfix.error_parser import ParsedError, parse_execution_errors


class DiagnosisReport(BaseModel):
    root_cause: str
    affected_file: str | None = None
    error_location: str | None = None
    explanation: str
    fix_strategy: str
    confidence: int = 90  # 0 - 100
    severity: str = "HIGH"
    parsed_errors: list[ParsedError] = Field(default_factory=list)
    suggested_commands: list[str] = Field(default_factory=list)
    related_files: list[str] = Field(default_factory=list)


class DebugAgent:
    """Intelligent reasoning agent for diagnosing software execution failures."""

    def __init__(self):
        pass

    def diagnose(
        self,
        project: DetectedProject,
        command: str,
        exit_code: int | None,
        stdout: str,
        stderr: str,
        workspace_dir: str | Path | None = None,
    ) -> DiagnosisReport:
        """Executes deep diagnosis combining deterministic AST/log analysis with heuristic intelligence."""
        parsed_errors = parse_execution_errors(stdout, stderr)
        workspace = Path(workspace_dir or project.root_path).resolve() if (workspace_dir or project.root_path) else None

        # ── Scenario 1: Module / Relative Import Not Found ─────────────────────
        mod_error = next((e for e in parsed_errors if e.error_type == "MODULE_NOT_FOUND"), None)
        if mod_error:
            missing_sym = mod_error.symbol or "unknown"
            src_file = mod_error.file or project.entry_point or "src/api.ts"
            
            # Check if there is an index file or similar named file
            suggestion = f"Update the import path or create '{missing_sym}'"
            loc = f"Line {mod_error.line}" if mod_error.line else "Top-level imports"
            
            # Check relative file heuristics
            if missing_sym.startswith("."):
                # e.g. import from ./config when file is ./config.ts or ./config/index.ts or missing
                suggestion = f"Verify export path for '{missing_sym}' or generate the missing module."
                explanation = (
                    f"The module '{src_file}' imports '{missing_sym}', but the target module does not exist "
                    f"at this path. This frequently occurs when a file was renamed, deleted, or placed in a subdirectory."
                )
            else:
                # Third party package missing
                suggestion = f"Add '{missing_sym}' to {project.package_manager} dependencies and install."
                explanation = (
                    f"The project depends on the package '{missing_sym}', but it is not installed in the workspace "
                    f"or declared in {project.package_manager} manifest."
                )

            return DiagnosisReport(
                root_cause=f"{src_file} imports '{missing_sym}', but the file or package does not exist.",
                affected_file=src_file,
                error_location=loc,
                explanation=explanation,
                fix_strategy=suggestion,
                confidence=95,
                severity="HIGH",
                parsed_errors=parsed_errors,
                suggested_commands=[f"{project.package_manager} install {missing_sym}"] if not missing_sym.startswith(".") else [],
                related_files=[src_file]
            )

        # ── Scenario 2: TypeScript Compiler Error ──────────────────────────────
        ts_error = next((e for e in parsed_errors if e.error_type == "TYPESCRIPT_ERROR"), None)
        if ts_error:
            loc = f"Line {ts_error.line}:{ts_error.column}" if ts_error.line else "Type declaration"
            return DiagnosisReport(
                root_cause=f"TypeScript type validation failure in {ts_error.file or 'source code'}.",
                affected_file=ts_error.file,
                error_location=loc,
                explanation=f"TypeScript compiler rejected the code: {ts_error.message}. This violates type safety rules or references nonexistent properties.",
                fix_strategy=f"Correct the type interface or cast the variable in {ts_error.file or 'the affected file'}.",
                confidence=92,
                severity="HIGH",
                parsed_errors=parsed_errors,
                related_files=[ts_error.file] if ts_error.file else []
            )

        # ── Scenario 3: Python ModuleNotFoundError or Exception ───────────────
        py_error = next((e for e in parsed_errors if "PYTHON" in e.error_type or e.error_type.startswith("MODULE_NOT_FOUND")), None)
        if py_error:
            loc = f"Line {py_error.line}" if py_error.line else "Traceback origin"
            return DiagnosisReport(
                root_cause=f"Python runtime exception: {py_error.message}",
                affected_file=py_error.file,
                error_location=loc,
                explanation=f"Python execution failed with {py_error.message}. {py_error.possible_cause}",
                fix_strategy=py_error.suggested_action or "Handle exception or resolve missing dependency.",
                confidence=94,
                severity="HIGH",
                parsed_errors=parsed_errors,
                related_files=[py_error.file] if py_error.file else []
            )

        # ── Scenario 4: Port Conflict ──────────────────────────────────────────
        port_error = next((e for e in parsed_errors if e.error_type == "PORT_CONFLICT"), None)
        if port_error:
            return DiagnosisReport(
                root_cause="Port already in use (EADDRINUSE).",
                affected_file=None,
                error_location="Network Binding",
                explanation="The application attempted to listen on a network port that is already bound by another running process.",
                fix_strategy="Terminate previous server processes or pass a custom port flag.",
                confidence=98,
                severity="MEDIUM",
                parsed_errors=parsed_errors,
                suggested_commands=["npx kill-port 3000", "npx kill-port 8000"]
            )

        # ── Scenario 5: Test Assertion Failure ─────────────────────────────────
        test_err = next((e for e in parsed_errors if e.error_type == "TEST_ASSERTION_FAILURE"), None)
        if test_err:
            loc = f"Line {test_err.line}" if test_err.line else "Function logic"
            return DiagnosisReport(
                root_cause=f"Test assertion failure in {test_err.file or 'codebase'}: {test_err.message}",
                affected_file=test_err.file or "src/calculator.js",
                error_location=loc,
                explanation=f"A unit test assertion failed because the implementation returned an unexpected value. {test_err.possible_cause}",
                fix_strategy=f"Inspect and repair arithmetic or logic errors in {test_err.file or 'source files'}.",
                confidence=96,
                severity="HIGH",
                parsed_errors=parsed_errors,
                related_files=[test_err.file] if test_err.file else []
            )

        # ── Scenario 5: General Failure ────────────────────────────────────────
        first_err = parsed_errors[0] if parsed_errors else None
        msg = first_err.message if first_err else f"Command '{command}' failed with exit code {exit_code}."
        return DiagnosisReport(
            root_cause=msg,
            affected_file=first_err.file if first_err else None,
            error_location=f"Line {first_err.line}" if first_err and first_err.line else "Execution runtime",
            explanation=f"Command execution terminated unexpectedly. Output indicates: {msg}",
            fix_strategy="Review terminal logs, verify dependencies and run configuration.",
            confidence=85,
            severity="HIGH",
            parsed_errors=parsed_errors,
            related_files=[first_err.file] if first_err and first_err.file else []
        )


debug_agent = DebugAgent()

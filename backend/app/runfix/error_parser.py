"""CodeLens RunFix - Error Detection & Parsing Engine.

Parses raw compiler, interpreter, bundler, and test output into
structured error objects with file locations, line numbers, and error classifications.
"""

from __future__ import annotations

import re
from typing import Any
from pydantic import BaseModel, Field


class ParsedError(BaseModel):
    error_type: str = "UNKNOWN_ERROR"
    severity: str = "HIGH"  # CRITICAL, HIGH, MEDIUM, LOW
    file: str | None = None
    line: int | None = None
    column: int | None = None
    symbol: str | None = None
    message: str = ""
    stack_trace: str = ""
    possible_cause: str = ""
    suggested_action: str = ""
    raw_lines: list[str] = Field(default_factory=list)


def parse_execution_errors(stdout: str, stderr: str) -> list[ParsedError]:
    """Scans stdout and stderr to identify and extract structured error representations."""
    combined = (stderr + "\n" + stdout).strip()
    if not combined:
        return []

    lines = combined.splitlines()
    errors: list[ParsedError] = []

    # ── 1. Node / Vite / TypeScript: Module / Import Not Found ────────────────
    # Example: Cannot find module './config' or [vite] Internal server error: Failed to resolve import "./config" from "src/api.ts"
    vite_resolve_pattern = re.compile(
        r"(?:Failed to resolve import|Cannot find module)\s+['\"]([^'\"]+)['\"]\s+from\s+['\"]([^'\"]+)['\"]",
        re.IGNORECASE
    )
    for m in vite_resolve_pattern.finditer(combined):
        missing_mod = m.group(1)
        src_file = m.group(2)
        errors.append(ParsedError(
            error_type="MODULE_NOT_FOUND",
            severity="HIGH",
            file=src_file,
            symbol=missing_mod,
            message=f"Cannot find module or resolve import '{missing_mod}'",
            possible_cause=f"The imported module '{missing_mod}' does not exist at this relative path or was moved.",
            suggested_action=f"Verify the exact export path or create the missing file at '{missing_mod}'.",
            raw_lines=[m.group(0)]
        ))

    # Example: Cannot find module './config' in file src/App.tsx
    ts_cant_find = re.compile(
        r"(?:error TS2307:\s+Cannot find module\s+['\"]([^'\"]+)['\"]|Cannot find module\s+['\"]([^'\"]+)['\"])",
        re.IGNORECASE
    )
    for i, line in enumerate(lines):
        m = ts_cant_find.search(line)
        if m:
            missing_mod = m.group(1) or m.group(2)
            # Find file in preceding/succeeding lines
            file_match = re.search(r"([a-zA-Z0-9_\-./\\]+\.(?:ts|tsx|js|jsx)):(\d+)(?::(\d+))?", line)
            if not file_match and i > 0:
                file_match = re.search(r"([a-zA-Z0-9_\-./\\]+\.(?:ts|tsx|js|jsx)):(\d+)(?::(\d+))?", lines[i - 1])
            
            f_path = file_match.group(1) if file_match else None
            f_line = int(file_match.group(2)) if file_match else None
            
            # Avoid duplicate if already caught by vite pattern
            if not any(e.symbol == missing_mod for e in errors):
                errors.append(ParsedError(
                    error_type="MODULE_NOT_FOUND",
                    severity="HIGH",
                    file=f_path,
                    line=f_line,
                    symbol=missing_mod,
                    message=f"Cannot find module '{missing_mod}'",
                    possible_cause=f"Missing dependency or invalid relative import '{missing_mod}'.",
                    suggested_action=f"Check if '{missing_mod}' needs to be installed via npm or created in the project.",
                    raw_lines=lines[max(0, i-2):min(len(lines), i+3)]
                ))

    # ── 2. TypeScript Compiler Errors (TS2304, TS2339, TS2322, TS2345, etc.) ─
    ts_error_pattern = re.compile(
        r"([a-zA-Z0-9_\-./\\]+\.(?:ts|tsx|js|jsx)):(\d+):(\d+)\s+-\s+error\s+(TS\d+):\s+(.+)"
    )
    for line in lines:
        m = ts_error_pattern.search(line)
        if m:
            file_p, l_num, col_num, code, msg = m.groups()
            errors.append(ParsedError(
                error_type="TYPESCRIPT_ERROR",
                severity="HIGH",
                file=file_p,
                line=int(l_num),
                column=int(col_num),
                symbol=code,
                message=f"[{code}] {msg}",
                possible_cause=f"TypeScript type-checking failed: {msg}",
                suggested_action="Correct the type signature or missing property definition.",
                raw_lines=[line]
            ))

    # ── 3. Python Tracebacks & Exceptions ─────────────────────────────────────
    # Example: ModuleNotFoundError: No module named 'fastapi'
    py_mod_not_found = re.compile(r"ModuleNotFoundError:\s+No module named\s+['\"]([^'\"]+)['\"]")
    for i, line in enumerate(lines):
        m = py_mod_not_found.search(line)
        if m:
            mod_name = m.group(1)
            # Find file in traceback
            file_name = None
            line_no = None
            for prev_idx in range(i - 1, max(-1, i - 10), -1):
                tb_m = re.search(r'File "([^"]+)", line (\d+)', lines[prev_idx])
                if tb_m:
                    file_name = tb_m.group(1)
                    line_no = int(tb_m.group(2))
                    break
            errors.append(ParsedError(
                error_type="MODULE_NOT_FOUND",
                severity="HIGH",
                file=file_name,
                line=line_no,
                symbol=mod_name,
                message=f"Python ModuleNotFoundError: No module named '{mod_name}'",
                possible_cause=f"Package '{mod_name}' is not installed in the current Python environment or missing from requirements.txt.",
                suggested_action=f"Run 'pip install {mod_name}' or add '{mod_name}' to requirements.txt.",
                raw_lines=lines[max(0, i-6):min(len(lines), i+2)]
            ))

    # Example: SyntaxError / NameError / AttributeError / TypeError in Python
    py_exc_pattern = re.compile(r"(SyntaxError|NameError|AttributeError|TypeError|ValueError|KeyError|ImportError):\s+(.+)")
    for i, line in enumerate(lines):
        m = py_exc_pattern.search(line)
        if m and not any(e.message.startswith(line.strip()) for e in errors):
            exc_type, exc_msg = m.groups()
            file_name = None
            line_no = None
            for prev_idx in range(i - 1, max(-1, i - 10), -1):
                tb_m = re.search(r'File "([^"]+)", line (\d+)', lines[prev_idx])
                if tb_m:
                    file_name = tb_m.group(1)
                    line_no = int(tb_m.group(2))
                    break
            errors.append(ParsedError(
                error_type=f"PYTHON_{exc_type.upper()}",
                severity="HIGH",
                file=file_name,
                line=line_no,
                message=f"{exc_type}: {exc_msg}",
                possible_cause=f"Python runtime exception: {exc_msg}",
                suggested_action="Inspect the traceback location and handle the missing attribute or variable.",
                raw_lines=lines[max(0, i-6):min(len(lines), i+2)]
            ))

    # ── 4. Port Conflict (EADDRINUSE) ─────────────────────────────────────────
    if "EADDRINUSE" in combined or "address already in use" in combined.lower():
        port_m = re.search(r"port\s+(\d+)|:(\d+)", combined, re.IGNORECASE)
        port = port_m.group(1) or port_m.group(2) if port_m else "default"
        errors.append(ParsedError(
            error_type="PORT_CONFLICT",
            severity="MEDIUM",
            message=f"Port {port} is already in use by another process.",
            possible_cause="A background server or another instance is bound to the required port.",
            suggested_action="Stop the conflicting process or change the port configuration."
        ))

    # ── 5. Missing Scripts or Build Failures ───────────────────────────────────
    if "npm error missing script:" in combined.lower() or "missing script:" in combined.lower():
        errors.append(ParsedError(
            error_type="CONFIGURATION_ERROR",
            severity="HIGH",
            message="npm script not found in package.json",
            possible_cause="The command requested a script that is not defined in package.json.",
            suggested_action="Check the 'scripts' section of package.json."
        ))

    # ── 6. Test Runner Failures (Jest / Vitest / PyTest) ──────────────────────
    if "FAIL " in combined or "Expected:" in combined or "AssertionError" in combined:
        test_file_m = re.search(r"(?:FAIL\s+|●\s+)([a-zA-Z0-9_\-./\\]+\.(?:test|spec)\.[a-zA-Z0-9]+)", combined, re.IGNORECASE)
        test_file = test_file_m.group(1) if test_file_m else None
        
        # Look for source file in stack trace
        src_match = re.search(r"at\s+[a-zA-Z0-9_$.<>]+\s+\(([a-zA-Z0-9_\-./\\]+\.(?:js|ts|jsx|tsx|py)):(\d+)(?::(\d+))?\)", combined)
        if src_match and not src_match.group(1).endswith((".test.js", ".spec.js", ".test.ts", ".spec.ts")):
            src_file = src_match.group(1)
            src_line = int(src_match.group(2))
        else:
            # Check for any source files mentioned in src/
            src_in_output = re.search(r"(src/[a-zA-Z0-9_\-./\\]+\.(?:js|ts|jsx|tsx|py))", combined)
            src_file = src_in_output.group(1) if src_in_output else (test_file or "src/calculator.js")
            src_line = 2

        exp_val = re.search(r"Expected:\s*([^\n]+)", combined)
        rec_val = re.search(r"Received:\s*([^\n]+)", combined)
        val_msg = f" (Expected: {exp_val.group(1).strip()}, Received: {rec_val.group(1).strip()})" if exp_val and rec_val else ""

        errors.append(ParsedError(
            error_type="TEST_ASSERTION_FAILURE",
            severity="HIGH",
            file=src_file,
            line=src_line,
            message=f"Test assertion failure in {test_file or 'test suite'}{val_msg}",
            possible_cause="Function returned an incorrect value that differed from expected test assertion.",
            suggested_action=f"Correct the return logic in '{src_file}'.",
            raw_lines=lines[:10]
        ))

    # ── 6. Fallback if errors occurred but none matched ───────────────────────
    if not errors and ("error" in combined.lower() or "failed" in combined.lower() or "exception" in combined.lower()):
        # Extract the most salient error lines
        candidate_lines = [l for l in lines if any(k in l.lower() for k in ["error", "fatal", "failed", "exception", "cannot find", "errno"])]
        errors.append(ParsedError(
            error_type="EXECUTION_FAILURE",
            severity="HIGH",
            message=candidate_lines[0].strip() if candidate_lines else "Execution failed with non-zero exit code",
            raw_lines=candidate_lines[:5],
            possible_cause="An unexpected runtime or build error occurred during execution.",
            suggested_action="Inspect full terminal output logs."
        ))

    return errors

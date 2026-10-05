"""CodeLens RunFix - AI Test Generator.

Inspects fixed functionality and generates automated test suites in
Jest, Vitest, PyTest, or JUnit to verify robustness and prevent regressions.
"""

from __future__ import annotations

import posixpath
from pathlib import PurePosixPath
from pydantic import BaseModel, Field

from app.runfix.detector import DetectedProject
from app.runfix.fix_agent import ProposedFix


class GeneratedTestCase(BaseModel):
    name: str
    description: str
    category: str  # "Normal Input", "Empty Input", "Invalid Input", "Boundary Condition", "Error Handling"
    status: str = "PENDING"


class TestSuiteResult(BaseModel):
    framework: str
    test_file_path: str
    test_code: str
    test_cases: list[GeneratedTestCase] = Field(default_factory=list)
    total_tests: int = 0
    passed_tests: int = 0
    failed_tests: int = 0
    is_verified: bool = False


class TestAgent:
    """Generates and evaluates automated tests for repaired software modules."""

    def __init__(self):
        pass

    def generate_tests(self, project: DetectedProject, fix: ProposedFix) -> TestSuiteResult:
        """Constructs targeted unit tests for the modified file."""
        affected_path = PurePosixPath(fix.affected_file.replace("\\", "/"))
        if affected_path.is_absolute() or ".." in affected_path.parts:
            raise ValueError("Affected file must be a relative path inside the workspace.")
        stem = affected_path.stem
        javascript = project.language in ("TypeScript", "JavaScript")
        python = project.language == "Python"

        if javascript and affected_path.suffix in (".ts", ".tsx", ".js", ".jsx"):
            framework = project.test_framework or "Vitest"
            if framework not in ("Vitest", "Jest"):
                framework = "Vitest"
            test_path = f"src/__tests__/{stem}.test.ts"
            source_module = affected_path.with_suffix("")
            relative_module = posixpath.relpath(source_module.as_posix(), "src/__tests__")
            if not relative_module.startswith("."):
                relative_module = f"./{relative_module}"
            test_cases = [
                GeneratedTestCase(
                    name="test_module_imports",
                    description="Loads the changed module without throwing during initialization.",
                    category="Error Handling",
                )
            ]
            code = (
                f"import {{ describe, expect, it }} from '{framework.lower()}';\n"
                f"import * as subject from '{relative_module}';\n\n"
                f"describe('{stem} smoke test', () => {{\n"
                "  it('loads the changed module', () => {\n"
                "    expect(subject).toBeDefined();\n"
                "  });\n"
                "});\n"
            )
        elif python and affected_path.suffix == ".py":
            framework = project.test_framework or "PyTest"
            test_path = f"tests/test_{stem}.py"
            test_cases = [
                GeneratedTestCase(
                    name="test_module_imports",
                    description="Imports the changed module without raising an exception.",
                    category="Error Handling",
                )
            ]
            code = (
                "import importlib.util\n"
                "import sys\n"
                "from pathlib import Path\n\n"
                "def test_changed_module_imports():\n"
                f"    module_path = Path(__file__).resolve().parents[1] / {affected_path.as_posix()!r}\n"
                "    spec = importlib.util.spec_from_file_location('changed_module', module_path)\n"
                "    assert spec is not None and spec.loader is not None\n"
                "    module = importlib.util.module_from_spec(spec)\n"
                "    sys.modules[spec.name] = module\n"
                "    spec.loader.exec_module(module)\n"
            )
        else:
            framework = project.test_framework or "Unsupported"
            return TestSuiteResult(
                framework=framework,
                test_file_path="",
                test_code="",
                is_verified=False,
            )

        for case in test_cases:
            case.status = "PENDING"

        return TestSuiteResult(
            framework=framework,
            test_file_path=test_path,
            test_code=code,
            test_cases=test_cases,
            total_tests=len(test_cases),
            passed_tests=0,
            failed_tests=0,
            is_verified=False,
        )


test_agent = TestAgent()

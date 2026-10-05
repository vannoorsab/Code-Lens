"""CodeLens RunFix - Project Detection Engine.

Analyzes codebase structure and configuration files to determine:
- Language & Framework
- Package Manager
- Entry Points & Available Scripts
- Run, Build, and Test Commands
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from pydantic import BaseModel, Field


class DetectedProject(BaseModel):
    name: str = "unknown-project"
    language: str = "Unknown"
    framework: str = "Unknown"
    package_manager: str = "Unknown"
    entry_point: str | None = None
    available_scripts: dict[str, str] = Field(default_factory=dict)
    test_framework: str | None = None
    run_command: str = "echo 'No run command detected'"
    build_command: str = "echo 'No build command detected'"
    test_command: str = "echo 'No test command detected'"
    install_command: str = "echo 'No install command detected'"
    root_path: str = ""
    config_files: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


def detect_project(directory: str | Path) -> DetectedProject:
    """Inspects a project directory and extracts comprehensive runtime metadata."""
    dir_path = Path(directory).resolve()
    if not dir_path.exists() or not dir_path.is_dir():
        return DetectedProject(root_path=str(dir_path), name=dir_path.name or "unknown")

    project = DetectedProject(
        name=dir_path.name or "project",
        root_path=str(dir_path)
    )

    found_configs: list[str] = []

    # ── 1. Node.js / JavaScript / TypeScript Ecosystem ────────────────────────
    pkg_json_path = dir_path / "package.json"
    if pkg_json_path.exists():
        found_configs.append("package.json")
        try:
            with open(pkg_json_path, "r", encoding="utf-8") as f:
                pkg = json.load(f)
            project.name = pkg.get("name", project.name)
            scripts: dict[str, str] = pkg.get("scripts", {})
            project.available_scripts = scripts
            dependencies = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

            # Detect Package Manager
            if (dir_path / "pnpm-lock.yaml").exists():
                project.package_manager = "pnpm"
                found_configs.append("pnpm-lock.yaml")
            elif (dir_path / "yarn.lock").exists():
                project.package_manager = "yarn"
                found_configs.append("yarn.lock")
            elif (dir_path / "bun.lockb").exists() or (dir_path / "bun.lock").exists():
                project.package_manager = "bun"
                found_configs.append("bun.lock")
            else:
                project.package_manager = "npm"
                if (dir_path / "package-lock.json").exists():
                    found_configs.append("package-lock.json")

            # Detect Language
            ts_configs = ["tsconfig.json", "tsconfig.app.json", "tsconfig.node.json"]
            is_ts = any((dir_path / ts_cfg).exists() for ts_cfg in ts_configs)
            if is_ts or "typescript" in dependencies:
                project.language = "TypeScript"
                for ts_cfg in ts_configs:
                    if (dir_path / ts_cfg).exists():
                        found_configs.append(ts_cfg)
            else:
                project.language = "JavaScript"

            # Detect Framework
            if "next" in dependencies:
                project.framework = "Next.js"
            elif "vite" in dependencies or (dir_path / "vite.config.ts").exists() or (dir_path / "vite.config.js").exists():
                if "react" in dependencies:
                    project.framework = "React + Vite"
                elif "vue" in dependencies:
                    project.framework = "Vue + Vite"
                elif "svelte" in dependencies:
                    project.framework = "Svelte + Vite"
                else:
                    project.framework = "Vite"
            elif "react" in dependencies or "react-scripts" in dependencies:
                project.framework = "React"
            elif "express" in dependencies:
                project.framework = "Express"
            elif "nest" in dependencies or "@nestjs/core" in dependencies:
                project.framework = "NestJS"
            elif "vue" in dependencies:
                project.framework = "Vue"
            else:
                project.framework = "Node.js"

            # Detect Test Framework
            if "vitest" in dependencies:
                project.test_framework = "Vitest"
            elif "jest" in dependencies or "ts-jest" in dependencies or "react-scripts" in dependencies:
                project.test_framework = "Jest"
            elif "mocha" in dependencies:
                project.test_framework = "Mocha"
            elif "playwright" in dependencies:
                project.test_framework = "Playwright"

            # Formulate Commands
            pm = project.package_manager
            project.install_command = f"{pm} install"

            # Run Command
            if "dev" in scripts:
                project.run_command = f"{pm} run dev"
            elif "start" in scripts:
                project.run_command = f"{pm} start"
            elif "serve" in scripts:
                project.run_command = f"{pm} run serve"
            elif "build" in scripts:
                project.run_command = f"{pm} run build"
            else:
                project.run_command = f"node {pkg.get('main', 'index.js')}"

            # Build Command
            if "build" in scripts:
                project.build_command = f"{pm} run build"
            elif project.language == "TypeScript":
                project.build_command = "npx tsc --noEmit"
            else:
                project.build_command = f"echo 'No build script defined in {project.name}'"

            # Test Command
            if "test" in scripts and "no test specified" not in scripts.get("test", "").lower():
                project.test_command = f"{pm} test"
            elif project.test_framework == "Vitest":
                project.test_command = "npx vitest run"
            elif project.test_framework == "Jest":
                project.test_command = "npx jest"
            else:
                project.test_command = f"{pm} test"

            # Entry point detection
            for candidate in ["src/main.tsx", "src/main.ts", "src/index.tsx", "src/index.ts", "src/App.tsx", "src/app.ts", "src/index.js", "index.js", "app.js", "server.js"]:
                if (dir_path / candidate).exists():
                    project.entry_point = candidate
                    break

        except Exception as err:
            project.metadata["pkg_parse_error"] = str(err)

    # ── 2. Python Ecosystem ───────────────────────────────────────────────────
    req_txt = dir_path / "requirements.txt"
    pyproject = dir_path / "pyproject.toml"
    setup_py = dir_path / "setup.py"
    pipfile = dir_path / "Pipfile"

    if (req_txt.exists() or pyproject.exists() or setup_py.exists() or pipfile.exists() or any(dir_path.glob("*.py"))) and project.framework == "Unknown":
        project.language = "Python"
        if req_txt.exists():
            found_configs.append("requirements.txt")
        if pyproject.exists():
            found_configs.append("pyproject.toml")
        if setup_py.exists():
            found_configs.append("setup.py")
        if pipfile.exists():
            found_configs.append("Pipfile")

        # Detect package manager
        if (dir_path / "poetry.lock").exists() or (pyproject.exists() and "tool.poetry" in pyproject.read_text(errors="ignore")):
            project.package_manager = "poetry"
            project.install_command = "poetry install"
        elif pipfile.exists():
            project.package_manager = "pipenv"
            project.install_command = "pipenv install"
        else:
            project.package_manager = "pip"
            project.install_command = "pip install -r requirements.txt" if req_txt.exists() else "pip install -e ."

        # Inspect requirements for framework
        all_req_text = ""
        if req_txt.exists():
            all_req_text += req_txt.read_text(errors="ignore").lower()
        if pyproject.exists():
            all_req_text += pyproject.read_text(errors="ignore").lower()

        if "fastapi" in all_req_text or (dir_path / "app" / "main.py").exists():
            project.framework = "FastAPI"
            project.run_command = "uvicorn app.main:app --host 0.0.0.0 --port 8000" if (dir_path / "app" / "main.py").exists() else "uvicorn main:app --host 0.0.0.0 --port 8000"
        elif "flask" in all_req_text:
            project.framework = "Flask"
            project.run_command = "python app.py" if (dir_path / "app.py").exists() else "flask run"
        elif "django" in all_req_text or (dir_path / "manage.py").exists():
            project.framework = "Django"
            project.run_command = "python manage.py runserver"
            found_configs.append("manage.py")
        else:
            project.framework = "Python App"
            # find entry script
            candidates = ["main.py", "app.py", "run.py", "server.py", "app/main.py", "src/main.py"]
            found_entry = None
            for c in candidates:
                if (dir_path / c).exists():
                    found_entry = c
                    break
            if found_entry:
                project.entry_point = found_entry
                project.run_command = f"python {found_entry}"
            else:
                project.run_command = "python -m pytest" if (dir_path / "tests").exists() else "python main.py"

        # Testing
        if "pytest" in all_req_text or (dir_path / "pytest.ini").exists() or (dir_path / "tests").exists():
            project.test_framework = "PyTest"
            project.test_command = "pytest"
            if (dir_path / "pytest.ini").exists():
                found_configs.append("pytest.ini")
        else:
            project.test_framework = "unittest"
            project.test_command = "python -m unittest discover"

        project.build_command = "python -m py_compile **/*.py"

    # ── 3. Java Ecosystem ─────────────────────────────────────────────────────
    pom_xml = dir_path / "pom.xml"
    build_gradle = dir_path / "build.gradle" or dir_path / "build.gradle.kts"
    if pom_xml.exists() or (dir_path / "build.gradle").exists() or (dir_path / "build.gradle.kts").exists():
        project.language = "Java"
        if pom_xml.exists():
            found_configs.append("pom.xml")
            project.package_manager = "maven"
            project.framework = "Spring Boot" if "spring-boot" in pom_xml.read_text(errors="ignore").lower() else "Java Maven"
            project.install_command = "mvn dependency:resolve"
            project.build_command = "mvn clean compile"
            project.test_command = "mvn test"
            project.run_command = "mvn spring-boot:run" if "Spring" in project.framework else "mvn exec:java"
        else:
            found_configs.append("build.gradle")
            project.package_manager = "gradle"
            project.framework = "Java Gradle"
            project.install_command = "./gradlew build -x test"
            project.build_command = "./gradlew compileJava"
            project.test_command = "./gradlew test"
            project.run_command = "./gradlew bootRun"

    # ── 4. Go Ecosystem ───────────────────────────────────────────────────────
    go_mod = dir_path / "go.mod"
    if go_mod.exists():
        found_configs.append("go.mod")
        project.language = "Go"
        project.package_manager = "go modules"
        project.framework = "Go App"
        project.install_command = "go mod download"
        project.build_command = "go build ./..."
        project.test_command = "go test ./..."
        project.run_command = "go run main.go" if (dir_path / "main.go").exists() else "go run ."

    # ── 5. Rust Ecosystem ─────────────────────────────────────────────────────
    cargo_toml = dir_path / "Cargo.toml"
    if cargo_toml.exists():
        found_configs.append("Cargo.toml")
        project.language = "Rust"
        project.package_manager = "cargo"
        project.framework = "Rust App"
        project.install_command = "cargo fetch"
        project.build_command = "cargo build"
        project.test_command = "cargo test"
        project.run_command = "cargo run"

    project.config_files = list(set(found_configs))
    return project

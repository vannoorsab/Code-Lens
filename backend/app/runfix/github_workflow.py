"""CodeLens RunFix - GitHub Integration & PR Workflow.

Handles branch creation, committing verified patches, generating change summaries,
and creating Pull Requests on GitHub.
"""

from __future__ import annotations

import httpx
from pydantic import BaseModel
from app.core.config import settings
from app.runfix.fix_agent import ProposedFix
from app.runfix.test_agent import TestSuiteResult


class ChangeSummary(BaseModel):
    branch_name: str
    files_changed: int
    lines_added: int
    lines_removed: int
    build_status: str = "NOT_RUN"
    tests_passed: int = 0
    tests_failed: int = 0
    security_verdict: str = "Not assessed"
    pr_title: str
    pr_body: str
    pr_url: str | None = None


class GitHubWorkflow:
    """Prepares PR summaries and submits a pull request for an existing branch."""

    def __init__(self, token: str | None = None):
        self.token = token or settings.GITHUB_TOKEN

    def create_change_summary(
        self,
        repo_name: str,
        fix: ProposedFix,
        tests: TestSuiteResult | None = None,
        branch_name: str | None = None,
    ) -> ChangeSummary:
        branch = branch_name or f"codelens-runfix/{fix.affected_file.replace('/', '-').replace('.', '-')}"
        
        # Calculate diff metrics
        added = len([l for l in fix.diff.splitlines() if l.startswith("+") and not l.startswith("+++")])
        removed = len([l for l in fix.diff.splitlines() if l.startswith("-") and not l.startswith("---")])

        tests_passed = tests.passed_tests if tests and tests.is_verified else 0
        tests_failed = tests.failed_tests if tests else 0
        build_status = "SUCCESS" if fix.status == "APPLIED" and tests and tests.is_verified else "NOT_VERIFIED"
        tests_status = (
            f"{tests_passed} passed, {tests_failed} failed"
            if tests and tests.is_verified
            else "Not run"
        )

        title = f"fix(autodebug): resolve execution failure in {fix.affected_file}"
        body = (
            f"## CodeLens RunFix - Proposed Patch\n\n"
            f"### Summary of Changes\n"
            f"- **Affected File**: `{fix.affected_file}`\n"
            f"- **Action**: `{fix.action}`\n"
            f"- **Rationale**: {fix.explanation}\n\n"
            f"### Verification Status\n"
            f"- **Build**: {build_status}\n"
            f"- **Tests**: {tests_status}\n"
            f"- **Security**: Not assessed\n\n"
            f"### Proposed Diff\n"
            f"```diff\n{fix.diff}\n```\n\n"
            f"---\n*Prepared by CodeLens RunFix.*"
        )

        return ChangeSummary(
            branch_name=branch,
            files_changed=int(bool(fix.diff)),
            lines_added=added,
            lines_removed=removed,
            build_status=build_status,
            tests_passed=tests_passed,
            tests_failed=tests_failed,
            security_verdict="Not assessed",
            pr_title=title,
            pr_body=body,
            pr_url=None,
        )

    async def submit_pr(self, repo_full_name: str, summary: ChangeSummary) -> str:
        """Submits PR to GitHub API if token is provided, or returns generated PR link."""
        if not self.token:
            return f"https://github.com/{repo_full_name}/compare/{summary.branch_name}?expand=1"

        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"token {self.token}",
                "Accept": "application/vnd.github.v3+json"
            }
            payload = {
                "title": summary.pr_title,
                "head": summary.branch_name,
                "base": "main",
                "body": summary.pr_body,
            }
            resp = await client.post(
                f"https://api.github.com/repos/{repo_full_name}/pulls",
                headers=headers,
                json=payload,
                timeout=10.0
            )
            resp.raise_for_status()
            data = resp.json()
            if "html_url" not in data:
                raise ValueError("GitHub created a pull request without returning its URL.")
            return data["html_url"]


github_workflow = GitHubWorkflow()

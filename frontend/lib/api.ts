import type {
  AnalyzeResponse,
  BlastResult,
  ChangeSummary,
  DetectedProject,
  DiagnosisReport,
  ExplainResponse,
  LogEntry,
  ProposedFix,
  RepoSummary,
  RunFixState,
  SearchResult,
  TestSuiteResult,
  TimelineEvent,
  ViewSpec,
} from "./types";

async function expectOk(response: Response): Promise<Response> {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* keep statusText */
    }
    throw new Error(detail);
  }
  return response;
}

interface JobStatus {
  job_id: string;
  status: "pending" | "running" | "done" | "error" | "interrupted";
  error?: string;
}

const ANALYZE_POLL_MS = 800;

export async function analyzeRepo(source: string): Promise<AnalyzeResponse> {
  const accepted = await expectOk(
    await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
    }),
  );
  const { job_id: jobId } = (await accepted.json()) as JobStatus;

  for (;;) {
    const response = await expectOk(
      await fetch(`/api/analyze/${jobId}`, { cache: "no-store" }),
    );
    const body = (await response.json()) as JobStatus & Partial<AnalyzeResponse>;
    if (body.status === "done") return body as AnalyzeResponse;
    if (body.status === "error") throw new Error(body.error ?? "Analysis failed.");
    if (body.status === "interrupted") {
      throw new Error(
        body.error ?? "The server restarted during this analysis. Please try again.",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, ANALYZE_POLL_MS));
  }
}

export async function fetchViewSpec(
  snapshotId: number,
  zoom: number,
): Promise<ViewSpec> {
  const response = await expectOk(
    await fetch(`/api/repos/${snapshotId}/viewspec?zoom=${zoom}`, {
      cache: "no-store",
    }),
  );
  return response.json();
}

export async function fetchExplanation(
  snapshotId: number,
  nodeId: string,
): Promise<ExplainResponse> {
  const response = await expectOk(
    await fetch(
      `/api/repos/${snapshotId}/explain?node_id=${encodeURIComponent(nodeId)}`,
      { cache: "no-store" },
    ),
  );
  return response.json();
}

export async function runQuery(
  snapshotId: number,
  plan: string,
  target?: string,
): Promise<BlastResult> {
  const response = await expectOk(
    await fetch(`/api/repos/${snapshotId}/query/${encodeURIComponent(plan)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: target ?? null }),
    }),
  );
  return response.json();
}

export async function searchSymbols(
  snapshotId: number,
  query: string,
  limit = 20,
): Promise<SearchResult[]> {
  const response = await expectOk(
    await fetch(
      `/api/repos/${snapshotId}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      { cache: "no-store" },
    ),
  );
  return response.json();
}

export async function fetchRepos(): Promise<RepoSummary[]> {
  const response = await expectOk(
    await fetch("/api/repos", { cache: "no-store" }),
  );
  return response.json();
}

// ══════════════════════════════════════════════════════════════════════════════
// ── CODELENS RUNFIX API CLIENT ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export async function detectProject(workspacePath = "."): Promise<DetectedProject> {
  const response = await expectOk(
    await fetch("/api/runfix/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_path: workspacePath }),
    }),
  );
  return response.json();
}

export async function stopExecution(executionId: string): Promise<{ stopped: boolean }> {
  const response = await expectOk(
    await fetch(`/api/runfix/stop?execution_id=${encodeURIComponent(executionId)}`, {
      method: "POST",
    }),
  );
  return response.json();
}

export async function diagnoseExecution(
  command: string,
  exitCode: number | null,
  stdout: string,
  stderr: string,
  workspacePath = ".",
): Promise<DiagnosisReport> {
  const response = await expectOk(
    await fetch("/api/runfix/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command,
        exit_code: exitCode,
        stdout,
        stderr,
        workspace_path: workspacePath,
      }),
    }),
  );
  return response.json();
}

export async function proposeFix(
  diagnosis: DiagnosisReport,
  workspacePath = ".",
): Promise<ProposedFix> {
  const response = await expectOk(
    await fetch("/api/runfix/fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosis, workspace_path: workspacePath }),
    }),
  );
  return response.json();
}

export async function applyFix(
  fix: ProposedFix,
  workspacePath = ".",
): Promise<{ success: boolean; file: string }> {
  const response = await expectOk(
    await fetch("/api/runfix/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fix, workspace_path: workspacePath }),
    }),
  );
  return response.json();
}

export async function generateTests(
  fix: ProposedFix,
  workspacePath = ".",
): Promise<TestSuiteResult> {
  const response = await expectOk(
    await fetch("/api/runfix/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fix, workspace_path: workspacePath }),
    }),
  );
  return response.json();
}

export async function setupDemoSandbox(
  projectType: "react" | "python" = "react",
): Promise<{ workspace_path: string; project: DetectedProject; message: string }> {
  const response = await expectOk(
    await fetch("/api/runfix/demo/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_type: projectType }),
    }),
  );
  return response.json();
}

export async function createGitHubPR(
  repoName: string,
  fix: ProposedFix,
  tests?: TestSuiteResult,
): Promise<ChangeSummary> {
  const response = await expectOk(
    await fetch(`/api/runfix/github/pr?repo_name=${encodeURIComponent(repoName)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fix, tests }),
    }),
  );
  return response.json();
}

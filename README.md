# CodeLens

**See how a codebase connects before you change it.**

CodeLens analyzes a repository and turns its files, symbols, dependencies, and
selected Git history into an interactive software knowledge graph. Explore the
system from architecture to files to functions, inspect dependency paths, and
ask which parts may be affected by a change.

The repository also includes **RunFix**, a workspace runner with project
detection, streamed command logs, diagnostic heuristics, a small set of
automatic repairs, and smoke-test generation. RunFix is intentionally
presented as a developer tool: generated tests are not executed automatically,
and the GitHub integration currently prepares a change summary rather than
creating a branch or pull request.

## What the application does

### Explore a repository

- Analyze a GitHub repository and follow progress through a background job.
- Browse a multi-level graph: architecture groups, files, and code symbols.
- Switch between 2D and 3D graph views, search for symbols, and inspect nodes.
- See imports, calls, ownership/history signals, and confidence labels for
  resolved, heuristic, or ambiguous relationships.
- Run deterministic graph queries for structure, dependencies, blast radius,
  coupling, architecture, quality, endpoints, centrality, and risk.
- Use concept search and a learning path without an LLM key.
- Optionally generate summaries and narrated answers when narration is enabled
  and an LLM provider is configured.

### RunFix workspace tools

- Detect project metadata and common run, build, install, and test commands.
- Run a workspace command and stream stdout/stderr over Server-Sent Events.
- Stop an active command and scrub common credential variables from its child
  process environment.
- Parse common runtime/compiler errors into a diagnostic report.
- Propose narrow heuristic repairs for selected known cases; unsupported
  failures are marked for manual review rather than represented as a fix.
- Generate a small module-import smoke test for a supported source file.
- Prepare a proposed-change summary for review.

RunFix does **not** currently claim that generated tests passed without
executing them. Its summary endpoint does not create a Git branch or open a
GitHub pull request. The demo React and Python projects are deliberately
broken examples, not proof that every repair is automated.

## Architecture

```text
GitHub repository
       │
       ▼
clone + bounded source inventory
       │
       ▼
Tree-sitter parsers ──► Python / JavaScript / TypeScript facts
       │
       ▼
whole-repository resolution + Git history metrics
       │
       ▼
NetworkX graph ──► deterministic queries / blast radius / risk
       │                         │
       ▼                         ▼
SQLite snapshots          optional LLM narration
       │
       ▼
FastAPI JSON/SSE API ──► Next.js frontend
                            ├─ Sigma.js 2D graph
                            └─ Three.js 3D graph
```

The main API handles repository analysis, graph queries, and visualization
data. Analysis returns a job ID quickly; the client polls for completion.
Graph facts and metrics are deterministic. LLM calls are an optional layer for
prose, not a prerequisite for building or exploring the graph.

RunFix follows a separate workspace flow:

```text
workspace → detect → sandboxed command + live logs → diagnose
                                               └→ proposed fix
                                                   ├→ manual review
                                                   └→ apply supported fix → rerun
```

The current automatic repair and test generation capabilities are deliberately
limited. Review proposed diffs and run the generated tests yourself before
relying on a change.

## Quick start

### Docker Compose

Docker Compose is the simplest way to start both services:

```powershell
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The frontend is published
on port 3000 and proxies API requests to the backend over the Compose network.
The backend port is not published by default.

### Run services locally

Requirements: Python 3.12 or newer, Node.js, npm, and Git.

Terminal 1 — backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Terminal 2 — frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The interactive API
documentation is at [http://localhost:8000/api/docs](http://localhost:8000/api/docs);
the health endpoint is [http://localhost:8000/health](http://localhost:8000/health).

For Bash/macOS/Linux, activate the virtual environment with
`source .venv/bin/activate`.

## Configuration

Backend settings can be supplied as environment variables or in
`backend/.env`. See [`backend/app/core/config.py`](backend/app/core/config.py)
for the full list and defaults.

| Setting | Default | Purpose |
|---|---:|---|
| `SQLITE_PATH` | `data/codelens.db` | Persistent graph and job data |
| `CLONE_DIR` | `/tmp/codelens` | Repository clone/cache directory |
| `MAX_REPO_SIZE_MB` | `500` | Repository clone size ceiling |
| `MAX_FILE_SIZE_MB` | `4` | Maximum inventoried file size |
| `MAX_FILES` | `50000` | Maximum files inventoried per repository |
| `ANALYSIS_TIMEOUT_SECONDS` | `900` | Analysis job time limit |
| `MAX_CONCURRENT_ANALYSES` | `2` | Concurrent repository analyses |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed browser origins |
| `NARRATION_ENABLED` | `false` | Explicitly enable LLM-backed narration |
| `LLM_PROVIDER` | `auto` | Provider selection when narration is enabled |
| `RUNFIX_SANDBOX_TIMEOUT_SECONDS` | `120` | RunFix command time limit |
| `RUNFIX_MAX_ITERATIONS` | `5` | RunFix autonomous loop limit |
| `GITHUB_TOKEN` | unset | Optional token for the GitHub API helper |

To enable narration, set `NARRATION_ENABLED=true` and configure a supported
provider credential. Without narration, the graph and deterministic queries
remain available.

**Security note:** RunFix accepts workspace paths and commands and executes
those commands in a child process. Credential environment variables are
filtered, but this is not a hostile-code isolation boundary. Only run it
against workspaces you trust, keep the API private, and do not expose the
RunFix endpoints directly to untrusted users. The main repository-analysis
API is a separate feature and does not execute analyzed repository code.

## API overview

The backend exposes OpenAPI documentation at `/api/docs`. Common routes:

| Route | Function |
|---|---|
| `POST /api/analyze` | Start repository analysis; returns a job ID |
| `GET /api/analyze/{job_id}` | Poll job status and results |
| `GET /api/repos` | List stored repository snapshots |
| `GET /api/repos/{id}/viewspec?zoom=1\|2\|3` | Get graph data for a visualization level |
| `POST /api/repos/{id}/query/{name}` | Run a registered deterministic graph query |
| `GET /api/repos/{id}/explain?node_id=...` | Inspect a graph node and its evidence |
| `POST /api/repos/{id}/search` | Search graph concepts |
| `POST /api/runfix/detect` | Detect project commands and metadata |
| `POST /api/runfix/run` | Run a command and stream logs |
| `POST /api/runfix/auto` | Stream the RunFix repair workflow |
| `POST /api/runfix/apply` | Apply a proposed patch contained in the workspace |
| `POST /api/runfix/tests` | Generate a smoke-test template |
| `POST /api/runfix/github/pr` | Prepare a GitHub change summary |

The GitHub route currently returns a change summary; it does not create a
branch or submit a pull request.

## Supported analysis and current limits

- Repository parsing focuses on Python, JavaScript, and TypeScript.
- Git history signals are bounded by the configured clone/history behavior.
- The graph cache, job registry, and admission/rate limits are process-local;
  the current backend should run as a single application process.
- Dynamic language behavior cannot always be resolved statically. Edges expose
  confidence instead of treating every inferred relationship as certain.
- RunFix's generated tests are limited smoke tests and are returned as
  `PENDING`; this code does not execute them.
- Automatic fixes are limited to recognized cases. Other cases require manual
  review.
- Optional narration depends on a configured model provider; graph queries do
  not.

## Development checks

From the repository root:

```powershell
Set-Location backend
python -m pytest -q
python -m compileall -q app

Set-Location ..\frontend
npx tsc --noEmit
```

See [`SECURITY.md`](SECURITY.md), [`DEPLOYING.md`](DEPLOYING.md), and
[`RUNBOOK.md`](RUNBOOK.md) for operational guidance. The
[Accuracy Ledger](LEDGER.md) records the measured blast-radius benchmark and
its limitations.

## License

See [`LICENSE`](LICENSE).

# CODE-LENS Hindsight Memory Architecture

## Executive Overview

CODE-LENS combines three complementary pillars of code intelligence:

1. **CODE-LENS Static Knowledge Graph** (*"What exists & what depends on what?"*)
   - Tree-sitter AST parsing (Python, JavaScript/TypeScript)
   - NetworkX dependency & import graph view
   - Deterministic blast radius, risk, centrality, and cycle calculations
   - SQLite persistent storage (`data/codelens.db`)

2. **Hindsight Organizational Memory** (*"What did the team learn?"*)
   - Multi-strategy memory retrieval (semantic, keyword, graph, and temporal)
   - Experience categories (ADRs, Code Reviews, Change Outcomes, Bugfixes, Regressions, Anti-patterns, Team Conventions)
   - Repository & project level memory isolation (`bank_id = codelens-<repo>`)

3. **Memory-Aware AI Reasoning Engine** (*"How should past experience guide future changes?"*)
   - REFLECT reasoning stage combining structural code evidence with historical team experiences
   - Transparent memory evidence attribution
   - Dual-mode Memory ON vs. Memory OFF comparison

```
                  ┌──────────────────────────────────────────┐
                  │    DEVELOPER REQUEST / PROPOSED CHANGE   │
                  └────────────────────┬─────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐                     ┌───────────────────────────────┐
│   CODE-LENS KNOWLEDGE GRAPH   │                     │    HINDSIGHT MEMORY ENGINE    │
│   - AST Code Structure        │                     │    - Architecture Decisions   │
│   - Dependency Traversal      │                     │    - Review Feedback & ADRs   │
│   - Blast Radius Calculation  │                     │    - Historical Bugfixes      │
└───────────┬───────────────────┘                     └───────────┬───────────────────┘
            │                                                     │
            │  [Current Code Evidence]           [Historical]     │
            │                                     [Memories]      │
            └──────────────────────────┬──────────────────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │    HINDSIGHT REFLECT ENGINE   │
                       │    - Experience Reasoning     │
                       │    - Anti-Pattern Warnings    │
                       │    - Recommended Verifications│
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │  MEMORY-AWARE RECOMMENDATION  │
                       │   & EVIDENCE ATTRIBUTION UI   │
                       └───────────────────────────────┘
```

---

## Retain, Recall, Reflect Engine Specifications

### 1. What is RETAIN?
**RETAIN** stores meaningful engineering experiences in Hindsight without polluting the memory bank with raw code lines.

- **What is Retained**:
  - `ARCHITECTURE_DECISION`: Key design decisions (e.g., choice of databases, API structures).
  - `CODE_REVIEW`: Team review comments and mandatory checklist items.
  - `CHANGE_OUTCOME`: Outcome of code changes (successes, regressions, test failures).
  - `SUCCESSFUL_FIX`: Proven bugfixes and refactoring patterns.
  - `FAILED_APPROACH`: Known anti-patterns and reverted PR approaches.
  - `DEVELOPER_FEEDBACK`: Stated developer preferences and architectural guidelines.
  - `TEAM_CONVENTION`: Established coding standards and testing requirements.
  - `REGRESSION`: Post-mortem records of past incidents and breaking changes.
- **How it Works**:
  When a commit milestone, PR review, or developer action occurs, CODE-LENS constructs a structured `ExperienceMemory` object with tags (`repo:<name>`, `cat:<category>`) and calls `get_hindsight_provider().retain(memory)`.

### 2. What is RECALL?
**RECALL** retrieves relevant past memories when analyzing a question or proposed code modification.

- **How it Works**:
  Given a target component, touched files, or developer query, `get_hindsight_provider().recall(...)` queries Hindsight using multi-strategy search.
- **Evidence Separation**:
  The response cleanly separates:
  - `current_code_evidence`: AST nodes, complexity metrics, dependency blast radius.
  - `historical_memory_evidence`: Recalled Hindsight team memories with metadata and confidence scores.

### 3. What is REFLECT?
**REFLECT** performs agentic synthesis across current code facts and historical memories.

- **How it Works**:
  The reflection engine evaluates:
  - *"Have we seen this kind of change before?"*
  - *"Did changing this module previously cause a regression?"*
  - *"Are there relevant team conventions or ADRs?"*
- **Outcome**:
  Outputs a structured `ReflectResult` containing explicit recommendation prose, step-by-step reasoning, and memory attribution IDs.

---

## Memory Bank Isolation

Memories are strictly isolated by repository and project namespace:
- `bank_id = f"codelens-{sanitized_repo_name}"`
- Metadata tags: `repo:<url>`, `project:codelens`

Unrelated repositories will never contaminate each other's historical memories.

---

## API & Configuration

### Environment Variables
```env
HINDSIGHT_ENABLED=true
HINDSIGHT_BASE_URL=http://localhost:8888
HINDSIGHT_API_KEY=
HINDSIGHT_BANK_ID=codelens-default
HINDSIGHT_TIMEOUT_SECONDS=10
```

### Core API Endpoints
- `GET /api/hindsight/health` — Connection health check
- `POST /api/repos/{snapshot_id}/hindsight/retain` — Retain structured experience
- `POST /api/repos/{snapshot_id}/hindsight/recall` — Multi-strategy memory recall
- `POST /api/repos/{snapshot_id}/hindsight/reflect` — Agentic memory reflection
- `POST /api/repos/{snapshot_id}/hindsight/compare` — Memory ON vs OFF comparison

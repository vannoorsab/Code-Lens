/** Mirrors of the backend's ViewSpec contract (app/views/viewspec.py).
 *  The frontend renders these; it never computes truth. */

export interface ViewNode {
  id: string;
  label: string;
  kind: string;
  x: number;
  y: number;
  size: number;
  color: string;
  cluster: string;
  assembly_index: number;
  /** The depth axis. `depth` is the fact — the longest chain of imports that
   *  arrives at this file, so nothing sits above what leans on it — and `z`
   *  is that fact placed in the same coordinate space as x and y. Optional
   *  because a spec compiled by an older backend has neither, and a flat
   *  renderer that ignores both is still correct. */
  depth?: number;
  z?: number;
  risk: number;
  fan_in: number;
  is_entrypoint: boolean;
  file_path: string | null;
  start_line: number | null;
  /** The real graph node behind this pixel. Cluster nodes are a view-layer
   *  invention with no graph node of their own, so queries must follow this. */
  explain_id: string | null;
}

export interface ViewEdge {
  source: string;
  target: string;
  kind: string;
  weight: number;
  confidence: "resolved" | "heuristic" | "dynamic_unknown";
}

export interface ViewCluster {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  members: number;
}

export interface ViewSpec {
  zoom: number;
  repo_url: string;
  commit_sha: string;
  nodes: ViewNode[];
  edges: ViewEdge[];
  clusters: ViewCluster[];
  meta: Record<string, unknown>;
}

export interface PipelineStage {
  stage: string;
  seconds: number;
  skipped: boolean;
  /** What this stage measured, in one phrase — "412 files · Python", "8,254
   *  nodes". A count taken from the stage's own result, never an estimate of
   *  work remaining. `null` when a stage had nothing to count. */
  detail: string | null;
}

export interface AnalyzeResponse {
  snapshot_id: number;
  repo_url: string;
  commit_sha: string;
  skipped: boolean;
  stages: PipelineStage[];
  nodes: number;
  edges: number;
}

export interface RankedNode {
  node_id: string;
  score: number;
  reasons: {
    distance: number;
    fan_in: number;
    path_confidence: "resolved" | "heuristic" | "dynamic_unknown";
    /** Which file the affected node lives in. Needed to count files rather
     *  than nodes — a function's id is a dotted qualified name, not a path. */
    file_path: string | null;
    name: string;
    kind: string | null;
  };
}

export interface Neighbour {
  id: string;
  name: string;
  file_path: string | null;
  references: number;
}

/** The explain ResultGraph — every field a checkable graph fact. */
export interface Explanation {
  focus_id: string;
  paths: Record<string, string[]>;
  summary?: { text: string; derived_from: string[]; model: string };
  meta: {
    identity: {
      id: string;
      kind: string;
      name: string;
      qualified_name: string;
      file_path: string | null;
      start_line: number | null;
      end_line: number | null;
      language: string | null;
      loc: number | null;
      complexity: number | null;
      docstring: string | null;
      churn_count: number | null;
      author_count: number | null;
      last_modified: string | null;
    };
    role: {
      is_entrypoint: boolean;
      entrypoint_kind: string | null;
      direct_dependents: number;
      direct_dependencies: number;
      transitive_dependents: number;
      verdict: string;
    };
    depends_on: Neighbour[];
    used_by: Neighbour[];
    contains: {
      counts: Record<string, number>;
      top: {
        id: string;
        name: string;
        kind: string;
        fan_in: number;
        file_path: string | null;
        start_line: number | null;
      }[];
    };
    co_changes: CoChangePartner[];
    tested_by: TestFile[];
    ownership: Ownership | null;
    endpoints: EndpointRef[];
  };
}

/** An HTTP route a change to this node would reach. */
export interface EndpointRef {
  file_path: string | null;
  id: string;
  method: string;
  path: string;
}

/** A test file that imports this one. `named_for_it` means the names match
 *  (`test_views.py` / `views.py`) — intent, not just a dependency. */
export interface TestFile {
  id: string;
  name: string;
  file_path: string | null;
  named_for_it: boolean;
}

/** Who has worked on this, over the history that was cloned. */
export interface Ownership {
  authors: { name: string; share: number }[];
  primary: string;
  primary_share: number;
  bus_factor_one: boolean;
}

/** A file that history says travels with this one.
 *
 * `hidden` is the interesting bit: no import, no call, yet they keep shipping
 * together. `strength` is the share of commits touching either file that
 * touched both. */
export interface CoChangePartner {
  id: string;
  name: string;
  file_path: string | null;
  strength: number;
  hidden: boolean;
}

/** The shape every query plan returns (backend `ResultGraph`).
 *
 *  `meta` is deliberately loose: each plan puts its own findings there, and
 *  the alternative — a union of eleven shapes that must be edited whenever a
 *  plan is registered — would defeat the point of a generic runner. Callers
 *  narrow it at the point of use. */
export interface QueryResult {
  query: string;
  params: Record<string, unknown>;
  focus_id: string | null;
  node_ids: string[];
  ranked: { node_id: string; score: number; reasons: Record<string, unknown> }[];
  paths: Record<string, string[]>;
  meta: Record<string, unknown>;
}

/** The blast_radius ResultGraph — the facts the ripple animates. */
export interface BlastResult {
  focus_id: string;
  node_ids: string[];
  ranked: RankedNode[];
  paths: Record<string, string[]>;
  meta: {
    total_affected: number;
    /** Where the changed thing lives, so a level rendering files can draw a
     *  wave whose source is a function. */
    focus?: { id: string; name: string; file_path: string | null };
  };
}

// ── Hindsight Memory Engine Types ──────────────────────────────────────

export type MemoryCategory =
  | "ARCHITECTURE_DECISION"
  | "CODE_REVIEW"
  | "CHANGE_OUTCOME"
  | "SUCCESSFUL_FIX"
  | "FAILED_APPROACH"
  | "DEVELOPER_FEEDBACK"
  | "TEAM_CONVENTION"
  | "REGRESSION";

export interface HindsightMemory {
  id: string;

  category: MemoryCategory;
  repository: string;
  component?: string | null;
  related_files: string[];
  event_type: string;
  description: string;
  outcome?: string | null;
  timestamp: string;
  commit_sha?: string | null;
  author?: string | null;
  source: string;
  tags: string[];
  confidence: number;
}

export interface HindsightHealth {
  connected: boolean;
  hindsight_enabled: boolean;
  bank_id: string;
  base_url: string;
  message: string;
  version?: string | null;
  error?: string | null;
}

export interface HindsightOverview {
  snapshot_id: number;
  repository: string;
  total_memories: number;
  category_breakdown: Record<string, number>;
  recent_memories: HindsightMemory[];
  active_bank: string;
}

export interface AgentTraceStep {
  step_number: number;
  name: string;
  status: "success" | "warning" | "in_progress" | "error";
  detail: string;
  duration_ms: number;
}

export interface MemoryAwareAnalysisResult {
  snapshot_id: number;
  node_id: string;
  repository: string;
  memory_mode: "MEMORY_ON" | "MEMORY_OFF";
  current_analysis: BlastResult;
  historical_memories: HindsightMemory[];
  historical_evidence: Record<string, unknown>[];
  reflection: {
    recommendation?: string;
    reasoning?: string;
    confidence?: number;
  };
  recommendation: string;
  reasoning: string;
  memories_used: string[];
  confidence: number;
  agent_trace: AgentTraceStep[];
  total_latency_ms: number;
}

export interface MemoryComparisonResult {
  snapshot_id: number;
  repository: string;
  query: string;
  memory_off: {
    mode: string;
    recommendation: string;
    evidence_used: string[];
    historical_context: null;
  };
  memory_on: {
    mode: string;
    recommendation: string;
    reasoning: string;
    historical_evidence: Record<string, unknown>[];
    memories_count: number;
    confidence: number;
  };
export interface FreshnessInfo {
  level: "Recent" | "Aging" | "Historical";
  days_ago: number;
  badge_color: "emerald" | "amber" | "rose";
  label: string;
}

export interface MemoryConflict {
  target: string;
  newer_decision: {
    id: string;
    category: string;
    description: string;
    timestamp: string;
    freshness: FreshnessInfo;
  };
  older_decision: {
    id: string;
    category: string;
    description: string;
    timestamp: string;
    freshness: FreshnessInfo;
  };
  recommendation: string;
}

export interface LearningTimelineEvent {
  id: string;
  category: MemoryCategory;
  repository: string;
  component: string | null;
  description: string;
  outcome: string | null;
  timestamp: string;
  freshness: FreshnessInfo;
  related_files: string[];
  author: string | null;
  source: string;
}

export interface LearningTimelineResponse {
  snapshot_id: number;
  repository: string;
  total_events: number;
  timeline: LearningTimelineEvent[];
  conflicts: MemoryConflict[];
}

export interface ChangeSimulationResult {
  snapshot_id: number;
  target_node_id: string;
  target_name: string;
  file_path: string | null;
  intent_text: string | null;
  structural_impact: {
    total_affected_symbols: number;
    affected_files_count: number;
    affected_files: string[];
  };
  historical_experience: {
    recalled_count: number;
    regressions_count: number;
    failed_approaches_count: number;
    successful_fixes_count: number;
    memories: HindsightMemory[];
  };
  risk_signal: {
    level: "HIGH" | "MEDIUM" | "LOW";
    reasoning: string;
  };
  recommended_checks: string[];
  conflicts: MemoryConflict[];
}

export interface TeamKnowledgeItem {
  id: string;
  description: string;
  outcome: string | null;
  component: string | null;
  related_files: string[];
  author: string | null;
  timestamp: string;
  freshness: FreshnessInfo;
}

export interface TeamKnowledgeResponse {
  total_knowledge_items: number;
  category_counts: Record<string, number>;
  knowledge_by_category: Record<string, TeamKnowledgeItem[]>;
}

export interface LearningAnalyticsResponse {
  has_sufficient_data: boolean;
  message: string;
  metrics: {
    memories_retained: number;
    memories_recalled: number;
    recommendations_generated: number;
    developer_feedback_events: number;
    confirmed_recommendations: number;
    corrected_recommendations: number;
    historical_experiences_reused: number;
  };
}



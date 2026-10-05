/** CodeLens RunFix - Type Definitions.
 * Frontend mirrors of AST viewspecs, graph topologies, and RunFix execution state.
 */

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
  depth?: number;
  z?: number;
  risk: number;
  fan_in: number;
  is_entrypoint: boolean;
  file_path: string | null;
  start_line: number | null;
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

export interface BlastFocus {
  id: string;
  name: string;
  file_path?: string | null;
}

export interface BlastMeta {
  total_affected?: number;
  focus?: BlastFocus;
  [key: string]: any;
}

export interface BlastResult {
  query?: string;
  target?: string;
  target_name?: string;
  file_path?: string | null;
  kind?: string | null;
  direct_dependents?: Neighbour[];
  direct_dependencies?: Neighbour[];
  ranked: RankedNode[];
  paths?: Record<string, string[]>;
  node_ids?: string[];
  total_affected?: number;
  max_depth?: number;
  deterministic?: boolean;
  meta?: BlastMeta;
  [key: string]: any;
}

export interface SearchResult {
  id: string;
  label: string;
  kind: string;
  file_path: string | null;
  fan_in: number;
  risk: number;
}

export interface EndpointRef {
  id: string;
  method: string;
  path: string;
  file_path?: string;
  line?: number;
}

export interface TestFile {
  id: string;
  name: string;
  file_path?: string;
  named_for_it?: boolean;
  tests_count?: number;
}

export interface CoChangePartner {
  id: string;
  name: string;
  file_path?: string;
  co_change_count?: number;
  confidence?: number;
  strength: number;
  hidden?: boolean;
}

export interface ExplainIdentity {
  id: string;
  kind: string;
  name: string;
  qualified_name?: string;
  file_path?: string | null;
  start_line?: number | null;
  end_line?: number | null;
  language?: string;
  loc?: number;
  complexity?: number | null;
  docstring?: string | null;
  churn_count?: number;
  author_count?: number;
}

export interface ExplainRole {
  direct_dependencies: number;
  direct_dependents: number;
  transitive_dependents: number;
  is_entrypoint: boolean;
  is_hub: boolean;
  is_leaf: boolean;
  risk_tier?: string;
  verdict?: string;
  complexity?: number | string | null;
}

export interface ExplainMeta {
  identity: ExplainIdentity;
  role: ExplainRole;
  depends_on: Array<{ id: string; name: string; references: number }>;
  used_by: Array<{ id: string; name: string; references: number }>;
  tested_by?: TestFile[];
  co_changes?: CoChangePartner[];
  endpoints?: EndpointRef[];
  [key: string]: any;
}

export interface ExplainResponse {
  query?: string;
  ranked?: RankedNode[];
  meta: ExplainMeta;
  paths?: Record<string, string[]>;
  summary?: {
    text: string;
    derived_from?: string;
    model?: string;
  } | null;
  [key: string]: any;
}

export interface HealthResponse {
  status: string;
  version: string;
  service: string;
}

export interface RepoSummary {
  repo_url: string;
  commit_sha: string;
  analyzed_at: string;
  nodes: number;
  edges: number;
  primary_language: string;
  files: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── CODELENS RUNFIX ENGINE TYPES ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export interface DetectedProject {
  name: string;
  language: string;
  framework: string;
  package_manager: string;
  entry_point: string | null;
  available_scripts: Record<string, string>;
  test_framework: string | null;
  run_command: string;
  build_command: string;
  test_command: string;
  install_command: string;
  root_path: string;
  config_files: string[];
  metadata?: Record<string, unknown>;
}

export interface LogEntry {
  timestamp: number;
  stream: "stdout" | "stderr" | "system";
  text: string;
  formatted_time?: string;
}

export interface ParsedError {
  error_type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  file: string | null;
  line: number | null;
  column: number | null;
  symbol: string | null;
  message: string;
  stack_trace: string;
  possible_cause: string;
  suggested_action: string;
  raw_lines?: string[];
}

export interface DiagnosisReport {
  root_cause: string;
  affected_file: string | null;
  error_location: string | null;
  explanation: string;
  fix_strategy: string;
  confidence: number;
  severity: string;
  parsed_errors: ParsedError[];
  suggested_commands: string[];
  related_files: string[];
}

export interface ProposedFix {
  fix_id: string;
  affected_file: string;
  action: "MODIFY" | "CREATE" | "INSTALL" | "REVIEW";
  explanation: string;
  diff: string;
  original_snippet?: string;
  fixed_snippet?: string;
  full_fixed_content?: string | null;
  is_new_file: boolean;
  status: "PROPOSED" | "APPLIED" | "REJECTED" | "FAILED" | "REVIEW";
}

export interface GeneratedTestCase {
  name: string;
  description: string;
  category: "Normal Input" | "Empty Input" | "Invalid Input" | "Boundary Condition" | "Error Handling";
  status: "PENDING" | "PASSED" | "FAILED";
}

export interface TestSuiteResult {
  framework: string;
  test_file_path: string;
  test_code: string;
  test_cases: GeneratedTestCase[];
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  is_verified: boolean;
}

export interface ChangeSummary {
  branch_name: string;
  files_changed: number;
  lines_added: number;
  lines_removed: number;
  build_status: string;
  tests_passed: number;
  tests_failed: number;
  security_verdict: string;
  pr_title: string;
  pr_body: string;
  pr_url?: string | null;
}

export interface TimelineEvent {
  timestamp: number;
  time_formatted: string;
  phase: "DETECT" | "RUN" | "FAIL" | "DIAGNOSE" | "FIX" | "VERIFY" | "TEST" | "SUCCESS";
  icon: string;
  title: string;
  detail?: string | null;
}

export interface RunFixState {
  state: "IDLE" | "ANALYZING" | "PREPARING" | "RUNNING" | "FAILED" | "DIAGNOSING" | "FIX_PROPOSED" | "APPLYING_FIX" | "VERIFYING" | "TESTING" | "SUCCESS";
  iteration: number;
  max_iterations: number;
  project: DetectedProject | null;
  latest_diagnosis: DiagnosisReport | null;
  latest_fix: ProposedFix | null;
  latest_tests: TestSuiteResult | null;
  change_summary: ChangeSummary | null;
  timeline: TimelineEvent[];
  is_autonomous: boolean;
  is_repaired: boolean;
  error_message?: string | null;
}

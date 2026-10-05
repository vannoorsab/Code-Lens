"use client";

import { create } from "zustand";
import {
  analyzeRepo,
  applyFix,
  createGitHubPR,
  detectProject,
  diagnoseExecution,
  fetchExplanation,
  fetchViewSpec,
  generateTests,
  proposeFix,
  runQuery,
  searchSymbols,
  setupDemoSandbox,
  stopExecution,
} from "./api";
import type { SearchHit } from "./search";
import type {
  AnalyzeResponse,
  BlastResult,
  ChangeSummary,
  DetectedProject,
  DiagnosisReport,
  ExplainResponse,
  LogEntry,
  PipelineStage,
  ProposedFix,
  RunFixState,
  TestSuiteResult,
  TimelineEvent,
  ViewSpec,
} from "./types";

export type Phase = "idle" | "understanding" | "revealing" | "exploring";
export type Dimension = "2d" | "3d";
export const DIMENSION_KEY = "codelens.dimension";

export interface Overlay {
  query: string;
  label: string;
  nodeIds: string[];
  count?: number;
  detail?: string;
  findings?: Array<{ label: string; nodeIds: string[] }>;
}

interface GraphState {
  phase: Phase;
  error: string | null;
  notice: string | null;
  clearNotice: () => void;

  snapshotId: number | null;
  repoUrl: string | null;
  stages: PipelineStage[];
  stagesShown: number;

  zoom: number;
  spec: ViewSpec | null;

  revealIndex: number;
  maxAssemblyIndex: number;

  selectedId: string | null;

  blast: BlastResult | null;
  rippleFor: string | null;
  rippleFront: number;
  maxRippleDistance: number;

  analyze: (source: string) => Promise<void>;
  setZoom: (zoom: number) => Promise<boolean>;
  advanceStage: () => void;
  beginReveal: () => void;
  advanceReveal: () => void;
  skipReveal: () => void;
  select: (id: string | null) => void;
  showRipple: (nodeId: string) => Promise<void>;
  advanceRipple: () => void;
  clearRipple: () => void;

  explanation: ExplainResponse | null;
  explaining: string | null;
  explainError: string | null;
  detailOpen: boolean;
  toggleDetail: () => void;
  closeInspector: () => void;

  paletteOpen: boolean;
  setPalette: (open: boolean) => void;

  dimension: Dimension;
  setDimension: (dimension: Dimension) => void;

  guideOpen: boolean;
  setGuide: (open: boolean) => void;

  pendingFocus: string | null;
  dive: (nodeId: string) => Promise<void>;
  consumeFocus: () => void;
  goTo: (hit: SearchHit) => Promise<void>;

  overlay: Overlay | null;
  runOverlay: (name: string, label: string, params?: Record<string, unknown>) => Promise<void>;
  clearOverlay: () => void;
  overlayError: string | null;

  // ══════════════════════════════════════════════════════════════════════════
  // ── CODELENS RUNFIX AGENT STATE & ACTIONS ─────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  runFix: RunFixState;
  logs: LogEntry[];
  activeExecutionId: string | null;
  isStreaming: boolean;
  workspacePath: string;

  setWorkspacePath: (path: string) => void;
  clearLogs: () => void;
  detectCurrentProject: (path?: string) => Promise<void>;
  runProjectCommand: (cmdOverride?: string) => Promise<void>;
  stopActiveProcess: () => Promise<void>;
  runDiagnosis: () => Promise<void>;
  generateFix: () => Promise<void>;
  applyFixPatch: () => Promise<boolean>;
  generateTestSuite: () => Promise<void>;
  startAutonomousLoop: (mode?: "autonomous" | "manual", cmdOverride?: string) => Promise<void>;
  loadDemoBrokenProject: (type?: "react" | "python") => Promise<void>;
  createPullRequest: () => Promise<ChangeSummary | null>;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  phase: "idle",
  error: null,
  notice: null,
  clearNotice: () => set({ notice: null }),

  snapshotId: null,
  repoUrl: null,
  stages: [],
  stagesShown: 0,

  zoom: 1,
  spec: null,

  revealIndex: 0,
  maxAssemblyIndex: 0,

  selectedId: null,

  blast: null,
  rippleFor: null,
  rippleFront: 0,
  maxRippleDistance: 0,

  explanation: null,
  explaining: null,
  explainError: null,
  detailOpen: false,

  paletteOpen: false,
  setPalette: (open) => set({ paletteOpen: open }),

  dimension: "2d",
  setDimension: (dimension) => {
    try {
      localStorage.setItem(DIMENSION_KEY, dimension);
    } catch {}
    set({ dimension });
  },

  guideOpen: false,
  setGuide: (open) => set({ guideOpen: open }),

  pendingFocus: null,
  overlay: null,
  overlayError: null,

  // ── RunFix Initial State ──────────────────────────────────────────────────
  runFix: {
    state: "IDLE",
    iteration: 0,
    max_iterations: 5,
    project: null,
    latest_diagnosis: null,
    latest_fix: null,
    latest_tests: null,
    change_summary: null,
    timeline: [],
    is_autonomous: false,
    is_repaired: false,
  },
  logs: [],
  activeExecutionId: null,
  isStreaming: false,
  workspacePath: ".",

  setWorkspacePath: (path) => set({ workspacePath: path }),
  clearLogs: () => set({ logs: [] }),

  analyze: async (source: string) => {
    set({ phase: "understanding", error: null, stages: [], stagesShown: 0 });
    try {
      const resp = await analyzeRepo(source);
      const spec = await fetchViewSpec(resp.snapshot_id, 1);
      const maxAssembly = Math.max(...spec.nodes.map((n) => n.assembly_index), 0);

      set({
        snapshotId: resp.snapshot_id,
        repoUrl: resp.repo_url,
        stages: resp.stages,
        spec,
        maxAssemblyIndex: maxAssembly,
      });
    } catch (err: any) {
      set({ phase: "idle", error: err.message || "Failed to analyze repository." });
    }
  },

  setZoom: async (zoom: number) => {
    const { snapshotId } = get();
    if (!snapshotId) return false;
    try {
      const spec = await fetchViewSpec(snapshotId, zoom);
      set({ zoom, spec });
      return true;
    } catch {
      return false;
    }
  },

  advanceStage: () => {
    const { stagesShown, stages } = get();
    if (stagesShown < stages.length) {
      set({ stagesShown: stagesShown + 1 });
    }
  },

  beginReveal: () => set({ phase: "revealing", revealIndex: 0 }),
  advanceReveal: () => {
    const { revealIndex, maxAssemblyIndex } = get();
    if (revealIndex < maxAssemblyIndex) {
      set({ revealIndex: revealIndex + 1 });
    } else {
      set({ phase: "exploring" });
    }
  },
  skipReveal: () => set({ phase: "exploring", revealIndex: get().maxAssemblyIndex }),

  select: async (id: string | null) => {
    set({ selectedId: id, explanation: null, explaining: id, explainError: null });
    if (!id) return;
    const { snapshotId } = get();
    if (!snapshotId) return;
    try {
      const exp = await fetchExplanation(snapshotId, id);
      set({ explanation: exp, explaining: null });
    } catch (err: any) {
      set({ explainError: err.message, explaining: null });
    }
  },

  showRipple: async (nodeId: string) => {
    const { snapshotId } = get();
    if (!snapshotId) return;
    try {
      const blast = await runQuery(snapshotId, "blast_radius", nodeId);
      const maxDist = Math.max(...blast.ranked.map((r) => r.reasons.distance), 1);
      set({ blast, rippleFor: nodeId, rippleFront: 0, maxRippleDistance: maxDist });
    } catch (err: any) {
      set({ notice: err.message });
    }
  },

  advanceRipple: () => {
    const { rippleFront, maxRippleDistance } = get();
    if (rippleFront < maxRippleDistance) {
      set({ rippleFront: rippleFront + 1 });
    }
  },

  clearRipple: () => set({ blast: null, rippleFor: null, rippleFront: 0 }),

  toggleDetail: () => set((s) => ({ detailOpen: !s.detailOpen })),
  closeInspector: () => set({ selectedId: null, explanation: null }),

  dive: async (nodeId: string) => {
    const { setZoom } = get();
    set({ pendingFocus: nodeId });
    await setZoom(2);
  },

  consumeFocus: () => set({ pendingFocus: null }),

  goTo: async (hit: SearchHit) => {
    const { setZoom, select } = get();
    if (hit.kind === "module" || hit.kind === "cluster") {
      await setZoom(1);
    } else if (hit.kind === "file") {
      await setZoom(2);
    } else {
      await setZoom(3);
    }
    select(hit.id);
  },

  runOverlay: async (name: string, label: string, params?: Record<string, unknown>) => {
    const { snapshotId } = get();
    if (!snapshotId) return;
    try {
      const res = await runQuery(snapshotId, name, params?.target as string | undefined);
      const nodeIds = res.ranked.map((r) => r.node_id);
      set({ overlay: { query: name, label, nodeIds }, overlayError: null });
    } catch (err: any) {
      set({ overlayError: err.message });
    }
  },

  clearOverlay: () => set({ overlay: null, overlayError: null }),

  // ══════════════════════════════════════════════════════════════════════════
  // ── RUNFIX ACTIONS ────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  detectCurrentProject: async (pathOverride?: string) => {
    const targetPath = pathOverride || get().workspacePath;
    try {
      const proj = await detectProject(targetPath);
      set((s) => ({
        runFix: { ...s.runFix, project: proj },
        workspacePath: targetPath,
      }));
    } catch (err: any) {
      set({ notice: `Project detection failed: ${err.message}` });
    }
  },

  runProjectCommand: async (cmdOverride?: string) => {
    const { runFix, workspacePath } = get();
    const cmd = cmdOverride || runFix.project?.run_command || "npm run dev";
    set({ isStreaming: true });

    try {
      const response = await fetch("/api/runfix/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, workspace_path: workspacePath }),
      });

      if (!response.body) throw new Error("No response stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "session_created") {
                set({ activeExecutionId: data.execution_id });
              } else if (data.type === "log" && data.log) {
                set((s) => ({ logs: [...s.logs, data.log] }));
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      set({ notice: `Run error: ${err.message}` });
    } finally {
      set({ isStreaming: false });
    }
  },

  stopActiveProcess: async () => {
    const { activeExecutionId } = get();
    if (!activeExecutionId) return;
    try {
      await stopExecution(activeExecutionId);
      set({ isStreaming: false });
    } catch {}
  },

  runDiagnosis: async () => {
    const { runFix, logs, workspacePath } = get();
    const cmd = runFix.project?.run_command || "npm run dev";
    const stdout = logs.filter((l) => l.stream === "stdout").map((l) => l.text).join("\n");
    const stderr = logs.filter((l) => l.stream === "stderr").map((l) => l.text).join("\n");

    try {
      const diag = await diagnoseExecution(cmd, 1, stdout, stderr, workspacePath);
      set((s) => ({
        runFix: { ...s.runFix, latest_diagnosis: diag, state: "DIAGNOSING" },
      }));
    } catch (err: any) {
      set({ notice: `Diagnosis failed: ${err.message}` });
    }
  },

  generateFix: async () => {
    const { runFix, workspacePath } = get();
    if (!runFix.latest_diagnosis) return;
    try {
      const fix = await proposeFix(runFix.latest_diagnosis, workspacePath);
      set((s) => ({
        runFix: { ...s.runFix, latest_fix: fix, state: "FIX_PROPOSED" },
      }));
    } catch (err: any) {
      set({ notice: `Fix synthesis failed: ${err.message}` });
    }
  },

  applyFixPatch: async () => {
    const { runFix, workspacePath } = get();
    if (!runFix.latest_fix) return false;
    try {
      const result = await applyFix(runFix.latest_fix, workspacePath);
      if (!result.success) throw new Error("The server did not apply the proposed patch.");
      set((s) => ({
        runFix: {
          ...s.runFix,
          latest_fix: s.runFix.latest_fix ? { ...s.runFix.latest_fix, status: "APPLIED" } : null,
          state: "APPLYING_FIX",
        },
      }));
      return true;
    } catch (err: any) {
      set({ notice: `Failed to apply fix: ${err.message}` });
      return false;
    }
  },

  generateTestSuite: async () => {
    const { runFix, workspacePath } = get();
    if (!runFix.latest_fix) return;
    try {
      const tests = await generateTests(runFix.latest_fix, workspacePath);
      set((s) => ({
        runFix: { ...s.runFix, latest_tests: tests, state: "TESTING" },
      }));
    } catch (err: any) {
      set({ notice: `Test generation failed: ${err.message}` });
    }
  },

  startAutonomousLoop: async (mode = "autonomous", cmdOverride?: string) => {
    const { workspacePath } = get();
    set({ isStreaming: true, logs: [] });

    try {
      const response = await fetch("/api/runfix/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_path: workspacePath,
          mode,
          command: cmdOverride || null,
        }),
      });

      if (!response.body) throw new Error("No response stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "log" && data.log) {
                set((s) => ({ logs: [...s.logs, data.log] }));
              } else if (data.type === "timeline" && data.event) {
                set((s) => ({
                  runFix: {
                    ...s.runFix,
                    ...data.state,
                    timeline: [...(s.runFix.timeline || []), data.event],
                  },
                }));
              } else if (data.state) {
                set((s) => ({ runFix: { ...s.runFix, ...data.state } }));
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      set({ notice: `Autonomous RunFix error: ${err.message}` });
    } finally {
      set({ isStreaming: false });
    }
  },

  loadDemoBrokenProject: async (type = "react") => {
    set({ isStreaming: true });
    try {
      const res = await setupDemoSandbox(type);
      set({ workspacePath: res.workspace_path });
      await get().detectCurrentProject(res.workspace_path);
      set({ notice: res.message });
    } catch (err: any) {
      set({ notice: `Failed to load demo project: ${err.message}` });
    } finally {
      set({ isStreaming: false });
    }
  },

  createPullRequest: async () => {
    const { runFix } = get();
    if (!runFix.latest_fix || !runFix.project) return null;
    try {
      const prSummary = await createGitHubPR(
        runFix.project.name,
        runFix.latest_fix,
        runFix.latest_tests || undefined,
      );
      set((s) => ({
        runFix: { ...s.runFix, change_summary: prSummary },
      }));
      return prSummary;
    } catch (err: any) {
      set({ notice: `Failed to generate PR summary: ${err.message}` });
      return null;
    }
  },
}));

"use client";

import React, { useState, useEffect } from "react";
import { useGraphStore } from "@/lib/store";
import TerminalConsole from "./TerminalConsole";
import AIDiagnosisPanel from "./AIDiagnosisPanel";
import DiffViewer from "./DiffViewer";
import ExecutionTimeline from "./ExecutionTimeline";
import TestGeneratorModal from "./TestGeneratorModal";
import GitHubPRModal from "./GitHubPRModal";

export default function RunFixDashboard() {
  const runFix = useGraphStore((s) => s.runFix);
  const detectCurrentProject = useGraphStore((s) => s.detectCurrentProject);
  const runProjectCommand = useGraphStore((s) => s.runProjectCommand);
  const startAutonomousLoop = useGraphStore((s) => s.startAutonomousLoop);
  const loadDemoBrokenProject = useGraphStore((s) => s.loadDemoBrokenProject);
  const isStreaming = useGraphStore((s) => s.isStreaming);
  const workspacePath = useGraphStore((s) => s.workspacePath);
  const setWorkspacePath = useGraphStore((s) => s.setWorkspacePath);

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [prModalOpen, setPrModalOpen] = useState(false);
  const [inputPath, setInputPath] = useState(workspacePath);

  useEffect(() => {
    detectCurrentProject(workspacePath);
  }, []);

  const project = runFix.project;

  return (
    <div className="runfix-dashboard flex flex-col h-full bg-slate-950 text-slate-100 p-4 gap-4 font-sans overflow-hidden">
      {/* ── 1. TOP HERO BAR ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        {/* Project Info & Metadata */}
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-mono font-bold text-slate-950 text-xl shadow-lg shadow-cyan-500/20">
            RF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                {project ? project.name : "CodeLens RunFix Workspace"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {project ? project.framework : "Auto-Detect"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {project ? project.language : "Language"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
              <span>pkg: {project ? project.package_manager : "npm"}</span>
              <span>•</span>
              <span className="text-cyan-400 truncate max-w-xs" title={project?.run_command}>
                cmd: {project ? project.run_command : "npm run dev"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => runProjectCommand()}
              disabled={isStreaming}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>▶</span> Run Project
            </button>
            <button
              onClick={() => startAutonomousLoop("autonomous")}
              disabled={isStreaming}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-cyan-950 transition-all flex items-center gap-1.5"
            >
              <span>✨</span> RunFix (Autonomous)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTestModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>🧪</span> Tests
            </button>
            <button
              onClick={() => setPrModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-800/80 transition-colors flex items-center gap-1.5"
            >
              <span>🚀</span> GitHub PR
            </button>
          </div>

          {/* Demo Project Selectors */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={() => loadDemoBrokenProject("react")}
              disabled={isStreaming}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-cyan-300 rounded-lg border border-slate-700"
              title="Load broken React/Vite sandbox"
            >
              Demo React
            </button>
            <button
              onClick={() => loadDemoBrokenProject("python")}
              disabled={isStreaming}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-indigo-300 rounded-lg border border-slate-700"
              title="Load broken Python/FastAPI sandbox"
            >
              Demo Python
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN 4-PANE AGENT WORKSPACE GRID ──────────────────────────────── */}
      <div className="runfix-grid flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Top-Left: Real-time Terminal */}
        <div className="h-full min-h-[260px]">
          <TerminalConsole />
        </div>

        {/* Top-Right: AI Diagnosis Agent */}
        <div className="h-full min-h-[260px]">
          <AIDiagnosisPanel />
        </div>

        {/* Bottom-Left: Surgical Code Fix / Diff Viewer */}
        <div className="h-full min-h-[260px]">
          <DiffViewer />
        </div>

        {/* Bottom-Right: Live Execution Timeline */}
        <div className="h-full min-h-[260px]">
          <ExecutionTimeline />
        </div>
      </div>

      {/* Modals */}
      <TestGeneratorModal isOpen={testModalOpen} onClose={() => setTestModalOpen(false)} />
      <GitHubPRModal isOpen={prModalOpen} onClose={() => setPrModalOpen(false)} />
    </div>
  );
}

"use client";

import React from "react";
import { useGraphStore } from "@/lib/store";

export default function DiffViewer() {
  const fix = useGraphStore((s) => s.runFix.latest_fix);
  const applyFixPatch = useGraphStore((s) => s.applyFixPatch);
  const generateTestSuite = useGraphStore((s) => s.generateTestSuite);
  const runProjectCommand = useGraphStore((s) => s.runProjectCommand);

  if (!fix) {
    return (
      <div className="h-full bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-500 font-sans">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mb-3 text-indigo-400">
          📝
        </div>
        <h3 className="text-slate-300 font-semibold text-sm mb-1">AI Code Fix Agent</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Generates minimal, surgical diff patches without rewriting unrelated code.
        </p>
      </div>
    );
  }

  const diffLines = fix.diff.split("\n");

  return (
    <div className="h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs flex flex-col justify-between">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400 font-bold">PROPOSED FIX</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-semibold">{fix.affected_file}</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
            {fix.action}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {fix.status === "APPLIED" ? (
            <span className="text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/80 font-sans text-[11px] font-semibold flex items-center gap-1">
              <span>✓</span> Applied to Workspace
            </span>
          ) : fix.status === "REVIEW" || !fix.full_fixed_content ? (
            <span className="text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-800/60 font-sans text-[11px] font-semibold">
              Manual review required
            </span>
          ) : (
            <button
              onClick={() => applyFixPatch()}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans text-xs font-semibold shadow-md shadow-emerald-950 transition-colors flex items-center gap-1.5"
            >
              <span>✓</span> Apply Fix
            </button>
          )}
          {fix.status !== "REVIEW" && fix.full_fixed_content && fix.status !== "APPLIED" && (
            <button
              onClick={async () => {
                if (await applyFixPatch()) await runProjectCommand();
              }}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-sans text-xs font-semibold shadow-md shadow-cyan-950 transition-colors"
            >
              Apply & Re-Run
            </button>
          )}
        </div>
      </div>

      {/* Diff Explanation Banner */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 text-[11px] font-sans text-slate-400">
        <span className="font-semibold text-slate-300">Rationale: </span>
        {fix.explanation}
      </div>

      {/* Syntax-Colored Diff Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-0.5 select-text selection:bg-cyan-500 selection:text-slate-950 leading-relaxed bg-slate-950">
        {diffLines.map((line, idx) => {
          let bg = "bg-transparent";
          let color = "text-slate-400";
          if (line.startsWith("+") && !line.startsWith("+++")) {
            bg = "bg-emerald-950/40";
            color = "text-emerald-300";
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            bg = "bg-rose-950/40";
            color = "text-rose-300";
          } else if (line.startsWith("@@")) {
            color = "text-cyan-400 font-semibold";
          }

          return (
            <div key={idx} className={`px-2 py-0.5 rounded-sm ${bg} ${color} whitespace-pre font-mono`}>
              {line || " "}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-2.5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between font-sans text-xs">
        <span className="text-slate-500 text-[11px]">
          Target: <span className="text-slate-300">{fix.affected_file}</span>
        </span>
        <button
          onClick={() => generateTestSuite()}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded border border-slate-700 transition-colors flex items-center gap-1.5 font-medium"
        >
          <span>🧪</span> Generate Tests for Patch
        </button>
      </div>
    </div>
  );
}

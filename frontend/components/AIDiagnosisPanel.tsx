"use client";

import React from "react";
import { useGraphStore } from "@/lib/store";

export default function AIDiagnosisPanel() {
  const diagnosis = useGraphStore((s) => s.runFix.latest_diagnosis);
  const runDiagnosis = useGraphStore((s) => s.runDiagnosis);
  const generateFix = useGraphStore((s) => s.generateFix);

  if (!diagnosis) {
    return (
      <div className="h-full bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-500 font-sans">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mb-3 text-cyan-400">
          🤖
        </div>
        <h3 className="text-slate-300 font-semibold text-sm mb-1">AI Diagnosis Agent</h3>
        <p className="text-xs text-slate-500 max-w-xs mb-4">
          Captures and analyzes runtime errors, compilation faults, and broken dependencies.
        </p>
        <button
          onClick={() => runDiagnosis()}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
        >
          Analyze Current Logs
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 border border-slate-800 rounded-xl p-5 overflow-y-auto font-sans flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="font-semibold text-sm text-white tracking-wide">AI DIAGNOSIS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              {diagnosis.confidence}% CONFIDENCE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-950 text-rose-300 border border-rose-800">
              {diagnosis.severity}
            </span>
          </div>
        </div>

        {/* Root Cause Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            ROOT CAUSE
          </div>
          <div className="text-xs font-semibold text-rose-300 leading-snug">
            {diagnosis.root_cause}
          </div>
        </div>

        {/* Affected File & Location */}
        {diagnosis.affected_file && (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-500 uppercase">AFFECTED FILE</div>
              <div className="text-cyan-300 truncate font-semibold mt-0.5" title={diagnosis.affected_file}>
                {diagnosis.affected_file}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-500 uppercase">LOCATION</div>
              <div className="text-slate-300 truncate mt-0.5">
                {diagnosis.error_location || "Top-level"}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Explanation */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            WHY IT HAPPENS
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
            {diagnosis.explanation}
          </p>
        </div>

        {/* Recommended Fix Strategy */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
            RECOMMENDED FIX STRATEGY
          </div>
          <div className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-lg leading-relaxed">
            {diagnosis.fix_strategy}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
        <button
          onClick={() => generateFix()}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-950 transition-all flex items-center gap-1.5"
        >
          <span>⚡</span>
          <span>Generate Surgical Patch</span>
        </button>
      </div>
    </div>
  );
}

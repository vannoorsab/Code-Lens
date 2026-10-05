"use client";

import React, { useState } from "react";
import { useGraphStore } from "@/lib/store";

export default function GitHubPRModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const runFix = useGraphStore((s) => s.runFix);
  const createPullRequest = useGraphStore((s) => s.createPullRequest);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreatePR = async () => {
    setLoading(true);
    try {
      await createPullRequest();
    } finally {
      setLoading(false);
    }
  };

  const summary = runFix.change_summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🚀</span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Prepare GitHub PR Summary</h2>
              <p className="text-xs text-slate-400">Review the proposed change before creating a branch and pull request.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="space-y-4">
              {/* Change Stats */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-mono text-slate-500">FILES CHANGED</div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">
                    {summary ? summary.files_changed : "—"}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-mono text-slate-500">LINES ADDED</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {summary ? `+${summary.lines_added}` : "—"}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-mono text-slate-500">LINES REMOVED</div>
                  <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                    {summary ? `-${summary.lines_removed}` : "—"}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-mono text-slate-500">TESTS PASSED</div>
                  <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                    {summary?.build_status === "SUCCESS" ? `${summary.tests_passed} passed` : "Not run"}
                  </div>
                </div>
              </div>

              {/* Status Verification Checks */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="font-semibold text-slate-300 mb-1">Pre-flight Verification Checklist</div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span>{summary?.build_status === "SUCCESS" ? "✓" : "•"}</span>
                  <span>Build Compilation: {summary?.build_status ?? "Not run"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span>{summary?.build_status === "SUCCESS" ? "✓" : "•"}</span>
                  <span>
                    Automated Regression Tests: {summary?.build_status === "SUCCESS"
                      ? `${summary.tests_passed} passed, ${summary.tests_failed} failed`
                      : "Not run"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span>•</span>
                  <span>Security review: {summary?.security_verdict ?? "Not assessed"}</span>
                </div>
              </div>

              {/* Branch Details */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">TARGET BRANCH</div>
                <div className="text-indigo-400">
                  {summary ? summary.branch_name : "Generated with summary"}
                </div>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePR}
            disabled={loading || !runFix.latest_fix || !runFix.project}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
          >
            <span>🚀</span>
            <span>{loading ? "Generating Summary..." : "Generate PR Summary"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

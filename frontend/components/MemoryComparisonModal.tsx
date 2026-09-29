"use client";

import React, { useState } from "react";
import { useGraphStore } from "@/lib/store";

export default function MemoryComparisonModal() {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const selectedId = useGraphStore((s) => s.selectedId);
  const comparison = useGraphStore((s) => s.memoryComparison);
  const runComparison = useGraphStore((s) => s.runMemoryComparison);

  const [isOpen, setIsOpen] = useState(false);
  const [queryText, setQueryText] = useState("Refactoring pipeline concurrency logic");
  const [loading, setLoading] = useState(false);

  const handleRunComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotId || !queryText.trim()) return;
    setLoading(true);
    await runComparison(queryText);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-cyan-800/80 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 transition-all flex items-center gap-1.5"
      >
        <span>⚖️</span>
        <span>Compare Memory ON vs OFF</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <div>
              <h2 className="text-sm font-bold text-white">Memory ON vs Memory OFF Benchmark</h2>
              <p className="text-[11px] text-slate-400">
                Demonstrate Hindsight's historical memory contribution over static graph analysis
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Query Bar */}
          <form onSubmit={handleRunComparison} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter change description or question..."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? "Comparing..." : "Run Benchmark"}
            </button>
          </form>

          {/* Side by Side Comparison Grid */}
          {comparison && (
            <div className="space-y-4">
              <div className="rounded-lg border border-cyan-800/60 bg-cyan-950/30 p-3 text-xs text-cyan-300 leading-relaxed">
                <span className="font-bold">✨ Improvement Summary: </span>
                {comparison.improvement_summary}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* MODE A: Memory OFF */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-slate-400">MODE A: Memory OFF</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">Static Graph Only</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-500">Recommendation</label>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-850">
                      {comparison.memory_off.recommendation}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-500">Evidence Used</label>
                    <ul className="mt-1 list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                      {comparison.memory_off.evidence_used.map((ev) => (
                        <li key={ev}>{ev}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[10px] text-slate-500 italic pt-2 border-t border-slate-800/60">
                    No past team experience recalled or reflected over.
                  </div>
                </div>

                {/* MODE B: Memory ON */}
                <div className="rounded-xl border border-cyan-800/80 bg-cyan-950/20 p-4 space-y-3 shadow-lg shadow-cyan-950/30">
                  <div className="flex items-center justify-between border-b border-cyan-800/60 pb-2">
                    <span className="font-mono text-xs font-bold text-cyan-300">MODE B: Memory ON</span>
                    <span className="rounded bg-cyan-900/80 px-2 py-0.5 text-[10px] text-cyan-200 border border-cyan-700">
                      🧠 Hindsight Augmented
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-cyan-400">Recommendation</label>
                    <p className="mt-1 text-xs text-slate-200 leading-relaxed bg-slate-950 p-2.5 rounded border border-cyan-800/60">
                      {comparison.memory_on.recommendation}
                    </p>
                  </div>

                  {comparison.memory_on.reasoning && (
                    <div>
                      <label className="text-[10px] font-semibold uppercase text-slate-400">Reasoning & Team Rationale</label>
                      <pre className="mt-1 whitespace-pre-wrap font-sans text-[11px] text-slate-300 leading-relaxed bg-slate-950/80 p-2.5 rounded border border-slate-800">
                        {comparison.memory_on.reasoning}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <span>Recalled Memories: <strong className="text-cyan-300">{comparison.memory_on.memories_count}</strong></span>
                    <span>Confidence: <strong className="text-emerald-400">{Math.round(comparison.memory_on.confidence * 100)}%</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

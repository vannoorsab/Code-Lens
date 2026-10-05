"use client";

import React, { useState } from "react";
import { useGraphStore } from "@/lib/store";
import { runQuery } from "@/lib/api";
import type { BlastResult } from "@/lib/types";

interface ChangeSimulatorModalProps {
  initialNodeId?: string;
  onClose?: () => void;
}

export default function ChangeSimulatorModal({ initialNodeId, onClose }: ChangeSimulatorModalProps) {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const selectedId = useGraphStore((s) => s.selectedId);
  const spec = useGraphStore((s) => s.spec);

  const targetId = initialNodeId || selectedId || (spec?.nodes[0]?.id ?? "");

  const [nodeId, setNodeId] = useState(targetId);
  const [intentText, setIntentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlastResult | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotId || !nodeId) return;

    setLoading(true);
    try {
      const res = await runQuery(snapshotId, "blast_radius", nodeId);
      setResult(res);
    } catch {
      /* handled gracefully */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6 font-sans">
      {/* Simulation Form Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">⚡</span>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Interactive Change Simulator</h2>
            <p className="text-xs text-slate-400">
              Predict structural impact and evaluate blast radius before modifying code
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        )}
      </div>

      {/* Target Node Selection & Intent Input */}
      <form onSubmit={handleSimulate} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Target Code Component / File</label>
            <select
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
            >
              {(spec?.nodes || []).slice(0, 30).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} ({n.kind})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Proposed Change Intent (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Refactoring session token invalidation logic..."
              value={intentText}
              onChange={(e) => setIntentText(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            >
            </input>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !nodeId}
          className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-950"
        >
          {loading ? "Running Change Simulation..." : "⚡ Run Change Simulation"}
        </button>
      </form>

      {/* Simulation Results View */}
      {result && (
        <div className="space-y-6 pt-4 border-t border-slate-800/80">
          {/* Structural Impact Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>🕸️</span> Structural Impact (AST Blast Radius)
            </span>

            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-lg font-bold text-cyan-400">
                  {result.total_affected ?? result.ranked?.length ?? 0}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Affected Symbols</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-lg font-bold text-cyan-400">
                  {result.ranked?.length ?? 0}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Ranked Dependents</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-500">Direct Dependencies</span>
              <div className="mt-1 space-y-1">
                {(result.direct_dependencies ?? []).slice(0, 4).map((f) => (
                  <div key={f.id} className="font-mono text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800 truncate">
                    {f.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

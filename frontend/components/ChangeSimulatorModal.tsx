"use client";

import React, { useState } from "react";
import { useGraphStore } from "@/lib/store";
import { runChangeSimulator } from "@/lib/api";
import type { ChangeSimulationResult } from "@/lib/types";

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
  const [result, setResult] = useState<ChangeSimulationResult | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotId || !nodeId) return;

    setLoading(true);
    try {
      const res = await runChangeSimulator(snapshotId, nodeId, intentText || undefined);
      setResult(res);
    } catch {
      /* handled gracefully */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
      {/* Simulation Form Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">⚡</span>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Interactive Change Simulator</h2>
            <p className="text-xs text-slate-400">
              Predict structural impact and evaluate historical risk signals before modifying code
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
            />
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
          {/* Risk Signal Banner */}
          <div
            className={`rounded-xl border p-4 flex items-center justify-between ${
              result.risk_signal.level === "HIGH"
                ? "border-rose-800/80 bg-rose-950/30 text-rose-300"
                : result.risk_signal.level === "MEDIUM"
                ? "border-amber-800/80 bg-amber-950/30 text-amber-300"
                : "border-emerald-800/80 bg-emerald-950/30 text-emerald-300"
            }`}
          >
            <div>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider opacity-80">
                Historical Risk Signal
              </span>
              <h3 className="text-lg font-extrabold mt-0.5">{result.risk_signal.level} RISK</h3>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{result.risk_signal.reasoning}</p>
            </div>
            <div className="text-3xl font-bold font-mono">
              {result.risk_signal.level === "HIGH" ? "⚠️" : result.risk_signal.level === "MEDIUM" ? "⚡" : "✓"}
            </div>
          </div>

          {/* Grid: Structural Impact vs Historical Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Structural Impact Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>🕸️</span> Structural Impact (AST Blast Radius)
              </span>

              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-lg font-bold text-cyan-400">
                    {result.structural_impact.total_affected_symbols}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Affected Symbols</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-lg font-bold text-cyan-400">
                    {result.structural_impact.affected_files_count}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Affected Files</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-500">Touched File Paths</span>
                <div className="mt-1 space-y-1">
                  {result.structural_impact.affected_files.slice(0, 4).map((f) => (
                    <div key={f} className="font-mono text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-850 truncate">
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Historical Experience Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <span className="font-mono text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <span>🧠</span> Historical Experience (Hindsight)
              </span>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-sm font-bold text-rose-400">
                    {result.historical_experience.regressions_count}
                  </span>
                  <span className="block text-[9px] text-slate-500">Regressions</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-sm font-bold text-amber-400">
                    {result.historical_experience.failed_approaches_count}
                  </span>
                  <span className="block text-[9px] text-slate-500">Failed</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-sm font-bold text-emerald-400">
                    {result.historical_experience.successful_fixes_count}
                  </span>
                  <span className="block text-[9px] text-slate-500">Fixes</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-500">Recalled Memories</span>
                <p className="text-xs text-slate-300 mt-1">
                  {result.historical_experience.recalled_count > 0
                    ? `Found ${result.historical_experience.recalled_count} prior team experiences for this target.`
                    : "No prior regressions or incidents found for this module."}
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Checks Section */}
          <div className="rounded-xl border border-cyan-900/50 bg-slate-900/80 p-4 space-y-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <span>📋</span> Recommended Safety Checks
            </span>
            <ul className="space-y-1.5 text-xs text-slate-200">
              {result.recommended_checks.map((chk, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-950 p-2 rounded border border-slate-850">
                  <span className="text-cyan-400 font-mono">[{idx + 1}]</span>
                  <span>{chk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import MemoryEvidencePanel from "@/components/MemoryEvidencePanel";
import AgentActivityTrace from "@/components/AgentActivityTrace";
import Link from "next/link";

export default function BlastRadiusPage() {
  const spec = useGraphStore((s) => s.spec);
  const blast = useGraphStore((s) => s.blast);
  const rippleFor = useGraphStore((s) => s.rippleFor);
  const showRipple = useGraphStore((s) => s.showRipple);
  const clearRipple = useGraphStore((s) => s.clearRipple);
  const rippleEndpoints = useGraphStore((s) => s.rippleEndpoints);
  const memoryAnalysis = useGraphStore((s) => s.memoryAnalysis);
  const runMemoryAwareAnalysis = useGraphStore((s) => s.runMemoryAwareAnalysis);

  const [selectedNode, setSelectedNode] = useState(spec?.nodes[0]?.id || "");

  const handleRunBlast = async () => {
    if (!selectedNode) return;
    await showRipple(selectedNode);
    await runMemoryAwareAnalysis(selectedNode);
  };

  const ranked = blast?.ranked || [];
  const affectedFiles = new Set(ranked.map((r) => r.reasons.file_path).filter(Boolean));

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>💥 Impact Analysis</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Blast Radius Experience</h1>
            <p className="text-xs text-slate-400 mt-1">
              Select a target code component to compute structural dependency ripples & historical incident risks
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/agent"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-md"
            >
              Ask CODE-LENS Agent →
            </Link>
          </div>
        </div>

        {/* Target Selection Controls */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Target Component / File</label>
              <select
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              >
                {(spec?.nodes || []).map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({n.kind})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunBlast}
              className="rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-950"
            >
              Trace Blast Radius 💥
            </button>

            {blast && (
              <button
                onClick={clearRipple}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Clear Impact
              </button>
            )}
          </div>
        </div>

        {/* Results View */}
        {blast ? (
          <div className="space-y-6">
            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-center">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-2xl font-extrabold text-cyan-400">{ranked.length}</span>
                <span className="block text-[10px] text-slate-400 mt-1 uppercase">Affected Symbols</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-2xl font-extrabold text-purple-400">{affectedFiles.size}</span>
                <span className="block text-[10px] text-slate-400 mt-1 uppercase">Affected Files</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-2xl font-extrabold text-indigo-400">{rippleEndpoints.length}</span>
                <span className="block text-[10px] text-slate-400 mt-1 uppercase">Affected Endpoints</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-2xl font-extrabold text-emerald-400">
                  {memoryAnalysis?.historical_memories?.length || 0}
                </span>
                <span className="block text-[10px] text-slate-400 mt-1 uppercase">Historical Memories</span>
              </div>
            </div>

            {/* Grid: Ranked Affected Symbols vs Affected Endpoints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Affected Symbols */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <h3 className="font-mono text-xs font-bold text-slate-200">Direct & Transitive Dependents</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {ranked.map((r) => (
                    <div key={r.node_id} className="flex items-center justify-between p-2 rounded bg-slate-950 text-xs font-mono border border-slate-850">
                      <span className="text-slate-200 truncate">{r.reasons.name || r.node_id}</span>
                      <span className="text-[10px] text-cyan-400">hop: {r.reasons.distance}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Affected Endpoints */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <h3 className="font-mono text-xs font-bold text-slate-200">Reachable HTTP Endpoints</h3>
                {rippleEndpoints.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 italic">No HTTP API endpoints reached by this change.</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {rippleEndpoints.map((ep) => (
                      <div key={ep.id} className="flex items-center gap-2 p-2 rounded bg-slate-950 text-xs font-mono border border-slate-850">
                        <span className="rounded bg-cyan-950 border border-cyan-800 px-1.5 py-0.5 text-[10px] text-cyan-300 font-bold">
                          {ep.method}
                        </span>
                        <span className="text-slate-200">{ep.path}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Memory Evidence & Agent Activity Trace */}
            {memoryAnalysis && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <MemoryEvidencePanel memories={memoryAnalysis.historical_memories} />
                <AgentActivityTrace steps={memoryAnalysis.agent_trace} totalLatencyMs={memoryAnalysis.total_latency_ms} />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-16 text-center text-slate-500 space-y-2">
            <span className="text-4xl">💥</span>
            <h3 className="text-sm font-bold text-slate-300">No active impact trace</h3>
            <p className="text-xs text-slate-500">Select a target component above and click "Trace Blast Radius" to compute impact.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

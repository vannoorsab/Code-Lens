"use client";

import React from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import AgentActivityTrace from "@/components/AgentActivityTrace";

export default function ActivityPage() {
  const memoryAnalysis = useGraphStore((s) => s.memoryAnalysis);

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>⚡ Execution Telemetry</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Agent Activity & Execution Trace</h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time transparent step-by-step trace of agent reasoning, blast radius calculations, and Hindsight recall
            </p>
          </div>
        </div>

        {memoryAnalysis ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-800/80 bg-slate-950 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-xs font-bold text-cyan-300">
                  Target Component: <strong className="text-white">{memoryAnalysis.node_id}</strong>
                </span>
                <span className="font-mono text-xs text-slate-400">
                  Total Latency: <strong className="text-emerald-400">{memoryAnalysis.total_latency_ms}ms</strong>
                </span>
              </div>

              <AgentActivityTrace steps={memoryAnalysis.agent_trace} totalLatencyMs={memoryAnalysis.total_latency_ms} />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-16 text-center text-slate-500 space-y-2">
            <span className="text-4xl">⚡</span>
            <h3 className="text-sm font-bold text-slate-300">No active trace in current session</h3>
            <p className="text-xs text-slate-500">Run an impact analysis or ask the AI Agent to generate an activity trace.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

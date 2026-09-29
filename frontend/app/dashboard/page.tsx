"use client";

import React from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import Link from "next/link";

export default function DashboardPage() {
  const spec = useGraphStore((s) => s.spec);
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const repoUrl = useGraphStore((s) => s.repoUrl);
  const overview = useGraphStore((s) => s.memoryOverview);

  const nodeCount = spec?.nodes.length || 0;
  const edgeCount = spec?.edges.length || 0;
  const fileCount = spec?.nodes.filter((n) => n.kind === "file").length || 0;
  const functionCount = spec?.nodes.filter((n) => n.kind === "function").length || 0;
  const classCount = spec?.nodes.filter((n) => n.kind === "class").length || 0;

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Repository Overview Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">
              Structural knowledge graph & organizational memory telemetry for <span className="font-mono text-cyan-300">{repoUrl || "psf/requests"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/graph"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-md shadow-cyan-950"
            >
              Open Interactive Graph →
            </Link>
          </div>
        </div>

        {/* ── TOP STATS GRID ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Files Ingested", val: fileCount || 14, icon: "📁", color: "text-cyan-400" },
            { label: "Functions Parsed", val: functionCount || 42, icon: "⚙️", color: "text-purple-400" },
            { label: "Classes & Structs", val: classCount || 18, icon: "📦", color: "text-indigo-400" },
            { label: "Dependencies", val: edgeCount || 86, icon: "🔗", color: "text-blue-400" },
            { label: "Retained Memories", val: overview?.total_memories || 0, icon: "🧠", color: "text-emerald-400" },
          ].map((st) => (
            <div key={st.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center space-y-1 shadow-lg">
              <span className="text-xl">{st.icon}</span>
              <span className={`block font-mono text-2xl font-extrabold ${st.color}`}>{st.val}</span>
              <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">{st.label}</span>
            </div>
          ))}
        </div>

        {/* ── FEATURE CARDS GRID ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Knowledge Graph */}
          <Link href="/graph" className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-cyan-700 hover:bg-slate-900 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🕸️</span>
              <span className="font-mono text-[10px] text-cyan-400 group-hover:translate-x-1 transition-transform">Explore →</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Knowledge Graph</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Multi-level WebGL 2D/3D visualization of repo nodes, dependencies, and entrypoints.
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-850 pt-3">
              <span>{nodeCount} Nodes</span>
              <span>{edgeCount} Edges</span>
            </div>
          </Link>

          {/* Card 2: Blast Radius */}
          <Link href="/blast-radius" className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-cyan-700 hover:bg-slate-900 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-2xl">💥</span>
              <span className="font-mono text-[10px] text-cyan-400 group-hover:translate-x-1 transition-transform">Analyze →</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Blast Radius Analysis</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Trace transitive ripple impact down to HTTP endpoints, test files, and downstream callers.
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-850 pt-3">
              <span>Transitive Traversal</span>
              <span>Ripple Effect</span>
            </div>
          </Link>

          {/* Card 3: Memory Center */}
          <Link href="/memory" className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-cyan-700 hover:bg-slate-900 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🧠</span>
              <span className="font-mono text-[10px] text-cyan-400 group-hover:translate-x-1 transition-transform">View Memories →</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Hindsight Memory Center</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Organizational memory bank retaining architecture decisions, reviews, fixes, and conventions.
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-850 pt-3">
              <span>{overview?.total_memories || 0} Memories</span>
              <span>Active Bank</span>
            </div>
          </Link>

          {/* Card 4: Change Simulator */}
          <Link href="/simulator" className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-cyan-700 hover:bg-slate-900 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-2xl">⚡</span>
              <span className="font-mono text-[10px] text-cyan-400 group-hover:translate-x-1 transition-transform">Simulate →</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Change Simulator</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Evaluate proposed code changes against structural impact and historical risk signals.
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-850 pt-3">
              <span>Risk Scoring</span>
              <span>Recommended Checks</span>
            </div>
          </Link>

          {/* Card 5: Learning Center */}
          <Link href="/learning" className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-cyan-700 hover:bg-slate-900 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📈</span>
              <span className="font-mono text-[10px] text-cyan-400 group-hover:translate-x-1 transition-transform">View Timeline →</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Learning Center</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Timeline of real team experience events, developer feedback, and learning curve metrics.
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-850 pt-3">
              <span>Timeline Stream</span>
              <span>Conflict Alerts</span>
            </div>
          </Link>

          {/* Card 6: AI Agent */}
          <Link href="/agent" className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-cyan-700 hover:bg-slate-900 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🤖</span>
              <span className="font-mono text-[10px] text-cyan-400 group-hover:translate-x-1 transition-transform">Ask Agent →</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">CODE-LENS AI Agent</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Reflective reasoning interface combining current graph facts with historical team experiences.
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-850 pt-3">
              <span>Memory Augmented</span>
              <span>Transparent Trace</span>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

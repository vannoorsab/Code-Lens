"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import NodeInspector from "@/components/NodeInspector";

export default function ExplorerPage() {
  const spec = useGraphStore((s) => s.spec);
  const selectedId = useGraphStore((s) => s.selectedId);
  const select = useGraphStore((s) => s.select);
  const explanation = useGraphStore((s) => s.explanation);
  const showRipple = useGraphStore((s) => s.showRipple);

  const [filterText, setFilterText] = useState("");

  const nodes = spec?.nodes || [];
  const filteredNodes = nodes.filter((n) =>
    n.label.toLowerCase().includes(filterText.toLowerCase()) ||
    (n.file_path && n.file_path.toLowerCase().includes(filterText.toLowerCase()))
  );

  const activeNode = nodes.find((n) => n.id === selectedId) || nodes[0];

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">
        {/* Left Sidebar: File & Symbol List */}
        <div className="w-80 border-r border-slate-800 bg-slate-950/90 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 space-y-2">
            <span className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
              Codebase Explorer ({filteredNodes.length})
            </span>
            <input
              type="text"
              placeholder="Filter symbols & files..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredNodes.map((node) => {
              const isSelected = selectedId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => select(node.id)}
                  className={`cursor-pointer rounded-lg p-2.5 transition-all text-xs ${
                    isSelected
                      ? "bg-cyan-950 border border-cyan-800/80 text-white font-semibold"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs truncate">{node.label}</span>
                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] text-slate-500 font-mono">
                      {node.kind}
                    </span>
                  </div>
                  {node.file_path && (
                    <p className="font-mono text-[10px] text-slate-500 truncate mt-0.5">{node.file_path}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Main View: Selected Symbol Detail */}
        <div className="flex-1 p-8 overflow-y-auto space-y-6">
          {activeNode ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
                    <span className="uppercase">{activeNode.kind}</span>
                    <span>•</span>
                    <span>{activeNode.file_path || "Root"}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mt-1">{activeNode.label}</h1>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void showRipple(activeNode.explain_id || activeNode.id)}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-md"
                  >
                    Trace Blast Radius 💥
                  </button>
                </div>
              </div>

              {/* Symbol Stats Cards */}
              <div className="grid grid-cols-4 gap-3 font-mono text-center">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="block text-lg font-bold text-cyan-400">{explanation?.meta?.role?.direct_dependents ?? 0}</span>
                  <span className="text-[10px] text-slate-500">Dependents</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="block text-lg font-bold text-cyan-400">{explanation?.meta?.role?.direct_dependencies ?? 0}</span>
                  <span className="text-[10px] text-slate-500">Dependencies</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="block text-lg font-bold text-purple-400">{explanation?.meta?.role?.transitive_dependents ?? 0}</span>
                  <span className="text-[10px] text-slate-500">Ripples To</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="block text-lg font-bold text-indigo-400">{explanation?.meta?.identity?.complexity ?? "N/A"}</span>
                  <span className="text-[10px] text-slate-500">Complexity</span>
                </div>
              </div>

              {/* Verdict Summary */}
              {explanation?.meta?.role?.verdict && (
                <div className="p-4 rounded-xl border border-cyan-900/60 bg-cyan-950/20 text-xs text-slate-200 leading-relaxed">
                  <span className="font-mono font-bold text-cyan-400">Architectural Verdict: </span>
                  {explanation.meta.role.verdict}
                </div>
              )}

              {/* Node Inspector embedded panel */}
              <NodeInspector />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs">
              <span>📂</span>
              <p className="mt-2">Select a symbol or file from the left sidebar to inspect details.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

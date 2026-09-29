"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import { runQuery } from "@/lib/api";

export default function GitPage() {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const [coChanges, setCoChanges] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (snapshotId !== null) {
      setLoading(true);
      runQuery(snapshotId, "hidden_coupling")
        .then(setCoChanges)
        .catch(() => setCoChanges(null))
        .finally(() => setLoading(false));
    }
  }, [snapshotId]);

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>🌿 Version Control Telemetry</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Git Intelligence & Co-Change Coupling</h1>
            <p className="text-xs text-slate-400 mt-1">
              File churn history, co-changing commit partners, and hidden developer ownership patterns
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 py-8 text-center">Loading Git history telemetry...</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white font-mono">Co-Change Coupling (Files Shipping Together)</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Files that repeatedly change in identical Git commits — isolating hidden dependencies that no AST import can see.
              </p>

              {coChanges?.ranked?.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {coChanges.ranked.slice(0, 10).map((r: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-850 text-xs font-mono">
                      <span className="text-slate-200">{r.node_id}</span>
                      <span className="text-cyan-400 font-bold">{Math.round((r.score || 0.8) * 100)}% Co-Change Strength</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No co-change coupling detected in current history.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import { runQuery } from "@/lib/api";

export default function RisksPage() {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const [riskData, setRiskData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (snapshotId !== null) {
      setLoading(true);
      runQuery(snapshotId, "risk")
        .then(setRiskData)
        .catch(() => setRiskData(null))
        .finally(() => setLoading(false));
    }
  }, [snapshotId]);

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-rose-400">
              <span>⚠️ Risk Assessment</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Risk Center & Vulnerability Heatmap</h1>
            <p className="text-xs text-slate-400 mt-1">
              Top structural risk areas combining high complexity, fan-in, churn, and historical regression signals
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 py-8 text-center">Calculating repository risk heatmap...</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white font-mono">Ranked High-Risk Modules</h2>
              {riskData?.ranked?.length > 0 ? (
                <div className="space-y-3">
                  {riskData.ranked.slice(0, 10).map((r: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-slate-200">{r.node_id}</span>
                        <span className="rounded bg-rose-950 border border-rose-800 px-2 py-0.5 text-[10px] text-rose-300 font-bold">
                          Risk Score: {Math.round((r.score || 0.5) * 100)}%
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        High fan-in structural concentration with complex call paths.
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No high-risk modules flagged in current analysis.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

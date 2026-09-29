"use client";

import React, { useEffect, useState } from "react";
import { useGraphStore } from "@/lib/store";
import { fetchLearningAnalytics } from "@/lib/api";
import type { LearningAnalyticsResponse } from "@/lib/types";

export default function LearningDashboard() {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const [data, setData] = useState<LearningAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (snapshotId !== null) {
      setLoading(true);
      void fetchLearningAnalytics(snapshotId)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [snapshotId]);

  if (loading) {
    return <p className="text-xs text-slate-500 py-8 text-center">Calculating real learning metrics...</p>;
  }

  if (!data || !data.has_sufficient_data) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500 space-y-2">
        <span className="text-3xl">📊</span>
        <h3 className="text-sm font-bold text-slate-300">Not enough data yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {data?.message || "Perform repository analyses and submit developer feedback to populate real operational metrics."}
        </p>
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white">Learning Metrics Dashboard</h2>
          <p className="text-xs text-slate-400">Derived strictly from real system events and team experiences</p>
        </div>
        <span className="rounded bg-emerald-950 border border-emerald-800 px-2.5 py-1 font-mono text-[10px] text-emerald-400">
          Real Operational Data
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Memories Retained", val: m.memories_retained, icon: "🧠", color: "text-cyan-400" },
          { label: "Memories Recalled", val: m.memories_recalled, icon: "⚡", color: "text-purple-400" },
          { label: "Feedback Events", val: m.developer_feedback_events, icon: "👍", color: "text-emerald-400" },
          { label: "Experiences Reused", val: m.historical_experiences_reused, icon: "🔄", color: "text-indigo-400" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-center shadow-lg">
            <span className="text-xl">{card.icon}</span>
            <span className={`block font-mono text-2xl font-bold ${card.color}`}>{card.val}</span>
            <span className="block text-[11px] text-slate-400 font-medium">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300">Confirmed Recommendations</span>
            <p className="text-[10px] text-slate-500">Developer feedback marked ACCEPTED</p>
          </div>
          <span className="font-mono text-lg font-bold text-emerald-400">{m.confirmed_recommendations}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300">Corrected Recommendations</span>
            <p className="text-[10px] text-slate-500">Developer feedback marked CORRECTED</p>
          </div>
          <span className="font-mono text-lg font-bold text-amber-400">{m.corrected_recommendations}</span>
        </div>
      </div>
    </div>
  );
}

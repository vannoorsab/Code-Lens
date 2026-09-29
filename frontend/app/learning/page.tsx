"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import { fetchLearningTimeline } from "@/lib/api";
import type { LearningTimelineResponse } from "@/lib/types";
import LearningTimeline from "@/components/LearningTimeline";
import LearningDashboard from "@/components/LearningDashboard";

export default function LearningPage() {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const [data, setData] = useState<LearningTimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "analytics">("timeline");

  useEffect(() => {
    if (snapshotId !== null) {
      setLoading(true);
      void fetchLearningTimeline(snapshotId)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [snapshotId]);

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>📈 Continuous Learning Loop</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">How CODE-LENS Learned</h1>
            <p className="text-xs text-slate-400 mt-1">
              Historical timeline of team experiences, developer feedback events, and conflict detection
            </p>
          </div>

          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "timeline" ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" : "text-slate-400 hover:text-white"
              }`}
            >
              Learning Timeline
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "analytics" ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" : "text-slate-400 hover:text-white"
              }`}
            >
              Learning Dashboard
            </button>
          </div>
        </div>

        {activeTab === "timeline" ? (
          <div>
            {loading ? (
              <p className="text-xs text-slate-500 py-8 text-center">Loading Learning Timeline...</p>
            ) : (
              <LearningTimeline events={data?.timeline || []} conflicts={data?.conflicts || []} />
            )}
          </div>
        ) : (
          <LearningDashboard />
        )}
      </div>
    </AppShell>
  );
}

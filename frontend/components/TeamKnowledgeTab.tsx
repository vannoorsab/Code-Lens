"use client";

import React, { useEffect, useState } from "react";
import { useGraphStore } from "@/lib/store";
import { fetchTeamKnowledge } from "@/lib/api";
import type { TeamKnowledgeResponse } from "@/lib/types";

export default function TeamKnowledgeTab() {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const [data, setData] = useState<TeamKnowledgeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (snapshotId !== null) {
      setLoading(true);
      void fetchTeamKnowledge(snapshotId)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [snapshotId]);

  if (loading) {
    return <p className="text-xs text-slate-500 py-8 text-center">Loading accumulated team knowledge...</p>;
  }

  if (!data || data.total_knowledge_items === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500 space-y-2">
        <span className="text-3xl">👥</span>
        <h3 className="text-sm font-bold text-slate-300">No team knowledge recorded yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Retain architecture decisions, review notes, and conventions into Hindsight to build a team knowledge base.
        </p>
      </div>
    );
  }

  const CATEGORY_TITLES: Record<string, { title: string; icon: string; desc: string }> = {
    ARCHITECTURE_DECISION: { title: "Architecture Principles", icon: "📐", desc: "Core decisions governing system design" },
    TEAM_CONVENTIONS: { title: "Team Conventions", icon: "🧠", desc: "Established coding standards & rules" },
    RECURRING_PROBLEMS: { title: "Recurring Problems", icon: "🔴", desc: "Historical incidents & regressions" },
    COMMON_REVIEW_FEEDBACK: { title: "Review Feedback", icon: "📝", desc: "Developer comments & PR reviews" },
    SUCCESSFUL_PATTERNS: { title: "Successful Patterns", icon: "✓", desc: "Proven fixes & approaches" },
    KNOWN_FAILED_APPROACHES: { title: "Failed Approaches", icon: "⚠", desc: "Approaches that failed or caused bugs" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white">Accumulated Organizational Knowledge</h2>
          <p className="text-xs text-slate-400">
            {data.total_knowledge_items} verified team experiences stored in Hindsight
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(data.knowledge_by_category).map(([catKey, items]) => {
          const meta = CATEGORY_TITLES[catKey] || { title: catKey, icon: "📌", desc: "" };
          return (
            <div key={catKey} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-200 text-xs">{meta.title}</h3>
                    <p className="text-[10px] text-slate-500">{meta.desc}</p>
                  </div>
                </div>
                <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-300">
                  {items.length} items
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic py-2">No entries for this category yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {items.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-850 bg-slate-950 p-3 text-xs space-y-1.5">
                      <p className="text-slate-300 font-medium leading-relaxed text-[11px]">
                        {item.description}
                      </p>
                      {item.related_files.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.related_files.slice(0, 3).map((f) => (
                            <span key={f} className="font-mono text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {f.split("/").pop()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import type { LearningTimelineEvent, MemoryConflict } from "@/lib/types";

interface LearningTimelineProps {
  events: LearningTimelineEvent[];
  conflicts?: MemoryConflict[];
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  ARCHITECTURE_DECISION: { bg: "bg-purple-950/40", border: "border-purple-800/60", text: "text-purple-300" },
  CODE_REVIEW: { bg: "bg-blue-950/40", border: "border-blue-800/60", text: "text-blue-300" },
  CHANGE_OUTCOME: { bg: "bg-indigo-950/40", border: "border-indigo-800/60", text: "text-indigo-300" },
  SUCCESSFUL_FIX: { bg: "bg-emerald-950/40", border: "border-emerald-800/60", text: "text-emerald-300" },
  FAILED_APPROACH: { bg: "bg-amber-950/40", border: "border-amber-800/60", text: "text-amber-300" },
  DEVELOPER_FEEDBACK: { bg: "bg-cyan-950/40", border: "border-cyan-800/60", text: "text-cyan-300" },
  TEAM_CONVENTION: { bg: "bg-teal-950/40", border: "border-teal-800/60", text: "text-teal-300" },
  REGRESSION: { bg: "bg-rose-950/40", border: "border-rose-800/60", text: "text-rose-300" },
};

export default function LearningTimeline({ events, conflicts }: LearningTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500">
        <span className="text-4xl">📈</span>
        <h3 className="mt-3 text-sm font-bold text-slate-300">No learning events recorded yet</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          Analyze repositories, run impact checks, and submit developer feedback to build a rich historical team timeline in Hindsight.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Conflict Detection Banner */}
      {conflicts && conflicts.length > 0 && (
        <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
            <span>⚠</span>
            <span>Potentially Conflicting Team Decisions Detected ({conflicts.length})</span>
          </div>
          {conflicts.map((c, i) => (
            <div key={i} className="rounded-lg bg-slate-950 p-3 border border-amber-900/50 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Target: <strong className="text-white">{c.target}</strong></span>
                <span className="text-cyan-400">{c.recommendation}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-amber-400 font-semibold block">Newer Decision:</span>
                  <p className="text-slate-300 mt-0.5">{c.newer_decision.description}</p>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 opacity-80">
                  <span className="text-slate-400 font-semibold block">Older Decision:</span>
                  <p className="text-slate-400 mt-0.5">{c.older_decision.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Stream */}
      <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pl-6">
        {events.map((ev) => {
          const style = CATEGORY_COLORS[ev.category] || {
            bg: "bg-slate-900",
            border: "border-slate-800",
            text: "text-slate-300",
          };

          return (
            <div key={ev.id} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-cyan-500 group-hover:scale-125 transition-transform" />

              <div className={`rounded-xl border p-4 shadow-lg transition-all ${style.bg} ${style.border}`}>
                {/* Event Top Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                      {ev.category.replace(/_/g, " ")}
                    </span>
                    {ev.outcome && (
                      <span className="rounded bg-slate-950 border border-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                        {ev.outcome}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span
                      className={`rounded px-1.5 py-0.5 ${
                        ev.freshness.badge_color === "emerald"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : ev.freshness.badge_color === "amber"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {ev.freshness.label}
                    </span>
                    <span className="text-slate-500">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>

                {/* Event Description */}
                <p className="mt-2 text-xs text-slate-200 leading-relaxed font-medium">
                  {ev.description}
                </p>

                {/* Event Metadata */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ev.component && (
                      <span className="font-mono text-[10px] text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                        comp: {ev.component}
                      </span>
                    )}
                    {ev.related_files.slice(0, 3).map((f) => (
                      <span key={f} className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                        {f.split("/").pop()}
                      </span>
                    ))}
                  </div>

                  {ev.author && <span className="text-slate-500 font-mono text-[10px]">by {ev.author}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

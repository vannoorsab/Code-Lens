"use client";

import React from "react";
import { useGraphStore } from "@/lib/store";
import type { TimelineEvent } from "@/lib/types";

export default function ExecutionTimeline() {
  const timeline = useGraphStore((s) => s.runFix.timeline);
  const state = useGraphStore((s) => s.runFix.state);
  const isStreaming = useGraphStore((s) => s.isStreaming);

  return (
    <div className="h-full bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col font-sans text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span className="font-semibold text-slate-200 tracking-wide">EXECUTION TIMELINE</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-cyan-400">
          STATE: {state}
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {timeline.length === 0 ? (
          <div className="text-slate-600 italic py-6 text-center">
            Agent activity trace will appear here in real-time during execution.
          </div>
        ) : (
          timeline.map((evt: TimelineEvent, idx: number) => {
            let iconColor = "text-cyan-400 bg-cyan-950/80 border-cyan-800";
            if (evt.icon === "✓") {
              iconColor = "text-emerald-400 bg-emerald-950/80 border-emerald-800";
            } else if (evt.icon === "✗") {
              iconColor = "text-rose-400 bg-rose-950/80 border-rose-800";
            } else if (evt.icon === "▶") {
              iconColor = "text-amber-400 bg-amber-950/80 border-amber-800";
            }

            return (
              <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/50 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 pt-0.5 flex-shrink-0">
                  {evt.time_formatted}
                </span>
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] border flex-shrink-0 ${iconColor}`}
                >
                  {evt.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-200 text-xs leading-snug">{evt.title}</div>
                  {evt.detail && (
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{evt.detail}</div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isStreaming && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-950/20 border border-cyan-900/40 text-cyan-300 animate-pulse text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Agent actively reasoning and executing...</span>
          </div>
        )}
      </div>
    </div>
  );
}

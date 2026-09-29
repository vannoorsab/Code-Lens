"use client";

import React from "react";
import type { HindsightMemory } from "@/lib/types";
import { useGraphStore } from "@/lib/store";

interface MemoryEvidencePanelProps {
  memories: HindsightMemory[];
  title?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  ARCHITECTURE_DECISION: { bg: "bg-purple-950/40", border: "border-purple-700/50", text: "text-purple-300" },
  CODE_REVIEW: { bg: "bg-blue-950/40", border: "border-blue-700/50", text: "text-blue-300" },
  CHANGE_OUTCOME: { bg: "bg-indigo-950/40", border: "border-indigo-700/50", text: "text-indigo-300" },
  SUCCESSFUL_FIX: { bg: "bg-emerald-950/40", border: "border-emerald-700/50", text: "text-emerald-300" },
  FAILED_APPROACH: { bg: "bg-amber-950/40", border: "border-amber-700/50", text: "text-amber-300" },
  DEVELOPER_FEEDBACK: { bg: "bg-cyan-950/40", border: "border-cyan-700/50", text: "text-cyan-300" },
  TEAM_CONVENTION: { bg: "bg-teal-950/40", border: "border-teal-700/50", text: "text-teal-300" },
  REGRESSION: { bg: "bg-rose-950/40", border: "border-rose-700/50", text: "text-rose-300" },
};

export default function MemoryEvidencePanel({ memories, title }: MemoryEvidencePanelProps) {
  const setMemoryDetailMemory = useGraphStore((s) => s.setMemoryDetailMemory);
  const setMemoryCenterOpen = useGraphStore((s) => s.setMemoryCenterOpen);

  if (!memories || memories.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-medium text-slate-300">
          <span>🧠 Hindsight Memory</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">0 found</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          No historical team experiences found for this specific module yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 text-xs backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <span>🧠 Hindsight Memory Evidence</span>
          <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-800/50">
            {memories.length} recalled
          </span>
        </div>
        <button
          onClick={() => setMemoryCenterOpen(true)}
          className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
        >
          Open Memory Center →
        </button>
      </div>

      <div className="space-y-2 mt-2">
        {memories.map((memory) => {
          const style = CATEGORY_COLORS[memory.category] || {
            bg: "bg-slate-900",
            border: "border-slate-800",
            text: "text-slate-300",
          };

          return (
            <div
              key={memory.id}
              onClick={() => {
                setMemoryDetailMemory(memory);
                setMemoryCenterOpen(true);
              }}
              className={`group cursor-pointer rounded-md border p-2.5 transition-all hover:border-cyan-500/50 hover:bg-slate-800/80 ${style.bg} ${style.border}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${style.text}`}>
                  {memory.category.replace("_", " ")}
                </span>
                {memory.outcome && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Outcome: {memory.outcome}
                  </span>
                )}
              </div>

              <p className="mt-1 font-medium text-slate-200 line-clamp-2 text-[11px] leading-relaxed">
                {memory.description}
              </p>

              {memory.related_files && memory.related_files.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {memory.related_files.slice(0, 3).map((f) => (
                    <span
                      key={f}
                      className="rounded bg-slate-950/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 border border-slate-800"
                    >
                      {f.split("/").pop()}
                    </span>
                  ))}
                  {memory.related_files.length > 3 && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      +{memory.related_files.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

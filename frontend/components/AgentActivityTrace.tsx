"use client";

import React, { useState } from "react";
import type { AgentTraceStep } from "@/lib/types";

interface AgentActivityTraceProps {
  steps: AgentTraceStep[];
  totalLatencyMs?: number;
}

export default function AgentActivityTrace({ steps, totalLatencyMs }: AgentActivityTraceProps) {
  const [expanded, setExpanded] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-xs backdrop-blur-md">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex cursor-pointer items-center justify-between font-medium text-slate-300 hover:text-white"
      >
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-[11px]">⚡ Agent Activity Trace</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
            {steps.length} steps {totalLatencyMs ? `(${totalLatencyMs}ms)` : ""}
          </span>
        </div>
        <span className="text-slate-500 text-[11px]">{expanded ? "Hide ▲" : "Show Trace ▼"}</span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-slate-800/80 pt-2.5">
          {steps.map((step) => {
            const isSuccess = step.status === "success";
            const isWarning = step.status === "warning";
            const isError = step.status === "error";

            return (
              <div key={step.step_number} className="flex items-start gap-2.5 text-[11px]">
                <span className="mt-0.5 text-[12px]">
                  {isSuccess && <span className="text-emerald-400">✓</span>}
                  {isWarning && <span className="text-amber-400">⚠</span>}
                  {isError && <span className="text-rose-400">✗</span>}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      Step {step.step_number}: {step.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{step.duration_ms}ms</span>
                  </div>
                  <p className="text-slate-400 leading-snug mt-0.5">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

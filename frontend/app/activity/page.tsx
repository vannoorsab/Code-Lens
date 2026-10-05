"use client";

import React from "react";
import AppShell from "@/components/AppShell";
import ExecutionTimeline from "@/components/ExecutionTimeline";

export default function ActivityPage() {
  return (
    <AppShell>
      <div className="p-6 h-full bg-slate-950 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col space-y-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🤖</span> Agent Activity & Execution Timeline
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Transparent step-by-step trace of autonomous detection, sandbox execution, diagnosis, and verification.
            </p>
          </div>
          <div className="flex-1 min-h-0">
            <ExecutionTimeline />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

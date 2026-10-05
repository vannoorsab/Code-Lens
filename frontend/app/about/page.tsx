"use client";

import React from "react";
import AppShell from "@/components/AppShell";

export default function AboutPage() {
  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-5xl mx-auto font-sans overflow-y-auto h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>ℹ️ System Architecture</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">CodeLens RunFix Architecture</h1>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous AI Debugging & Verification Engine — Run, Diagnose, Fix & Verify
            </p>
          </div>
        </div>

        {/* Architecture Pipeline Diagram */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-6 shadow-2xl backdrop-blur-md">
          <h2 className="text-sm font-bold text-white font-mono text-center">Autonomous Debugging Loop</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { title: "1. Project Detection", desc: "Identifies language, framework, manifest & run scripts" },
              { title: "2. Execution Sandbox", desc: "Isolated environment with timeouts & resource bounds" },
              { title: "3. Error Extraction", desc: "Parses compiler, runtime, & dependency error lines" },
              { title: "4. AI Diagnosis Agent", desc: "Identifies root cause, affected file & line location" },
              { title: "5. AI Fix Agent", desc: "Synthesizes minimal surgical unified diff patches" },
              { title: "6. Verification Loop", desc: "Reruns in sandbox to guarantee zero regression" },
              { title: "7. AI Test Generator", desc: "Synthesizes automated Vitest/Jest/PyTest suites" },
              { title: "8. GitHub Integration", desc: "Creates verified branches & Pull Requests" },
            ].map((step, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-xs space-y-1">
                <span className="font-mono font-bold text-cyan-400">{step.title}</span>
                <p className="text-[10px] text-slate-400 leading-normal">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800 text-xs">
            <div className="p-4 rounded-xl border border-cyan-900/50 bg-cyan-950/20 space-y-2">
              <h3 className="font-bold text-cyan-300 font-mono">⚡ Real Execution & Sandboxing</h3>
              <p className="text-slate-300 leading-relaxed">
                Runs real commands with line-by-line log streaming, process isolation, and host credential sanitization.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-indigo-900/50 bg-indigo-950/20 space-y-2">
              <h3 className="font-bold text-indigo-300 font-mono">🛡️ Surgical Fixes & Verification</h3>
              <p className="text-slate-300 leading-relaxed">
                Never rewrites whole files blindly. Generates minimal targeted patches and proves fix validity by re-running tests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

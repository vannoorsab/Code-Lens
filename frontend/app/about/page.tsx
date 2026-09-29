"use client";

import React from "react";
import AppShell from "@/components/AppShell";

export default function AboutPage() {
  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>ℹ️ System Overview</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">CODE-LENS Architecture & Design</h1>
            <p className="text-xs text-slate-400 mt-1">
              Combining structural AST graph facts with Hindsight long-term team memory
            </p>
          </div>
        </div>

        {/* Architecture Pipeline Diagram */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-6 shadow-2xl backdrop-blur-md">
          <h2 className="text-sm font-bold text-white font-mono text-center">System Architecture Flow</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { title: "1. Ingestion", desc: "Clones repo & parses AST structure" },
              { title: "2. Knowledge Graph", desc: "Deterministic MultiDiGraph in NetworkX" },
              { title: "3. Git Intelligence", desc: "Co-change coupling & file churn" },
              { title: "4. Hindsight Engine", desc: "RETAIN, RECALL, REFLECT experience" },
              { title: "5. AI Agent", desc: "Synthesizes code evidence + memory" },
              { title: "6. Developer Feedback", desc: "ACCEPTED, REJECTED, CORRECTED" },
              { title: "7. Outcome Learning", desc: "Stores lessons for future changes" },
              { title: "8. Continuous Loop", desc: "Smarter, contextual guidance" },
            ].map((step, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-xs space-y-1">
                <span className="font-mono font-bold text-cyan-400">{step.title}</span>
                <p className="text-[10px] text-slate-400 leading-normal">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800 text-xs">
            <div className="p-4 rounded-xl border border-cyan-900/50 bg-cyan-950/20 space-y-2">
              <h3 className="font-bold text-cyan-300 font-mono">🕸️ Knowledge Graph = Structural Intelligence</h3>
              <p className="text-slate-300 leading-relaxed">
                Computes deterministic AST node types, imports, dependencies, entrypoints, and blast radius. Requires zero LLM calls.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-900/50 bg-purple-950/20 space-y-2">
              <h3 className="font-bold text-purple-300 font-mono">🧠 Hindsight = Experiential Intelligence</h3>
              <p className="text-slate-300 leading-relaxed">
                Remembers team decisions, past regressions, review comments, and failed approaches. Enables the agent to learn over time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

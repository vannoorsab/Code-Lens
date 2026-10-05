"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"sandbox" | "general" | "security">("sandbox");

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-5xl mx-auto font-sans overflow-y-auto h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>⚙️ Configuration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">RunFix System Settings</h1>
            <p className="text-xs text-slate-400 mt-1">
              Sandbox execution limits, safety boundaries, and environment controls
            </p>
          </div>

          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            {["sandbox", "general", "security"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`rounded px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-all ${
                  activeTab === tab ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" : "text-slate-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Sandbox Engine Settings */}
        {activeTab === "sandbox" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>⚡</span> Sandbox Execution Policy
              </h2>
              <span className="rounded-full px-3 py-1 text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                ● Isolated & Guarded
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-slate-500 uppercase text-[10px]">Execution Timeout</span>
                <p className="text-cyan-300 font-bold">120 seconds (Hard Ceiling)</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-slate-500 uppercase text-[10px]">Max Repair Iterations</span>
                <p className="text-cyan-300 font-bold">5 Iterations (Loop Guard)</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-slate-500 uppercase text-[10px]">Memory Ceiling</span>
                <p className="text-slate-300">1024 MB per workspace</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-slate-500 uppercase text-[10px]">Environment Isolation</span>
                <p className="text-emerald-400 font-bold">Credential Sanitization Active</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: General Settings */}
        {activeTab === "general" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl text-xs">
            <h2 className="text-sm font-bold text-white font-mono">General Codebase Limits</h2>
            <ul className="space-y-2 text-slate-300 font-mono">
              <li className="flex justify-between border-b border-slate-850 pb-2">
                <span>Max Repository Size:</span>
                <span className="text-cyan-400">500 MB</span>
              </li>
              <li className="flex justify-between border-b border-slate-850 pb-2">
                <span>Clone Timeout:</span>
                <span className="text-cyan-400">300 seconds</span>
              </li>
              <li className="flex justify-between border-b border-slate-850 pb-2">
                <span>CORS Allowed Origins:</span>
                <span className="text-cyan-400">http://localhost:3000</span>
              </li>
            </ul>
          </div>
        )}

        {/* Tab 3: Security Controls */}
        {activeTab === "security" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl text-xs">
            <h2 className="text-sm font-bold text-white font-mono">Security & Sandboxing Safeguards</h2>
            <p className="text-slate-400 leading-relaxed">
              CodeLens RunFix protects the host machine by stripping sensitive environment variables, preventing credential theft, enforcing execution timeouts, and terminating orphan child processes.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-emerald-900/50 text-emerald-400 font-mono text-[11px]">
              ✓ Host Filesystem Protection Active | Secrets Scrubbed from Child Processes
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

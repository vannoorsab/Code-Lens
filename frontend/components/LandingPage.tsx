"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGraphStore } from "@/lib/store";

export default function LandingPage() {
  const router = useRouter();
  const loadDemoBrokenProject = useGraphStore((s) => s.loadDemoBrokenProject);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLaunchDemo = async (type: "react" | "python") => {
    setDemoLoading(true);
    try {
      await loadDemoBrokenProject(type);
      router.push("/runfix");
    } catch {
      /* handled in store */
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans relative overflow-x-hidden">
      {/* Background Subtle Mesh Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Hero Header Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-mono font-bold text-slate-950 text-base shadow-lg shadow-cyan-500/20">
            RF
          </div>
          <span className="font-bold text-lg tracking-tight text-white font-mono">CodeLens RunFix</span>
          <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300">
            AI Debugging Engineer
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => handleLaunchDemo("react")}
            disabled={demoLoading}
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            {demoLoading ? "Loading Demo..." : "Try Instant Demo"}
          </button>
          <Link
            href="/runfix"
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-md shadow-cyan-950"
          >
            Open RunFix Studio →
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto pt-20 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-800/60 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold text-cyan-300 mb-6">
          <span>⚡</span>
          <span>Autonomous Execution • Diagnosis • Surgical Fix • Verification</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Give CodeLens a Broken Project. <br />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">
            It Finds, Fixes, Re-Runs & Verifies.
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Not just an AI chatbot that explains code. CodeLens RunFix executes applications in a secure sandbox,
          captures real runtime errors, generates surgical minimal diffs, reruns, and verifies fix validity.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => handleLaunchDemo("react")}
            disabled={demoLoading}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-xl shadow-cyan-950/50 flex items-center gap-2"
          >
            <span>⚡</span>
            <span>{demoLoading ? "Launching Demo Sandbox..." : "Demo: Broken React App"}</span>
          </button>
          <button
            onClick={() => handleLaunchDemo("python")}
            disabled={demoLoading}
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
          >
            <span>🐍</span>
            <span>Demo: Broken Python App</span>
          </button>
        </div>

        {/* ── 4-STEP AGENTIC WORKFLOW DIAGRAM ──────────────────────────────── */}
        <div className="mt-14 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            {[
              { label: "1. Detect", icon: "📁", sub: "Framework & Scripts" },
              { label: "2. Run Sandbox", icon: "▶", sub: "Live Stdout / Stderr" },
              { label: "3. Parse Error", icon: "💥", sub: "Extract File & Line" },
              { label: "4. AI Diagnosis", icon: "🤖", sub: "Root Cause Reasoner" },
              { label: "5. Surgical Fix", icon: "⚡", sub: "Minimal Diff Patch" },
              { label: "6. Verify & Test", icon: "🛡️", sub: "Re-run & PR Ready" },
            ].map((step) => (
              <div
                key={step.label}
                className="relative rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex flex-col items-center hover:border-cyan-800/80 transition-all"
              >
                <div className="text-2xl mb-1.5">{step.icon}</div>
                <div className="text-xs font-bold text-slate-200">{step.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{step.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON SECTION ───────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Why CodeLens RunFix is Different
          </h2>
          <p className="text-xs text-slate-400 mt-1">Autonomous Developer Agent vs Generic AI Chatbots</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-rose-950/60 bg-slate-900/40 space-y-4">
            <div className="text-rose-400 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
              <span>✕</span> Generic AI Chatbots
            </div>
            <ul className="text-xs text-slate-400 space-y-2.5 leading-relaxed">
              <li>• Cannot run or compile the code.</li>
              <li>• Hallucinates reasons without seeing actual stderr / compiler outputs.</li>
              <li>• Rewrites entire files unnecessarily, introducing subtle regressions.</li>
              <li>• Has zero concept of whether the proposed code actually fixes the bug.</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-emerald-950/80 bg-emerald-950/10 space-y-4">
            <div className="text-emerald-400 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
              <span>✓</span> CodeLens RunFix Agent
            </div>
            <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <li>• Runs projects inside isolated sandbox workspaces in real time.</li>
              <li>• Parses structured errors, compiler codes, and exact stack trace lines.</li>
              <li>• Constructs surgical unified diffs with exact minimal line changes.</li>
              <li>• Re-runs the application & generates automated tests to prove fix validity.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-600 font-mono">
        CodeLens RunFix — Autonomous AI Debugging & Verification Engine
      </footer>
    </div>
  );
}

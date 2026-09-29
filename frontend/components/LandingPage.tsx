"use client";

import React, { useState } from "react";
import { useGraphStore } from "@/lib/store";
import Link from "next/link";

export default function LandingPage() {
  const analyze = useGraphStore((s) => s.analyze);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoQuery, setDemoQuery] = useState("auth");

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      await analyze("https://github.com/psf/requests");
    } catch {
      /* handled in store */
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Background Subtle Mesh Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Hero Header Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-mono font-bold text-slate-950 text-base shadow-lg shadow-cyan-500/20">
            CL
          </div>
          <span className="font-bold text-lg tracking-tight text-white font-mono">CODE-LENS</span>
          <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 font-mono text-[10px] text-cyan-400">
            Hindsight Powered v2.0
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleTryDemo}
            disabled={demoLoading}
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            {demoLoading ? "Loading Demo..." : "Try Demo"}
          </button>
          <Link
            href="/connect"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-all shadow-md shadow-cyan-950"
          >
            Connect Repository →
          </Link>
        </div>
      </header>

      {/* ── 1. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto pt-20 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-800/60 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-300 mb-6">
          <span>🧠</span>
          <span>Code Intelligence Powered by Hindsight Experience Core</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Your Codebase Has a <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Memory.</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Understand your architecture. Remember what your team learned. Make safer changes with AI that learns from experience.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/connect"
            className="rounded-xl bg-cyan-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-950/50 flex items-center gap-2"
          >
            <span>Connect GitHub Repository</span>
            <span>→</span>
          </Link>
          <button
            onClick={handleTryDemo}
            disabled={demoLoading}
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            {demoLoading ? "Preparing Demo Snapshot..." : "Try Instant Demo"}
          </button>
        </div>

        {/* Visual Workflow Pipeline Diagram */}
        <div className="mt-14 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            {[
              { label: "Repository", icon: "📁", sub: "GitHub Source" },
              { label: "Code Intelligence", icon: "⚙️", sub: "AST & Git Parser" },
              { label: "Knowledge Graph", icon: "🕸️", sub: "Structural Facts" },
              { label: "Hindsight Memory", icon: "🧠", sub: "Team Rationale" },
              { label: "AI Agent", icon: "🤖", sub: "Reflective Reasoner" },
              { label: "Smarter Recommendations", icon: "✨", sub: "Memory-Aware" },
            ].map((step, idx) => (
              <div key={step.label} className="relative rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex flex-col items-center">
                <span className="text-2xl mb-1">{step.icon}</span>
                <span className="font-mono text-[11px] font-bold text-slate-200">{step.label}</span>
                <span className="text-[9px] text-slate-500 mt-0.5">{step.sub}</span>
                {idx < 5 && (
                  <span className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 text-slate-600 z-10 text-xs">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEM SECTION ───────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-slate-800/80 bg-slate-900/30 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">The Problem</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Code tells you what exists.<br />
            <span className="text-slate-400">Experience tells you what matters.</span>
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed pt-2">
            Traditional code analysis maps AST imports and dependencies. But it cannot remember why an architecture choice was made, why a refactor failed six months ago, or how a team convention prevented regressions. CODE-LENS bridges structural facts with accumulated team memory.
          </p>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto py-20 px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">Architecture</span>
          <h2 className="text-3xl font-bold text-white mt-1">How CODE-LENS Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              num: "01",
              title: "UNDERSTAND",
              desc: "Analyze repository ASTs, imports, and commit histories into a software knowledge graph.",
              color: "text-cyan-400",
            },
            {
              num: "02",
              title: "REMEMBER",
              desc: "Store architecture decisions, code reviews, fixes, regressions, and team conventions in Hindsight.",
              color: "text-purple-400",
            },
            {
              num: "03",
              title: "REASON",
              desc: "Synthesize current code structure with recalled team memories to evaluate change impact.",
              color: "text-indigo-400",
            },
            {
              num: "04",
              title: "LEARN",
              desc: "Capture developer feedback & change outcomes to continuously refine future recommendations.",
              color: "text-emerald-400",
            },
          ].map((item) => (
            <div key={item.num} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
              <span className={`font-mono text-2xl font-black ${item.color}`}>{item.num}</span>
              <h3 className="font-bold text-slate-100 text-sm">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. PRODUCT DIFFERENCE ────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-slate-800/80 bg-slate-900/40 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">Comparison</span>
            <h2 className="text-3xl font-bold text-white mt-1">Product Difference</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* TRADITIONAL CODE ANALYSIS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4 opacity-75">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-mono text-sm font-bold text-slate-400">TRADITIONAL CODE ANALYSIS</h3>
                <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-500 font-mono">Structural Only</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><span className="text-slate-600">✓</span> Code structure</li>
                <li className="flex items-center gap-2"><span className="text-slate-600">✓</span> Dependencies & call graphs</li>
                <li className="flex items-center gap-2"><span className="text-slate-600">✓</span> Imports & AST files</li>
                <li className="flex items-center gap-2"><span className="text-slate-600">✓</span> Raw Git commit history</li>
                <li className="flex items-center gap-2 text-slate-600"><span className="text-rose-500">✗</span> Historical team context</li>
                <li className="flex items-center gap-2 text-slate-600"><span className="text-rose-500">✗</span> Why decisions were made</li>
                <li className="flex items-center gap-2 text-slate-600"><span className="text-rose-500">✗</span> Past regressions & fixes</li>
              </ul>
            </div>

            {/* CODE-LENS */}
            <div className="rounded-2xl border border-cyan-800 bg-cyan-950/20 p-6 space-y-4 shadow-xl shadow-cyan-950/40">
              <div className="flex items-center justify-between border-b border-cyan-800/80 pb-3">
                <h3 className="font-mono text-sm font-bold text-cyan-300">CODE-LENS (HINDSIGHT AUGMENTED)</h3>
                <span className="rounded bg-cyan-900/80 px-2 py-0.5 text-[10px] text-cyan-200 font-mono border border-cyan-700">🧠 Structural + Experiential</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2"><span className="text-cyan-400">✓</span> Code structure & dependencies</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400">✓</span> Git history & co-change coupling</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400">✓</span> Historical team experience (Hindsight)</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400">✓</span> Team conventions & architecture rationale</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400">✓</span> Previous regressions & failed approaches</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400">✓</span> Successful fixes & past reviews</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400">✓</span> Continuous developer feedback loop</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. MEMORY DEMO SECTION ───────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto py-20 px-6">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-semibold uppercase text-cyan-400 tracking-wider">Live Experience</span>
          <h2 className="text-3xl font-bold text-white mt-1">Interactive Memory Benchmark</h2>
          <p className="text-xs text-slate-400 mt-2">See how Hindsight experience changes the recommendation for <span className="font-mono text-cyan-300">AuthService</span></p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-lg">💬</span>
            <span className="text-xs font-mono text-slate-300">Developer Question: <strong className="text-white">"What happens if I modify AuthService?"</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WITHOUT MEMORY */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
              <span className="font-mono text-xs font-bold text-slate-400">WITHOUT MEMORY (Static AST Only)</span>
              <div className="p-3 rounded-lg bg-slate-950 text-xs text-slate-400 border border-slate-850 leading-relaxed font-mono">
                "12 files may be affected across the import graph."
              </div>
              <p className="text-[11px] text-slate-500 italic">No team rationale or past regression context applied.</p>
            </div>

            {/* WITH MEMORY */}
            <div className="rounded-xl border border-cyan-800/80 bg-cyan-950/30 p-4 space-y-3">
              <span className="font-mono text-xs font-bold text-cyan-300">WITH MEMORY (Hindsight Augmented)</span>
              <div className="p-3 rounded-lg bg-slate-950 text-xs text-slate-200 border border-cyan-800/60 leading-relaxed">
                "12 files may be affected. <strong className="text-amber-300">A previous authentication change caused a regression in SessionManager.</strong> Review token invalidation before modifying AuthService."
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                <span>Recalled: 2 team memories</span>
                <span>Confidence: 92%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-slate-800/80 bg-slate-900/60 py-20 px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Give your codebase a memory.
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mt-4">
          Connect your repository to experience memory-aware code intelligence.
        </p>
        <div className="mt-8">
          <Link
            href="/connect"
            className="rounded-xl bg-cyan-600 px-8 py-4 text-sm font-bold text-white hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-950/60 inline-flex items-center gap-2"
          >
            <span>Connect Repository</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

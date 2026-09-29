"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function ConnectPage() {
  const router = useRouter();
  const analyze = useGraphStore((s) => s.analyze);
  const phase = useGraphStore((s) => s.phase);
  const error = useGraphStore((s) => s.error);
  const stages = useGraphStore((s) => s.stages);
  const stagesShown = useGraphStore((s) => s.stagesShown);

  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setLoading(true);
    try {
      await analyze(repoUrl.trim());
      router.push("/dashboard");
    } catch {
      /* error stored */
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setRepoUrl("https://github.com/psf/requests");
    setLoading(true);
    try {
      await analyze("https://github.com/psf/requests");
      router.push("/dashboard");
    } catch {
      /* error stored */
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-16 px-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-800/80 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-300">
            <span>🔗 GitHub Connection</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Connect Your Codebase</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Paste a GitHub repository URL and let CODE-LENS build a structural knowledge graph and link team experience.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl space-y-6 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">GitHub Repository URL</label>
              <input
                type="url"
                required
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-800/80 bg-rose-950/40 p-3 text-xs text-rose-300">
                ⚠ Analysis failed: {error}
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading || !repoUrl.trim()}
                className="flex-1 rounded-xl bg-cyan-600 px-6 py-3.5 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-950"
              >
                {loading ? "Analyzing Repository..." : "ANALYZE REPOSITORY →"}
              </button>
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-3.5 text-xs font-semibold text-slate-300 hover:bg-slate-850 hover:text-white transition-all"
              >
                TRY DEMO
              </button>
            </div>
          </form>

          {/* Analysis Stages Progress Display */}
          {phase === "understanding" && (
            <div className="rounded-xl border border-cyan-900/50 bg-slate-950 p-5 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-cyan-300">
                <span>Pipeline Stage Analysis</span>
                <span>{stagesShown} / {stages.length}</span>
              </div>

              <div className="space-y-2">
                {stages.slice(0, stagesShown).map((stg, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>{stg.stage}</span>
                    </span>
                    {stg.detail && <span className="text-[10px] text-slate-500">{stg.detail}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

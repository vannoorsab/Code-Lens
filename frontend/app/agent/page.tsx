"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import { fetchMemoryAwareAnalysis, submitDeveloperFeedback } from "@/lib/api";
import MemoryEvidencePanel from "@/components/MemoryEvidencePanel";
import AgentActivityTrace from "@/components/AgentActivityTrace";

const SUGGESTED_QUESTIONS = [
  "What happens if I modify AuthService?",
  "Why is this module risky?",
  "Has a similar change caused a regression?",
  "Which files should I inspect before refactoring?",
  "What architecture conventions apply to pipeline concurrency?",
];

export default function AgentPage() {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const spec = useGraphStore((s) => s.spec);
  const memoryMode = useGraphStore((s) => s.memoryMode);

  const [question, setQuestion] = useState("");
  const [targetNode, setTargetNode] = useState(spec?.nodes[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState("");

  const handleAsk = async (queryText: string) => {
    if (!snapshotId) return;
    const q = queryText || question;
    if (!q) return;

    setLoading(true);
    setFeedbackStatus("");
    try {
      const res = await fetchMemoryAwareAnalysis(snapshotId, targetNode || "file:main.py", memoryMode);
      setResponse(res);
    } catch (err) {
      /* handled */
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (outcome: "ACCEPTED" | "REJECTED" | "CORRECTED") => {
    if (!snapshotId) return;
    try {
      await submitDeveloperFeedback(snapshotId, {
        outcome,
        description: `Feedback on agent response to '${question || 'query'}': ${response?.recommendation || ''}`,
        node_id: targetNode,
      });
      setFeedbackStatus(`✓ Developer feedback (${outcome}) retained into Hindsight Memory!`);
    } catch (err) {
      setFeedbackStatus(`⚠ Feedback submission failed.`);
    }
  };

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>🤖 Reflective Agent</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">CODE-LENS AI Agent</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ask questions about architecture impact, team history, and past regressions
            </p>
          </div>
        </div>

        {/* Suggested Questions Pills */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 tracking-wider">
            Suggested Prompts
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q);
                  void handleAsk(q);
                }}
                className="rounded-full border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 hover:border-cyan-700 hover:text-white transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Ask CODE-LENS Agent a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />

            <select
              value={targetNode}
              onChange={(e) => setTargetNode(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none font-mono"
            >
              {(spec?.nodes || []).slice(0, 20).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => void handleAsk(question)}
              disabled={loading || !question.trim()}
              className="rounded-xl bg-cyan-600 px-6 py-3 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-950"
            >
              {loading ? "Reasoning..." : "Ask Agent →"}
            </button>
          </div>
        </div>

        {/* Structured Agent Response Output */}
        {response && (
          <div className="rounded-2xl border border-cyan-800/80 bg-slate-950 p-6 space-y-6 shadow-2xl">
            {/* Header / Confidence */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-mono text-xs font-bold text-cyan-300 flex items-center gap-2">
                <span>🤖</span> Agent Response Mode: <strong className="text-white">{response.memory_mode}</strong>
              </span>
              <span className="rounded bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300">
                {Math.round(response.confidence * 100)}% Confidence
              </span>
            </div>

            {/* Structured Sections */}
            <div className="space-y-4">
              {/* CURRENT CODE ANALYSIS */}
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 tracking-wider">
                  CURRENT CODE ANALYSIS
                </span>
                <p className="mt-1 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed font-mono">
                  Target: {response.node_id} | Affected Symbols: {response.current_analysis?.meta?.total_affected || 0}
                </p>
              </div>

              {/* HISTORICAL EXPERIENCE */}
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase text-purple-400 tracking-wider">
                  HISTORICAL EXPERIENCE
                </span>
                <p className="mt-1 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  Recalled {response.historical_memories?.length || 0} prior team memories and conventions from Hindsight Memory Bank.
                </p>
              </div>

              {/* RECOMMENDATION */}
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase text-cyan-400 tracking-wider">
                  RECOMMENDATION
                </span>
                <p className="mt-1 text-xs font-medium text-white bg-slate-900/90 p-4 rounded-xl border border-cyan-800/80 leading-relaxed shadow-inner">
                  {response.recommendation}
                </p>
              </div>

              {/* WHY / REASONING */}
              {response.reasoning && (
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 tracking-wider">
                    WHY / RATIONALE
                  </span>
                  <p className="mt-1 text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {response.reasoning}
                  </p>
                </div>
              )}
            </div>

            {/* Recalled Memories Evidence & Activity Trace */}
            <MemoryEvidencePanel memories={response.historical_memories} />
            <AgentActivityTrace steps={response.agent_trace} totalLatencyMs={response.total_latency_ms} />

            {/* Developer Feedback Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-medium">Was this recommendation helpful?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void handleFeedback("ACCEPTED")}
                  className="rounded-lg bg-emerald-950 border border-emerald-800 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900 transition-all"
                >
                  👍 Accept
                </button>
                <button
                  onClick={() => void handleFeedback("REJECTED")}
                  className="rounded-lg bg-rose-950 border border-rose-800 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900 transition-all"
                >
                  👎 Reject
                </button>
                <button
                  onClick={() => void handleFeedback("CORRECTED")}
                  className="rounded-lg bg-amber-950 border border-amber-800 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900 transition-all"
                >
                  ✏️ Correct
                </button>
              </div>
            </div>

            {feedbackStatus && <p className="text-xs font-medium text-cyan-400 text-center">{feedbackStatus}</p>}
          </div>
        )}
      </div>
    </AppShell>
  );
}

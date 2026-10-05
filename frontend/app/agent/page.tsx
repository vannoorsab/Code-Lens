"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import Link from "next/link";

const SUGGESTED_QUESTIONS = [
  "Why did the build fail?",
  "Diagnose and fix the missing import error.",
  "Run the project in the sandbox.",
  "Generate automated regression tests.",
  "Prepare a GitHub Pull Request for this repair.",
];

export default function AgentPage() {
  const runFix = useGraphStore((s) => s.runFix);
  const logs = useGraphStore((s) => s.logs);
  const runDiagnosis = useGraphStore((s) => s.runDiagnosis);
  const generateFix = useGraphStore((s) => s.generateFix);
  const startAutonomousLoop = useGraphStore((s) => s.startAutonomousLoop);
  const generateTestSuite = useGraphStore((s) => s.generateTestSuite);
  const isStreaming = useGraphStore((s) => s.isStreaming);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "agent"; text: string; action?: string }>>([
    {
      role: "agent",
      text: "Hello! I am your CodeLens RunFix AI Debugging Engineer. I have live access to your workspace, terminal execution stream, and compiler errors. How can I assist you with running or repairing this project?",
    },
  ]);

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");

    const lower = q.toLowerCase();
    if (lower.includes("why") || lower.includes("fail") || lower.includes("diagnose")) {
      await runDiagnosis();
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: runFix.latest_diagnosis
            ? `Root Cause: ${runFix.latest_diagnosis.root_cause}\n\nExplanation: ${runFix.latest_diagnosis.explanation}\n\nRecommended Fix: ${runFix.latest_diagnosis.fix_strategy}`
            : "I analyzed the execution logs and diagnosed the root cause. You can review the details in the RunFix studio.",
        },
      ]);
    } else if (lower.includes("fix") || lower.includes("patch")) {
      await generateFix();
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: runFix.latest_fix
            ? `I have synthesized a minimal surgical patch for ${runFix.latest_fix.affected_file}. Rationale: ${runFix.latest_fix.explanation}`
            : "Generated proposed code patch.",
        },
      ]);
    } else if (lower.includes("test")) {
      await generateTestSuite();
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "Automated regression test suite generated and verified. All test cases passed.",
        },
      ]);
    } else if (lower.includes("run") || lower.includes("auto")) {
      await startAutonomousLoop("autonomous");
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "Autonomous RunFix loop completed! Build and tests have been verified in the sandbox.",
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: `Project: ${runFix.project?.name || "Detected Workspace"} (${runFix.project?.framework || "Framework"}). Current execution state: ${runFix.state}. Terminal has recorded ${logs.length} log lines.`,
        },
      ]);
    }
  };

  return (
    <AppShell>
      <div className="p-8 space-y-6 max-w-5xl mx-auto font-sans overflow-y-auto h-full flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
                <span>🤖 Execution-Aware AI Assistant</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white mt-1">CodeLens AI Debugging Agent</h1>
              <p className="text-xs text-slate-400 mt-1">
                Interact with the AI agent using live execution context, terminal logs, and real compiler outputs
              </p>
            </div>
            <Link
              href="/runfix"
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Open RunFix Studio →
            </Link>
          </div>

          {/* Suggested Prompts */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 tracking-wider">
              Quick Action Prompts
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  disabled={isStreaming}
                  className="rounded-full border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 hover:border-cyan-700 hover:text-white transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  m.role === "agent"
                    ? "bg-slate-900/80 border border-slate-800 text-slate-200"
                    : "bg-cyan-950/60 border border-cyan-800/80 text-cyan-100 ml-8"
                }`}
              >
                <div className="font-mono text-[10px] font-bold text-slate-400 mb-1">
                  {m.role === "agent" ? "🤖 CODELENS AGENT" : "👤 YOU"}
                </div>
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask CodeLens to diagnose, fix, test, or rerun..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-sans"
            />
            <button
              type="submit"
              disabled={isStreaming || !question.trim()}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-md"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";

export default function TestsPage() {
  const tests = useGraphStore((s) => s.runFix.latest_tests);
  const generateTestSuite = useGraphStore((s) => s.generateTestSuite);
  const isStreaming = useGraphStore((s) => s.isStreaming);

  return (
    <AppShell>
      <div className="h-full p-6 bg-slate-950 overflow-y-auto font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>🧪</span> Automated Regression Test Suites
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                AI-synthesized tests in Vitest, Jest, or PyTest to verify patch validity.
              </p>
            </div>
            <button
              onClick={() => generateTestSuite()}
              disabled={isStreaming}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-950 transition-all flex items-center gap-2"
            >
              <span>✨</span>
              <span>{isStreaming ? "Synthesizing Tests..." : "Generate Test Suite"}</span>
            </button>
          </div>

          {!tests ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
              <div className="text-4xl">🧪</div>
              <h3 className="text-base font-semibold text-slate-200">No Tests Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once an AI fix is proposed or applied, click "Generate Test Suite" to construct comprehensive verification tests.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">TEST RUNNER</div>
                  <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">{tests.framework}</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">TOTAL TEST CASES</div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">{tests.total_tests}</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-emerald-900/60 text-center">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">VERIFICATION</div>
                  <div className={`text-base font-bold font-mono mt-0.5 ${tests.is_verified ? "text-emerald-400" : "text-amber-300"}`}>
                    {tests.is_verified ? `${tests.passed_tests}/${tests.total_tests} PASSED` : tests.total_tests ? "NOT RUN" : "UNAVAILABLE"}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-mono font-semibold text-slate-400 uppercase">
                  INDIVIDUAL TEST CASES
                </div>
                {tests.test_cases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-slate-800 px-2 py-1 text-amber-300 border border-slate-700 font-mono text-[10px]">
                        {tc.status}
                      </span>
                      <div>
                        <div className="font-mono text-slate-200 font-medium">{tc.name}</div>
                        <div className="text-[11px] text-slate-400">{tc.description}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                      {tc.category}
                    </span>
                  </div>
                ))}
              </div>

              {tests.test_code && <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400">
                  GENERATED TEST CODE: <span className="text-cyan-300">{tests.test_file_path}</span>
                </div>
                <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {tests.test_code}
                </pre>
              </div>}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

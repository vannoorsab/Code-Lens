"use client";

import React from "react";
import { useGraphStore } from "@/lib/store";

export default function TestGeneratorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const tests = useGraphStore((s) => s.runFix.latest_tests);
  const generateTestSuite = useGraphStore((s) => s.generateTestSuite);
  const isStreaming = useGraphStore((s) => s.isStreaming);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧪</span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Automated Test Verification</h2>
              <p className="text-xs text-slate-400">AI-generated regression suites</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!tests ? (
            <div className="text-center py-10 space-y-3">
              <div className="text-3xl">🧪</div>
              <p className="text-sm text-slate-300">No test suite generated for the current fix yet.</p>
              <button
                onClick={() => generateTestSuite()}
                disabled={isStreaming}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-all"
              >
                {isStreaming ? "Generating Suite..." : "Generate Verification Tests"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Test Summary Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-slate-500 text-[10px] uppercase font-mono">FRAMEWORK</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">{tests.framework}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-slate-500 text-[10px] uppercase font-mono">TOTAL TESTS</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{tests.total_tests}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/60 text-center">
                  <div className="text-slate-500 text-[10px] uppercase font-mono">VERDICT</div>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${tests.is_verified ? "text-emerald-400" : "text-amber-300"}`}>
                    {tests.is_verified ? `${tests.passed_tests}/${tests.total_tests} PASSED` : tests.total_tests ? "NOT RUN" : "UNAVAILABLE"}
                  </div>
                </div>
              </div>

              {/* Test Cases List */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  TEST CASES GENERATED
                </div>
                {tests.test_cases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="rounded bg-slate-800 text-amber-300 border border-slate-700 px-2 py-1 font-mono text-[10px]">
                        {tc.status}
                      </span>
                      <div>
                        <div className="font-mono text-slate-200 font-medium">{tc.name}</div>
                        <div className="text-[11px] text-slate-400">{tc.description}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                      {tc.category}
                    </span>
                  </div>
                ))}
              </div>

              {/* Code Preview */}
              {tests.test_code && <div className="space-y-1.5">
                <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>TEST FILE: {tests.test_file_path}</span>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                  {tests.test_code}
                </pre>
              </div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

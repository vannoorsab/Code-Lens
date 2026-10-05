"use client";

import React, { useEffect, useRef } from "react";
import { useGraphStore } from "@/lib/store";
import type { LogEntry } from "@/lib/types";

export default function TerminalConsole() {
  const logs = useGraphStore((s) => s.logs);
  const isStreaming = useGraphStore((s) => s.isStreaming);
  const clearLogs = useGraphStore((s) => s.clearLogs);
  const runProjectCommand = useGraphStore((s) => s.runProjectCommand);
  const stopActiveProcess = useGraphStore((s) => s.stopActiveProcess);
  const runFix = useGraphStore((s) => s.runFix);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-slate-400 font-semibold tracking-wide ml-2">TERMINAL</span>
          {isStreaming ? (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full text-[10px] border border-emerald-800/60 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              RUNNING
            </span>
          ) : (
            <span className="text-slate-500 text-[10px]">IDLE</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isStreaming ? (
            <button
              onClick={() => stopActiveProcess()}
              className="px-2.5 py-1 bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 rounded border border-rose-700/50 transition-colors flex items-center gap-1"
            >
              <span>■</span> Stop
            </button>
          ) : (
            <button
              onClick={() => runProjectCommand()}
              className="px-2.5 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 rounded border border-cyan-700/50 transition-colors flex items-center gap-1"
            >
              <span>▶</span> Run
            </button>
          )}
          <button
            onClick={() => clearLogs()}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title="Clear output"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Log Output Body */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-1 select-text selection:bg-cyan-500 selection:text-slate-950 leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center">
            Terminal ready. Click "▶ Run Project" or "✨ RunFix" to execute in sandbox.
          </div>
        ) : (
          logs.map((log: LogEntry, idx: number) => {
            let color = "text-slate-300";
            if (log.stream === "stderr") {
              color = "text-rose-400 font-semibold";
            } else if (log.stream === "system") {
              color = "text-cyan-400 font-semibold";
            }
            return (
              <div key={idx} className={`flex items-start gap-2 ${color}`}>
                <span className="text-slate-600 select-none text-[10px] w-12 flex-shrink-0 pt-0.5">
                  {log.formatted_time || ""}
                </span>
                <span className="break-all whitespace-pre-wrap flex-1">{log.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

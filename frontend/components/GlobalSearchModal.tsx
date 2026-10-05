"use client";

import React, { useState, useEffect } from "react";
import { useGraphStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { searchSymbols } from "@/lib/api";

interface GlobalSearchModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen = true, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  useEffect(() => {
    if (!query.trim() || snapshotId === null) {
      setHits([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchSymbols(snapshotId, query, 10);
        setHits(res || []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, snapshotId]);

  const navRoutes = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "Run & Fix Studio", path: "/runfix", icon: "⚡" },
    { label: "Terminal Console", path: "/terminal", icon: "💻" },
    { label: "Changes & Diff", path: "/changes", icon: "📝" },
    { label: "Test Suites", path: "/tests", icon: "🧪" },
    { label: "Code Explorer", path: "/explorer", icon: "📂" },
    { label: "Knowledge Graph", path: "/graph", icon: "🕸️" },
    { label: "Blast Radius", path: "/blast-radius", icon: "💥" },
    { label: "Architecture", path: "/architecture", icon: "🏛️" },
    { label: "Git Intelligence", path: "/git", icon: "🌿" },
    { label: "Risk Center", path: "/risks", icon: "⚠️" },
    { label: "Agent Activity", path: "/activity", icon: "🤖" },
    { label: "Settings", path: "/settings", icon: "⚙️" },
    { label: "About", path: "/about", icon: "ℹ️" },
  ].filter((r) => !query || r.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-20 backdrop-blur-md font-sans">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 bg-slate-900/80">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            autoFocus
            placeholder="Search code symbols, files, actions, pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none font-mono"
          />
          <button onClick={onClose} className="rounded px-1.5 py-0.5 bg-slate-800 text-slate-400 hover:text-white text-xs font-mono">
            ESC
          </button>
        </div>

        {/* Search Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <p className="text-xs text-slate-500 text-center py-4">Searching repository graph...</p>}

          {/* Quick Navigation Routes */}
          {navRoutes.length > 0 && (
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 tracking-wider">
                Pages & Actions
              </span>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {navRoutes.slice(0, 8).map((nav) => (
                  <button
                    key={nav.path}
                    onClick={() => {
                      router.push(nav.path);
                      onClose();
                    }}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-300 hover:border-cyan-800 hover:bg-slate-900 hover:text-white transition-all text-left"
                  >
                    <span>{nav.icon}</span>
                    <span className="truncate">{nav.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Code Hits */}
          {hits.length > 0 && (
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase text-cyan-400 tracking-wider">
                Code Symbols & Files
              </span>
              <div className="mt-2 space-y-1.5">
                {hits.map((hit: any) => (
                  <div
                    key={hit.id || hit.node_id}
                    onClick={() => {
                      router.push(`/explorer?node=${encodeURIComponent(hit.id || hit.node_id)}`);
                      onClose();
                    }}
                    className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900/40 p-2.5 hover:border-cyan-700 hover:bg-slate-900 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-200">
                        {hit.label || hit.name || hit.id}
                      </span>
                      <span className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 border border-slate-800">
                        {hit.kind || "node"}
                      </span>
                    </div>
                    {hit.file_path && (
                      <p className="mt-1 font-mono text-[10px] text-slate-500">{hit.file_path}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

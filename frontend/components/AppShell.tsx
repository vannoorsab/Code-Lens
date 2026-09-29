"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGraphStore } from "@/lib/store";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import CommandPalette from "@/components/CommandPalette";

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: "/dashboard", label: "Overview", icon: "📊" },
  { path: "/explorer", label: "Code Explorer", icon: "📂" },
  { path: "/graph", label: "Knowledge Graph", icon: "🕸️" },
  { path: "/blast-radius", label: "Blast Radius", icon: "💥" },
  { path: "/agent", label: "AI Agent", icon: "🤖" },
  { path: "/memory", label: "Memory Center", icon: "🧠" },
  { path: "/learning", label: "Learning Center", icon: "📈" },
  { path: "/simulator", label: "Change Simulator", icon: "⚡" },
  { path: "/architecture", label: "Architecture", icon: "🏛️" },
  { path: "/git", label: "Git Intelligence", icon: "🌿" },
  { path: "/risks", label: "Risk Center", icon: "⚠️" },
  { path: "/team", label: "Team Knowledge", icon: "👥" },
  { path: "/activity", label: "Agent Activity", icon: "⚡" },
];

const BOTTOM_ITEMS = [
  { path: "/settings", label: "Settings", icon: "⚙️" },
  { path: "/about", label: "About", icon: "ℹ️" },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const repoUrl = useGraphStore((s) => s.repoUrl);
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const memoryMode = useGraphStore((s) => s.memoryMode);
  const toggleMemoryMode = useGraphStore((s) => s.toggleMemoryMode);
  const setPaletteOpen = useGraphStore((s) => s.setPalette);

  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const cleanRepoName = repoUrl
    ? repoUrl.replace("https://github.com/", "").replace("http://github.com/", "")
    : "psf/requests";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col border-r border-slate-800 bg-slate-950/90 backdrop-blur-md transition-all duration-300 z-30 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-mono font-bold text-slate-950 text-xs shadow-md">
              CL
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-sm tracking-tight text-white font-mono truncate">
                CODE-LENS
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded p-1 text-slate-400 hover:bg-slate-900 hover:text-white text-xs"
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Menu Items */}
        <div className="border-t border-slate-800 p-2 space-y-1">
          {BOTTOM_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800/80"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-md z-20">
          {/* Left: Repository info */}
          <div className="flex items-center gap-3">
            <Link
              href="/connect"
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-all"
            >
              <span>📁</span>
              <span className="font-semibold text-white">{cleanRepoName}</span>
              {snapshotId && <span className="text-[10px] text-slate-500">#{snapshotId}</span>}
            </Link>

            <span className="hidden sm:inline-block rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-400 border border-slate-850">
              branch: main
            </span>
          </div>

          {/* Right: Search, Memory Toggle, Agent Status */}
          <div className="flex items-center gap-3">
            {/* Global Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-white transition-all"
            >
              <span>🔍</span>
              <span className="hidden md:inline text-[11px]">Search code, memories...</span>
              <kbd className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 border border-slate-800">
                ⌘K
              </kbd>
            </button>

            {/* Memory Mode Toggle */}
            <button
              onClick={toggleMemoryMode}
              className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                memoryMode === "MEMORY_ON"
                  ? "border-cyan-800 bg-cyan-950/60 text-cyan-300"
                  : "border-slate-800 bg-slate-900 text-slate-500"
              }`}
            >
              <span>🧠</span>
              <span>{memoryMode}</span>
            </button>

            {/* Agent Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Agent Ready</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content View */}
        <main className="flex-1 overflow-y-auto relative bg-slate-950">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      {searchOpen && <GlobalSearchModal onClose={() => setSearchOpen(false)} />}

      {/* ⌘K Command Palette */}
      <CommandPalette />
    </div>
  );
}

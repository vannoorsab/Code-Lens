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
  { path: "/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/runfix", label: "Run & Fix", icon: "⚡" },
  { path: "/terminal", label: "Terminal Console", icon: "💻" },
  { path: "/changes", label: "Changes & Diff", icon: "📝" },
  { path: "/tests", label: "Test Suites", icon: "🧪" },
  { path: "/explorer", label: "Code Explorer", icon: "📂" },
  { path: "/graph", label: "Knowledge Graph", icon: "🕸️" },
  { path: "/blast-radius", label: "Blast Radius", icon: "💥" },
  { path: "/architecture", label: "Architecture", icon: "🏛️" },
  { path: "/git", label: "Git Intelligence", icon: "🌿" },
  { path: "/risks", label: "Risk Center", icon: "⚠️" },
  { path: "/activity", label: "Agent Activity", icon: "🤖" },
];

const BOTTOM_ITEMS = [
  { path: "/settings", label: "Settings", icon: "⚙️" },
  { path: "/about", label: "About", icon: "ℹ️" },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const repoUrl = useGraphStore((s) => s.repoUrl);
  const runFix = useGraphStore((s) => s.runFix);
  const setPaletteOpen = useGraphStore((s) => s.setPalette);

  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const project = runFix.project;
  const cleanRepoName = project?.name || (repoUrl ? repoUrl.replace("https://github.com/", "") : "ecommerce-dashboard");
  const isGraphPage = pathname === "/graph";
  const isWorkspacePage = pathname === "/runfix" || pathname === "/dashboard";

  return (
    <div className="app-shell">
      {mobileNavOpen && (
        <button
          className="app-mobile-scrim"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}
      {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
      <aside
        className={`app-sidebar${sidebarCollapsed ? " app-sidebar--collapsed" : ""}${mobileNavOpen ? " app-sidebar--open" : ""}`}
      >
        {/* Brand Header */}
        <div className="app-sidebar-brand">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="app-brand-mark">
              RF
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="app-brand-name">
                  CodeLens RunFix
                </span>
                <span className="app-brand-caption">
                  Autonomous Debugger
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="app-sidebar-collapse"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="app-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileNavOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`app-nav-link${isActive ? " app-nav-link--active" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="app-nav-icon" aria-hidden="true">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Settings & About Links */}
        <div className="app-nav-footer">
          {BOTTOM_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileNavOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`app-nav-link${isActive ? " app-nav-link--active" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="app-nav-icon" aria-hidden="true">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────── */}
      <div className="app-content">
        {/* Top App Bar */}
        <header className="app-topbar">
          {/* Active Project Pill */}
          <div className="app-project">
            <button
              className="app-mobile-toggle"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
            >
              <span aria-hidden="true">☰</span>
            </button>
            <span className="app-project-label">PROJECT</span>
            <div className="app-project-pill">
              <span className="app-project-status" />
              <span className="app-project-name">{cleanRepoName}</span>
            </div>
            {project?.framework && (
              <span className="app-framework-pill">
                {project.framework}
              </span>
            )}
          </div>

          {/* Quick Actions & Search */}
          <div className="app-topbar-actions">
            {/* Global Search ⌘K Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="app-search-trigger"
            >
              <span aria-hidden="true">⌕</span>
              <span className="app-search-label">Search files, symbols...</span>
              <kbd className="app-shortcut">
                ⌘K
              </kbd>
            </button>

            {/* RunFix Action Badge */}
            <Link
              href="/runfix"
              className="app-runfix-link"
            >
              <span aria-hidden="true">⚡</span>
              <span className="app-runfix-label">RunFix Console</span>
            </Link>
          </div>
        </header>

        {/* Page Viewport */}
        <main className={`app-main${isGraphPage ? " app-main--canvas" : ""}${isWorkspacePage ? " app-main--workspace" : ""}`}>
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CommandPalette />
    </div>
  );
}

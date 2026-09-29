"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import MemoryEvidencePanel from "@/components/MemoryEvidencePanel";
import MemoryComparisonModal from "@/components/MemoryComparisonModal";
import { retainMemory } from "@/lib/api";

const CATEGORIES = [
  "ALL",
  "ARCHITECTURE_DECISION",
  "CODE_REVIEW",
  "CHANGE_OUTCOME",
  "SUCCESSFUL_FIX",
  "FAILED_APPROACH",
  "DEVELOPER_FEEDBACK",
  "TEAM_CONVENTION",
  "REGRESSION",
];

export default function MemoryPage() {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const overview = useGraphStore((s) => s.memoryOverview);
  const loadOverview = useGraphStore((s) => s.loadMemoryOverview);

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"explorer" | "retain">("explorer");

  // New Experience Form
  const [newCat, setNewCat] = useState("ARCHITECTURE_DECISION");
  const [newDesc, setNewDesc] = useState("");
  const [newFiles, setNewFiles] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newOutcome, setNewOutcome] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (snapshotId !== null) void loadOverview();
  }, [snapshotId, loadOverview]);

  const memories = overview?.recent_memories || [];
  const filtered = memories.filter((m) => {
    const matchCat = categoryFilter === "ALL" || m.category === categoryFilter;
    const matchSearch =
      !searchQuery ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.related_files.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleRetain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotId || !newDesc.trim()) return;

    setSubmitting(true);
    setMsg("");
    try {
      await retainMemory(snapshotId, {
        category: newCat,
        description: newDesc.trim(),
        related_files: newFiles ? newFiles.split(",").map((s) => s.trim()) : [],
        author: newAuthor || undefined,
        outcome: newOutcome || undefined,
      });
      setMsg("✓ Experience retained successfully into Hindsight!");
      setNewDesc("");
      setNewFiles("");
      setNewAuthor("");
      setNewOutcome("");
      void loadOverview();
    } catch (err) {
      setMsg(`⚠ Retention failed: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>🧠 Hindsight Memory Engine</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Memory Center</h1>
            <p className="text-xs text-slate-400 mt-1">
              Bank: <span className="font-mono text-cyan-300">{overview?.active_bank || "codelens-default"}</span> | Total Experiences: <strong className="text-white">{overview?.total_memories || 0}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab("explorer")}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "explorer" ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" : "text-slate-400 hover:text-white"
                }`}
              >
                Memory Explorer
              </button>
              <button
                onClick={() => setActiveTab("retain")}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "retain" ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" : "text-slate-400 hover:text-white"
                }`}
              >
                + Retain Experience
              </button>
            </div>
            <MemoryComparisonModal />
          </div>
        </div>

        {activeTab === "explorer" ? (
          <div className="space-y-6">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-800/60">
              {CATEGORIES.map((cat) => {
                const count = cat === "ALL" ? overview?.total_memories : overview?.category_breakdown[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      categoryFilter === cat
                        ? "bg-cyan-900/80 text-cyan-200 border border-cyan-700"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat.replace(/_/g, " ")} {count !== undefined && count > 0 ? `(${count})` : ""}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search memories by keyword, file path, or component..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />

            {/* Memory Evidence Cards */}
            <MemoryEvidencePanel memories={filtered} />
          </div>
        ) : (
          /* Retain Experience Form */
          <form onSubmit={handleRetain} className="max-w-2xl mx-auto space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
            <h2 className="text-sm font-bold text-white">Retain New Team Experience into Hindsight</h2>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Memory Category</label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              >
                {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description / Rationale</label>
              <textarea
                rows={4}
                required
                placeholder="Describe what the team learned, decided, fixed, or encountered..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Related Files (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. backend/app/core/pipeline.py, app/api/routes.py"
                value={newFiles}
                onChange={(e) => setNewFiles(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Author / Reviewer</label>
                <input
                  type="text"
                  placeholder="e.g. @developer"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Outcome</label>
                <input
                  type="text"
                  placeholder="e.g. SUCCESS, PASSED_TESTS"
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {msg && <p className="text-xs font-medium text-cyan-400 text-center">{msg}</p>}

            <button
              type="submit"
              disabled={submitting || !newDesc.trim()}
              className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-all shadow-lg"
            >
              {submitting ? "Retaining into Hindsight..." : "Retain Experience"}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}

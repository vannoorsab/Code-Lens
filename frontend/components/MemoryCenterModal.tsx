"use client";

import React, { useEffect, useState } from "react";
import { useGraphStore } from "@/lib/store";
import type { HindsightMemory, MemoryCategory } from "@/lib/types";
import { retainMemory } from "@/lib/api";

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  ARCHITECTURE_DECISION: "Architecture Decision",
  CODE_REVIEW: "Code Review",
  CHANGE_OUTCOME: "Change Outcome",
  SUCCESSFUL_FIX: "Successful Fix",
  FAILED_APPROACH: "Failed Approach",
  DEVELOPER_FEEDBACK: "Developer Feedback",
  TEAM_CONVENTION: "Team Convention",
  REGRESSION: "Regression",
};

export default function MemoryCenterModal() {
  const isOpen = useGraphStore((s) => s.memoryCenterOpen);
  const setOpen = useGraphStore((s) => s.setMemoryCenterOpen);
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const overview = useGraphStore((s) => s.memoryOverview);
  const loadOverview = useGraphStore((s) => s.loadMemoryOverview);
  const selectedMemory = useGraphStore((s) => s.memoryDetailMemory);
  const setSelectedMemory = useGraphStore((s) => s.setMemoryDetailMemory);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"explorer" | "retain">("explorer");

  // New Memory Form State
  const [newCategory, setNewCategory] = useState<MemoryCategory>("ARCHITECTURE_DECISION");
  const [newDesc, setNewDesc] = useState("");
  const [newFiles, setNewFiles] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newOutcome, setNewOutcome] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  useEffect(() => {
    if (isOpen && snapshotId !== null) {
      void loadOverview();
    }
  }, [isOpen, snapshotId, loadOverview]);

  if (!isOpen) return null;

  const memories = overview?.recent_memories || [];
  const filteredMemories = memories.filter((m) => {
    const matchesCat = selectedCategory === "ALL" || m.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.related_files.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleRetainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotId || !newDesc.trim()) return;

    setSubmitting(true);
    setSubmitMsg("");
    try {
      await retainMemory(snapshotId, {
        category: newCategory,
        description: newDesc,
        related_files: newFiles ? newFiles.split(",").map((s) => s.trim()) : [],
        author: newAuthor || undefined,
        outcome: newOutcome || undefined,
      });
      setSubmitMsg("✓ Experience retained successfully in Hindsight Memory!");
      setNewDesc("");
      setNewFiles("");
      setNewAuthor("");
      setNewOutcome("");
      void loadOverview();
    } catch (err) {
      setSubmitMsg(`⚠ Retention failed: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Hindsight Memory Center</h2>
              <p className="text-xs text-slate-400">
                Organizational Experience Bank · Bank: <span className="font-mono text-cyan-400">{overview?.active_bank || "codelens-default"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab("explorer")}
                className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                  activeTab === "explorer" ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" : "text-slate-400 hover:text-white"
                }`}
              >
                Memory Explorer ({overview?.total_memories || 0})
              </button>
              <button
                onClick={() => setActiveTab("retain")}
                className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                  activeTab === "retain" ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" : "text-slate-400 hover:text-white"
                }`}
              >
                + Retain Experience
              </button>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === "explorer" ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Main List */}
            <div className="flex flex-1 flex-col p-6 overflow-y-auto">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-800/60">
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    selectedCategory === "ALL" ? "bg-cyan-900/80 text-cyan-200 border border-cyan-700" : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  All Categories ({overview?.total_memories || 0})
                </button>
                {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => {
                  const count = overview?.category_breakdown[catKey] || 0;
                  return (
                    <button
                      key={catKey}
                      onClick={() => setSelectedCategory(catKey)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        selectedCategory === catKey
                          ? "bg-cyan-900/80 text-cyan-200 border border-cyan-700"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      {label} {count > 0 && `(${count})`}
                    </button>
                  );
                })}
              </div>

              {/* Search input */}
              <div className="my-4">
                <input
                  type="text"
                  placeholder="Search Hindsight memories by keyword, file path, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Memories Cards Grid */}
              {filteredMemories.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center text-slate-500">
                  <span className="text-3xl">🔍</span>
                  <p className="mt-2 text-sm">No memories match your query.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMemories.map((mem) => {
                    const isSelected = selectedMemory?.id === mem.id;
                    return (
                      <div
                        key={mem.id}
                        onClick={() => setSelectedMemory(mem)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-950/20 shadow-md shadow-cyan-950/50"
                            : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-cyan-950 border border-cyan-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-300">
                            {CATEGORY_LABELS[mem.category] || mem.category}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {mem.timestamp ? new Date(mem.timestamp).toLocaleDateString() : ""}
                          </span>
                        </div>

                        <p className="mt-2 font-medium text-slate-200 text-xs leading-relaxed">
                          {mem.description}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center gap-2">
                            {mem.outcome && (
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                                Outcome: {mem.outcome}
                              </span>
                            )}
                            {mem.related_files.length > 0 && (
                              <span className="font-mono text-[10px] text-slate-400">
                                {mem.related_files.length} related file(s)
                              </span>
                            )}
                          </div>
                          {mem.author && <span className="text-slate-500">by {mem.author}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Inspector Drawer */}
            {selectedMemory && (
              <div className="w-80 border-l border-slate-800 bg-slate-900/80 p-5 overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-white text-xs">Memory Detail</h3>
                  <button onClick={() => setSelectedMemory(null)} className="text-slate-500 hover:text-white">
                    ✕
                  </button>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-500">Category</label>
                    <p className="font-medium text-cyan-300">{CATEGORY_LABELS[selectedMemory.category] || selectedMemory.category}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-500">Description</label>
                    <p className="mt-1 text-slate-200 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
                      {selectedMemory.description}
                    </p>
                  </div>

                  {selectedMemory.outcome && (
                    <div>
                      <label className="text-[10px] font-semibold uppercase text-slate-500">Outcome</label>
                      <p className="text-emerald-400 font-mono">{selectedMemory.outcome}</p>
                    </div>
                  )}

                  {selectedMemory.related_files.length > 0 && (
                    <div>
                      <label className="text-[10px] font-semibold uppercase text-slate-500">Related Files</label>
                      <div className="mt-1 space-y-1">
                        {selectedMemory.related_files.map((f) => (
                          <div key={f} className="font-mono text-[10px] text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-850 truncate">
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-500">Hindsight ID</label>
                    <p className="font-mono text-[10px] text-slate-500 break-all">{selectedMemory.id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Retain Experience Form */
          <form onSubmit={handleRetainSubmit} className="flex-1 p-8 space-y-5 overflow-y-auto max-w-2xl mx-auto w-full">
            <h3 className="text-sm font-bold text-white">Retain New Team Experience into Hindsight</h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description / Rationale</label>
              <textarea
                rows={4}
                placeholder="Describe what the team learned, decided, fixed, or encountered..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Related Files (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. backend/app/core/pipeline.py, app/api/routes.py"
                value={newFiles}
                onChange={(e) => setNewFiles(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Author / Reviewer</label>
                <input
                  type="text"
                  placeholder="e.g. @alex"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Outcome</label>
                <input
                  type="text"
                  placeholder="e.g. SUCCESS, PASSED_TESTS"
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {submitMsg && <p className="text-xs font-medium text-cyan-400">{submitMsg}</p>}

            <button
              type="submit"
              disabled={submitting || !newDesc.trim()}
              className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {submitting ? "Retaining into Hindsight..." : "Retain Experience"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

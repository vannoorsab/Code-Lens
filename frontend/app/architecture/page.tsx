"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import { runQuery } from "@/lib/api";

export default function ArchitecturePage() {
  const snapshotId = useGraphStore((s) => s.snapshotId);
  const spec = useGraphStore((s) => s.spec);

  const [untestedHubs, setUntestedHubs] = useState<any | null>(null);
  const [busFactor, setBusFactor] = useState<any | null>(null);
  const [hiddenCoupling, setHiddenCoupling] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (snapshotId !== null) {
      setLoading(true);
      Promise.all([
        runQuery(snapshotId, "untested_hubs").catch(() => null),
        runQuery(snapshotId, "bus_factor").catch(() => null),
        runQuery(snapshotId, "hidden_coupling").catch(() => null),
      ]).then(([untested, bus, hidden]) => {
        setUntestedHubs(untested);
        setBusFactor(bus);
        setHiddenCoupling(hidden);
      }).finally(() => setLoading(false));
    }
  }, [snapshotId]);

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>🏛️ Structural Analysis</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Architecture Health & Coupling</h1>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic AST facts: coupling metrics, untested hubs, bus-factor, and hidden dependencies
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 py-8 text-center">Analyzing architecture health metrics...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Untested Hubs */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-xs font-bold text-amber-300">Untested Hubs</span>
                <span className="text-xl">⚠️</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                High fan-in structural nodes that have no direct test file imports.
              </p>
              <div className="pt-2 font-mono text-xs text-slate-200">
                Found {untestedHubs?.node_ids?.length || 0} untested hub modules.
              </div>
            </div>

            {/* Card 2: Bus Factor */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-xs font-bold text-cyan-300">Bus-Factor Vulnerability</span>
                <span className="text-xl">👤</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Modules where a single developer author owns over 80% of commit churn.
              </p>
              <div className="pt-2 font-mono text-xs text-slate-200">
                {busFactor?.meta?.bus_factor_one_count || 0} single-author key files identified.
              </div>
            </div>

            {/* Card 3: Hidden Coupling */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono text-xs font-bold text-purple-300">Hidden Co-Change Coupling</span>
                <span className="text-xl">🌿</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Files with zero code imports that frequently change in identical commits.
              </p>
              <div className="pt-2 font-mono text-xs text-slate-200">
                {hiddenCoupling?.meta?.total_hidden || 0} hidden coupling pairs detected.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

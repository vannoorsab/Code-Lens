"use client";

import React from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";
import { useGraphStore } from "@/lib/store";
import HUD from "@/components/HUD";
import NodeInspector from "@/components/NodeInspector";
import SearchBar from "@/components/SearchBar";

const GraphCanvas = dynamic(() => import("@/components/GraphCanvas"), { ssr: false });
const Graph3DCanvas = dynamic(() => import("@/components/Graph3DCanvas"), { ssr: false });

export default function GraphPage() {
  const dimension = useGraphStore((s) => s.dimension);

  return (
    <AppShell>
      <div className="relative h-full w-full overflow-hidden bg-slate-950">
        {/* WebGL Canvas */}
        {dimension === "3d" ? <Graph3DCanvas /> : <GraphCanvas />}

        {/* Floating Controls Over Canvas */}
        <SearchBar />
        <HUD />
        <NodeInspector />
      </div>
    </AppShell>
  );
}

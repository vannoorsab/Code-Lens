"use client";

import dynamic from "next/dynamic";
import HeroInput from "@/components/HeroInput";
import { useGraphStore } from "@/lib/store";
import CommandPalette from "@/components/CommandPalette";
import GraphGuide from "@/components/GraphGuide";
import HUD from "@/components/HUD";
import NodeInspector from "@/components/NodeInspector";
import UnderstandingOverlay from "@/components/UnderstandingOverlay";
// Both renderers need the browser's WebGL context; never render either on
// the server. Splitting them also keeps three.js out of the bundle a reader
// who never opens the deep view has to download.
const GraphCanvas = dynamic(() => import("@/components/GraphCanvas"), { ssr: false });
const Graph3DCanvas = dynamic(() => import("@/components/Graph3DCanvas"), { ssr: false });

import LandingPage from "@/components/LandingPage";

/** One canvas. The graph fills the stage; everything else floats over it and
 *  only when it has something to say. */
export default function Home() {
  const phase = useGraphStore((s) => s.phase);
  const dimension = useGraphStore((s) => s.dimension);

  if (phase === "idle") {
    return <LandingPage />;
  }

  return (
    <main className="stage">
      {dimension === "3d" ? <Graph3DCanvas /> : <GraphCanvas />}
      <HeroInput />
      <UnderstandingOverlay />
      <HUD />
      <NodeInspector />
      <CommandPalette />
      <GraphGuide />
    </main>
  );
}

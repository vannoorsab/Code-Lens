"use client";

import React from "react";
import AppShell from "@/components/AppShell";
import TerminalConsole from "@/components/TerminalConsole";

export default function TerminalPage() {
  return (
    <AppShell>
      <div className="h-full p-4 bg-slate-950">
        <TerminalConsole />
      </div>
    </AppShell>
  );
}

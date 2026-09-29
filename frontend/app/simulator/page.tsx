"use client";

import React from "react";
import AppShell from "@/components/AppShell";
import ChangeSimulatorModal from "@/components/ChangeSimulatorModal";

export default function SimulatorPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <ChangeSimulatorModal />
      </div>
    </AppShell>
  );
}

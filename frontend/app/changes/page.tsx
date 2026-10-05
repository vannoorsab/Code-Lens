"use client";

import React from "react";
import AppShell from "@/components/AppShell";
import DiffViewer from "@/components/DiffViewer";

export default function ChangesPage() {
  return (
    <AppShell>
      <div className="h-full p-4 bg-slate-950">
        <DiffViewer />
      </div>
    </AppShell>
  );
}

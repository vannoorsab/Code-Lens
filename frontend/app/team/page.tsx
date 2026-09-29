"use client";

import React from "react";
import AppShell from "@/components/AppShell";
import TeamKnowledgeTab from "@/components/TeamKnowledgeTab";

export default function TeamPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <TeamKnowledgeTab />
      </div>
    </AppShell>
  );
}

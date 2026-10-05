import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeLens RunFix — AI Agent for Run, Diagnose, Fix & Verify",
  description: "Autonomous AI debugging engineer. Finds why code fails, fixes it, runs it again, and verifies the fix.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
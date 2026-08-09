"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { ExecutiveDashboard } from "@/features/dashboard/executive-dashboard";

export default function DashboardPage() {
  const [commandOpen, setCommandOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Executive Dashboard"
          subtitle="AI business intelligence & sales automation telemetry"
          onOpenCommandPalette={() => setCommandOpen(true)}
          onAddCompanyClick={() => window.location.href = "/companies?action=new"}
        />

        <main className="flex-1 overflow-y-auto">
          <ExecutiveDashboard />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}

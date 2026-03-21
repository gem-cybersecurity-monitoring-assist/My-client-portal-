"use client"

import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatCard } from "@/components/stat-card"
import { TeamTerminal } from "@/components/team-terminal"
import { PersonnelWorkspace } from "@/components/personnel-workspace"
import { Users } from "lucide-react"

// ⚡ Bolt Optimization: Move static icon out of render function.
const TEAM_ICON = <Users className="h-5 w-5 text-primary" />

export default function TeamPage() {
  return (
    <AuthGuard requiredRole="team">
      <PortalHeader
        title="Team Portal"
        icon={TEAM_ICON}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Team Workspace
          </h1>
          <p className="mt-1 text-sm text-muted">
            Collaborative Directory & AI Operations Oversight
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {/* Terminal - Pushed state down to localize re-renders during typing */}
          <TeamTerminal />

          {/* Quick Metrics */}
          <GlassCard>
            <h3 className="mb-4 text-base font-bold text-foreground">Quick Metrics</h3>
            <div className="space-y-3">
              <StatCard value="94%" label="Project Completion" />
              <StatCard value={47} label="Team Members" />
            </div>
          </GlassCard>
        </div>

        {/* ⚡ Bolt Optimization: State pushed down into PersonnelWorkspace */}
        <PersonnelWorkspace />
      </main>
    </AuthGuard>
  )
}

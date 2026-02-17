"use client"

import { useState, useMemo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatCard } from "@/components/stat-card"
import { TeamTerminal } from "@/components/team-terminal"
import { PersonnelDirectory } from "@/components/personnel-directory"
import { teams } from "@/lib/data"
import { Users } from "lucide-react"

const FILTER_BTNS: Array<"ALL" | "GEM" | "Alliance"> = ["ALL", "GEM", "Alliance"]

export default function TeamPage() {
  const [filter, setFilter] = useState<"ALL" | "GEM" | "Alliance">("ALL")

  // ⚡ Bolt Optimization: Memoize filtered list to prevent unnecessary re-calculations.
  // This is critical because typing in the terminal otherwise triggers a re-filter of the personnel list.
  const filtered = useMemo(() => {
    return filter === "ALL" ? teams : teams.filter((m) => m.team === filter)
  }, [filter])

  return (
    <AuthGuard requiredRole="team">
      <PortalHeader
        title="Team Portal"
        icon={<Users className="h-5 w-5 text-primary" />}
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

        {/* Personnel Directory - Memoized to prevent re-renders when interacting with terminal */}
        <GlassCard className="mt-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-base font-bold text-foreground">Personnel Directory</h3>
            <div className="flex gap-2">
              {FILTER_BTNS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "border border-glass-border text-primary hover:bg-primary/10"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <PersonnelDirectory members={filtered} />
        </GlassCard>
      </main>
    </AuthGuard>
  )
}

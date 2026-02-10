"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatusBadge } from "@/components/status-badge"
import { portfolios, teams } from "@/lib/data"
import { Settings, Search } from "lucide-react"

export default function AdminPage() {
  const [search, setSearch] = useState("")
  const filteredTeams = teams.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AuthGuard requiredRole="admin">
      <PortalHeader
        title="Admin Portal"
        icon={<Settings className="h-5 w-5 text-primary" />}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Organization Management
          </h1>
          <p className="mt-1 text-sm text-muted">
            User Administration & Portfolio Oversight
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Portfolios */}
          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Managed Portfolios</h3>
              <button className="rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-1.5 text-xs font-bold text-primary-foreground">
                Create New
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">Client</th>
                    <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">Value</th>
                    <th className="pb-3 text-xs font-bold uppercase tracking-wider text-primary">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-3 pr-4 font-medium text-foreground">{p.client}</td>
                      <td className="py-3 pr-4 text-muted">{p.value}</td>
                      <td className={`py-3 font-semibold ${p.change.startsWith("+") ? "text-primary" : "text-destructive"}`}>
                        {p.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* User Lookup */}
          <GlassCard>
            <h3 className="mb-4 text-base font-bold text-foreground">Quick User Lookup</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-glass-border bg-input pl-10 pr-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {filteredTeams.slice(0, 8).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-surface"
                >
                  <span className="text-sm font-medium text-foreground">{u.name}</span>
                  <StatusBadge label={u.role} variant="default" />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </main>
    </AuthGuard>
  )
}

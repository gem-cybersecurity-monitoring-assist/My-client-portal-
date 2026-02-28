"use client"

import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { tenants, logs } from "@/lib/data"
import { Crown } from "lucide-react"

export default function SuperAdminPage() {
  return (
    <AuthGuard requiredRole="superadmin">
      <PortalHeader
        title="SuperAdmin Portal"
        icon={<Crown className="h-5 w-5 text-primary" />}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Platform Control Center
          </h1>
          <p className="mt-1 text-sm text-muted">
            Global Tenant Management & Infrastructure Monitoring
          </p>
        </div>

        {/* Infrastructure Health */}
        <GlassCard hover={false} className="mt-6">
          <h3 className="mb-4 text-base font-bold text-foreground">Infrastructure Health</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard value="99.9%" label="Uptime" />
            <StatCard value={12} label="Active Nodes" />
            <StatCard value="45ms" label="Avg Latency" />
          </div>
        </GlassCard>

        {/* Tenant Table */}
        <GlassCard className="mt-4 sm:mt-6">
          <h3 className="mb-4 text-base font-bold text-foreground">Tenant Oversight</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="pb-2 pr-3 font-bold uppercase tracking-wider text-primary sm:pb-3 sm:pr-4">Tenant</th>
                  <th className="pb-2 pr-3 font-bold uppercase tracking-wider text-primary sm:pb-3 sm:pr-4">Status</th>
                  <th className="pb-2 pr-3 font-bold uppercase tracking-wider text-primary sm:pb-3 sm:pr-4">Users</th>
                  <th className="pb-2 font-bold uppercase tracking-wider text-primary sm:pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium text-foreground sm:py-3 sm:pr-4 truncate">{t.name}</td>
                    <td className="py-2 pr-3 sm:py-3 sm:pr-4">
                      <StatusBadge
                        label={t.status}
                        variant={t.status.toLowerCase() as "healthy" | "warning" | "critical"}
                      />
                    </td>
                    <td className="py-2 pr-3 text-muted sm:py-3 sm:pr-4">{t.users}</td>
                    <td className="py-2 font-semibold text-foreground sm:py-3">{t.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* System Logs */}
        <GlassCard className="mt-4">
          <h3 className="mb-4 text-base font-bold text-foreground">System Logs</h3>
          <div className="max-h-64 space-y-2 overflow-y-auto font-mono text-xs sm:text-sm">
            {logs.map((l, i) => (
              <div
                key={i}
                className="flex flex-col gap-0.5 border-b border-border/30 pb-2"
              >
                <span className="text-xs text-muted">[{l.time}]</span>
                <span className="text-xs font-semibold text-secondary">{l.user}</span>
                <span className="text-xs text-foreground truncate">{l.action}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </AuthGuard>
  )
}

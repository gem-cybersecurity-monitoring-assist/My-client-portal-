"use client"

import { memo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { tenants, logs, type Tenant, type LogEntry } from "@/lib/data"
import { Crown } from "lucide-react"

// ⚡ Bolt Optimization: Move static icon out of render function.
const SUPERADMIN_ICON = <Crown className="h-5 w-5 text-primary" />

/**
 * ⚡ Bolt Optimization: Memoize individual Tenant rows.
 * Prevents unnecessary re-renders when other parts of the SuperAdmin page update.
 */
const TenantRow = memo(function TenantRow({ tenant }: { tenant: Tenant }) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-3 pr-4 font-medium text-foreground">{tenant.name}</td>
      <td className="py-3 pr-4">
        <StatusBadge
          label={tenant.status}
          variant={tenant.status.toLowerCase() as "healthy" | "warning" | "critical"}
        />
      </td>
      <td className="py-3 pr-4 text-muted">{tenant.users}</td>
      <td className="py-3 font-semibold text-foreground">{tenant.revenue}</td>
    </tr>
  )
})

/**
 * ⚡ Bolt Optimization: Memoize individual System Log items.
 * Uses a stable composite key in the parent list to optimize reconciliation.
 */
const SystemLogItem = memo(function SystemLogItem({ log }: { log: LogEntry }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/30 pb-2 md:flex-row md:items-center md:gap-3">
      <span className="text-xs text-muted">[{log.time}]</span>
      <span className="text-xs font-semibold text-secondary">{log.user}</span>
      <span className="text-xs text-foreground">{log.action}</span>
    </div>
  )
})

export default function SuperAdminPage() {
  return (
    <AuthGuard requiredRole="superadmin">
      <PortalHeader
        title="SuperAdmin Portal"
        icon={SUPERADMIN_ICON}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Platform Control Center
          </h1>
          <p className="mt-1 text-sm text-muted">
            Global Tenant Management & Infrastructure Monitoring
          </p>
        </div>

        {/* Tenant Table */}
        <GlassCard className="mt-6">
          <h3 className="mb-4 text-base font-bold text-foreground">Tenant Oversight</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">Tenant Name</th>
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">Status</th>
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">Users</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-wider text-primary">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <TenantRow key={t.id} tenant={t} />
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* System Logs */}
        <GlassCard className="mt-4">
          <h3 className="mb-4 text-base font-bold text-foreground">System Logs</h3>
          <div className="max-h-64 space-y-2 overflow-y-auto font-mono text-sm">
            {logs.map((l) => (
              <SystemLogItem
                key={`${l.time}-${l.user}-${l.action}`}
                log={l}
              />
            ))}
          </div>
        </GlassCard>

        {/* Infrastructure Health */}
        <GlassCard hover={false} className="mt-4">
          <h3 className="mb-4 text-base font-bold text-foreground">Infrastructure Health</h3>
          <div className="grid grid-cols-3 gap-3">
            <StatCard value="99.9%" label="Uptime" />
            <StatCard value={12} label="Active Nodes" />
            <StatCard value="45ms" label="Avg Latency" />
          </div>
        </GlassCard>
      </main>
    </AuthGuard>
  )
}

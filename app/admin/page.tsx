"use client"

import { memo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { UserLookup } from "@/components/user-lookup"
import { portfolios, type Portfolio } from "@/lib/data"
import { Settings } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { portfolios, teams } from "@/lib/data"
import { Settings, Search, ClipboardList, Users } from "lucide-react"
import Link from "next/link"

// ⚡ Bolt Optimization: Move static JSX out of the render cycle.
// This ensures that memoized components like PortalHeader don't re-render
// because of a new 'icon' object reference on every parent render.
const ADMIN_ICON = <Settings className="h-5 w-5 text-primary" />

/**
 * ⚡ Bolt Optimization: Memoize individual portfolio rows.
 * Ensures the managed portfolios table skips reconciliation when unrelated page state changes.
 */
const PortfolioRow = memo(function PortfolioRow({ p }: { p: Portfolio }) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-3 pr-4 font-medium text-foreground">{p.client}</td>
      <td className="py-3 pr-4 text-muted">{p.value}</td>
      <td className={`py-3 font-semibold ${p.change.startsWith("+") ? "text-primary" : "text-destructive"}`}>
        {p.change}
      </td>
    </tr>
  )
})

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <PortalHeader
        title="Admin Portal"
        icon={ADMIN_ICON}
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

        {/* Sub-navigation */}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Users className="h-4 w-4" />
            Manage Users
          </Link>
          <Link
            href="/admin/requests"
            className="flex items-center gap-2 rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <ClipboardList className="h-4 w-4" />
            Service Requests
          </Link>
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
                    <PortfolioRow key={p.id} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* User Lookup - State pushed down into specialized component */}
          <GlassCard>
            <UserLookup />
          </GlassCard>
        </div>
      </main>
    </AuthGuard>
  )
}

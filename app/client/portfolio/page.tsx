"use client"

import { useState, useEffect, useTransition } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatusBadge } from "@/components/status-badge"
import {
  getMyPortfolioAction,
  type PortfolioDetail,
  type HoldingRow,
} from "@/lib/actions/portfolio"
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowLeft,
  Loader2,
  BarChart2,
  Receipt,
} from "lucide-react"
import Link from "next/link"

// ─── Asset-class colour map ──────────────────────────────────────────────────
const assetClassColour: Record<string, string> = {
  STOCK:          "bg-primary/20 text-primary",
  CRYPTO:         "bg-secondary/20 text-secondary",
  REAL_ESTATE:    "bg-warning/20 text-warning",
  PRIVATE_EQUITY: "bg-destructive/20 text-destructive",
  BONDS:          "bg-primary/10 text-primary",
  CASH:           "bg-muted/20 text-muted",
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}
function fmtPct(n: number) {
  const sign = n >= 0 ? "+" : ""
  return `${sign}${n.toFixed(2)}%`
}

// ─── Allocation table derived from holdings ──────────────────────────────────
function buildAllocation(holdings: HoldingRow[]) {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0)
  const map = new Map<string, number>()
  for (const h of holdings) {
    map.set(h.assetClass, (map.get(h.assetClass) ?? 0) + h.currentValue)
  }
  return Array.from(map.entries())
    .map(([cls, val]) => ({ cls, val, pct: total > 0 ? (val / total) * 100 : 0 }))
    .sort((a, b) => b.val - a.val)
}

export default function ClientPortfolioPage() {
  const { session } = useAuth()
  const [portfolio, setPortfolio] = useState<PortfolioDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"holdings" | "allocation" | "transactions">("holdings")
  const [_isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!session?.email) return
    startTransition(async () => {
      try {
        const data = await getMyPortfolioAction(session.email)
        setPortfolio(data)
      } catch {
        setError("Failed to load portfolio.")
      } finally {
        setLoading(false)
      }
    })
  }, [session?.email])

  return (
    <AuthGuard requiredRole="client">
      <PortalHeader
        title="My Portfolio"
        icon={<PieChart className="h-5 w-5 text-primary" />}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/client"
            className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Client Portal
          </Link>
        </div>

        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Investment Portfolio
          </h1>
          <p className="mt-1 text-sm text-muted">
            Holdings, allocation, and transaction history
          </p>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <GlassCard className="mt-6">
            <p className="text-sm text-destructive">{error}</p>
          </GlassCard>
        ) : !portfolio ? (
          <GlassCard className="mt-6 text-center">
            <PieChart className="mx-auto mb-3 h-10 w-10 text-muted" />
            <p className="font-semibold text-foreground">No portfolio on file</p>
            <p className="mt-1 text-sm text-muted">
              Contact your account manager to set up your investment portfolio.
            </p>
          </GlassCard>
        ) : (
          <>
            {/* ── Summary banner ────────────────────────────────────────── */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <GlassCard hover={false}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Total Value</p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">
                  {fmtUsd(portfolio.totalValue)}
                </p>
              </GlassCard>
              <GlassCard hover={false}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Total Return</p>
                <p className={`mt-1 text-2xl font-extrabold ${portfolio.totalReturn >= 0 ? "text-primary" : "text-destructive"}`}>
                  {fmtUsd(portfolio.totalReturn)}
                </p>
              </GlassCard>
              <GlassCard hover={false}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Return %</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {portfolio.returnPct >= 0
                    ? <TrendingUp className="h-5 w-5 text-primary" />
                    : <TrendingDown className="h-5 w-5 text-destructive" />}
                  <p className={`text-2xl font-extrabold ${portfolio.returnPct >= 0 ? "text-primary" : "text-destructive"}`}>
                    {fmtPct(portfolio.returnPct)}
                  </p>
                </div>
              </GlassCard>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div className="mt-6 flex gap-2 border-b border-glass-border pb-0">
              {(["holdings", "allocation", "transactions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === tab
                      ? "border border-b-background border-glass-border bg-card text-primary"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab === "holdings" && <BarChart2 className="h-3.5 w-3.5" />}
                  {tab === "allocation" && <PieChart className="h-3.5 w-3.5" />}
                  {tab === "transactions" && <Receipt className="h-3.5 w-3.5" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* ── Holdings tab ──────────────────────────────────────────── */}
            {activeTab === "holdings" && (
              <GlassCard className="mt-0 rounded-tl-none">
                {portfolio.holdings.length === 0 ? (
                  <p className="text-sm text-muted">No holdings recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-glass-border">
                          {["Asset", "Class", "Qty", "Cost Basis", "Current Value", "Return"].map((h) => (
                            <th key={h} className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary last:pr-0">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.holdings.map((h) => (
                          <tr key={h.id} className="border-b border-border/40 hover:bg-surface">
                            <td className="py-3 pr-4">
                              <p className="font-semibold text-foreground">{h.name}</p>
                              <p className="text-xs text-muted">{h.symbol}</p>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${assetClassColour[h.assetClass] ?? "bg-muted/20 text-muted"}`}>
                                {h.assetClass.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-muted">{h.quantity.toLocaleString()}</td>
                            <td className="py-3 pr-4 text-muted">{fmtUsd(h.costBasis)}</td>
                            <td className="py-3 pr-4 font-semibold text-foreground">{fmtUsd(h.currentValue)}</td>
                            <td className={`py-3 font-bold ${h.returnPct >= 0 ? "text-primary" : "text-destructive"}`}>
                              {fmtPct(h.returnPct)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassCard>
            )}

            {/* ── Allocation tab ─────────────────────────────────────────── */}
            {activeTab === "allocation" && (
              <GlassCard className="mt-0 rounded-tl-none">
                {portfolio.holdings.length === 0 ? (
                  <p className="text-sm text-muted">No holdings to display allocation for.</p>
                ) : (
                  <div className="space-y-3">
                    {buildAllocation(portfolio.holdings).map(({ cls, val, pct }) => (
                      <div key={cls}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-semibold text-foreground">{cls.replace("_", " ")}</span>
                          <span className="text-muted">
                            {fmtUsd(val)} &middot; {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-glass-border">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* ── Transactions tab ───────────────────────────────────────── */}
            {activeTab === "transactions" && (
              <GlassCard className="mt-0 rounded-tl-none">
                {portfolio.transactions.length === 0 ? (
                  <p className="text-sm text-muted">No transactions on record.</p>
                ) : (
                  <div className="space-y-1">
                    {portfolio.transactions.map((tx) => {
                      const isCr = ["BUY", "DEPOSIT", "DIVIDEND"].includes(tx.type)
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-surface"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isCr ? "bg-primary/10" : "bg-destructive/10"}`}>
                              {isCr
                                ? <TrendingUp className="h-4 w-4 text-primary" />
                                : <TrendingDown className="h-4 w-4 text-destructive" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{tx.description}</p>
                              <p className="text-xs text-muted">
                                {tx.symbol ? `${tx.symbol} · ` : ""}
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${isCr ? "text-primary" : "text-destructive"}`}>
                              {isCr ? "+" : "-"}{fmtUsd(Math.abs(tx.amount))}
                            </p>
                            <StatusBadge label={tx.type} variant="default" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </GlassCard>
            )}

            {/* ── Accounts ──────────────────────────────────────────────── */}
            {portfolio.accounts.length > 0 && (
              <GlassCard className="mt-4">
                <h3 className="mb-4 text-base font-bold text-foreground">Accounts</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {portfolio.accounts.map((acc) => (
                    <div key={acc.id} className="rounded-lg border border-glass-border bg-surface px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{acc.type}</p>
                      <p className="mt-0.5 text-base font-bold text-foreground">{acc.name}</p>
                      <p className="mt-1 text-lg font-extrabold text-primary">
                        {fmtUsd(acc.balance)}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* ── Managed-by notice ─────────────────────────────────────── */}
            {portfolio.managedBy && (
              <p className="mt-4 text-xs text-muted">
                Portfolio managed by <span className="font-semibold text-foreground">{portfolio.managedBy.name}</span>
              </p>
            )}
          </>
        )}
      </main>
    </AuthGuard>
  )
}

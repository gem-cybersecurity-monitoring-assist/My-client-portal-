"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatusBadge } from "@/components/status-badge"
import {
  getMyPortfolioAction,
  getPerformanceReportAction,
  addPortfolioTransactionAction,
  type PortfolioDetail,
  type PerformanceReport,
  type PerformancePeriod,
  type HoldingRow,
} from "@/lib/actions/portfolio"
import {
  TrendingUp, TrendingDown, PieChart, ArrowLeft, Loader2,
  BarChart2, Receipt, Plus, Clock, CheckCircle, XCircle,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}
function fmtPct(n: number, decimals = 2) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`
}

const assetClassColour: Record<string, string> = {
  STOCK:          "bg-primary/20 text-primary",
  CRYPTO:         "bg-secondary/20 text-secondary",
  REAL_ESTATE:    "bg-warning/20 text-warning",
  PRIVATE_EQUITY: "bg-destructive/20 text-destructive",
  BONDS:          "bg-primary/10 text-primary",
  CASH:           "bg-muted/20 text-muted-foreground",
}

const txStatusIcon: Record<string, React.ReactNode> = {
  Confirmed: <CheckCircle className="h-3.5 w-3.5 text-primary" />,
  Pending:   <Clock       className="h-3.5 w-3.5 text-warning" />,
  Reversed:  <XCircle     className="h-3.5 w-3.5 text-destructive" />,
}

const txStatusVariant: Record<string, "default" | "success" | "warning" | "critical"> = {
  Confirmed: "success",
  Pending:   "warning",
  Reversed:  "critical",
}

const isCreditType = (type: string) => ["BUY", "DEPOSIT", "DIVIDEND", "TRANSFER"].includes(type)

function buildAllocation(holdings: HoldingRow[]) {
  const map = new Map<string, number>()
  for (const h of holdings) {
    map.set(h.assetClass, (map.get(h.assetClass) ?? 0) + h.currentValue)
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0)
  return [...map.entries()]
    .map(([cls, val]) => ({ cls, val, pct: total > 0 ? (val / total) * 100 : 0 }))
    .sort((a, b) => b.val - a.val)
}

type Tab = "overview" | "holdings" | "allocation" | "transactions" | "add"

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ClientPortfolioPage() {
  const { session } = useAuth()
  const [portfolio,  setPortfolio]  = useState<PortfolioDetail | null>(null)
  const [perfReport, setPerfReport] = useState<PerformanceReport | null>(null)
  const [perfPeriod, setPerfPeriod] = useState<PerformancePeriod>("monthly")
  const [loading,    setLoading]    = useState(true)
  const [perfLoading, setPerfLoading] = useState(false)
  const [error,      setError]      = useState("")
  const [activeTab,  setActiveTab]  = useState<Tab>("overview")
  const [isPending,  startTransition] = useTransition()

  // ── Transaction form state ──────────────────────────────────────────────
  const [txType,    setTxType]    = useState("DEPOSIT")
  const [txDesc,    setTxDesc]    = useState("")
  const [txAmount,  setTxAmount]  = useState("")
  const [txSymbol,  setTxSymbol]  = useState("")
  const [txError,   setTxError]   = useState("")
  const [txSuccess, setTxSuccess] = useState("")

  const loadPortfolio = useCallback(() => {
    if (!session?.email) return
    setLoading(true)
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

  useEffect(() => { loadPortfolio() }, [loadPortfolio])

  // Load performance report when period or portfolio changes
  useEffect(() => {
    if (!portfolio || !session?.email) return
    setPerfLoading(true)
    startTransition(async () => {
      const res = await getPerformanceReportAction(portfolio.id, perfPeriod, session.email)
      if (res.ok) setPerfReport(res.report)
      setPerfLoading(false)
    })
  }, [portfolio?.id, perfPeriod, session?.email])

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    setTxError(""); setTxSuccess("")
    const amount = parseFloat(txAmount)
    if (isNaN(amount) || amount <= 0) { setTxError("Amount must be a positive number."); return }
    if (!txDesc.trim()) { setTxError("Description is required."); return }
    if (!portfolio || !session?.email) return

    startTransition(async () => {
      const res = await addPortfolioTransactionAction({
        portfolioId: portfolio.id,
        type:        txType,
        description: txDesc.trim(),
        amount,
        symbol:      txSymbol.trim() || undefined,
        userEmail:   session.email,
      })
      if (res.ok) {
        setTxSuccess("Request submitted. Pending admin confirmation.")
        setTxDesc(""); setTxAmount(""); setTxSymbol("")
        loadPortfolio()
      } else {
        setTxError(res.error ?? "Failed to submit transaction.")
      }
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AuthGuard requiredRole="client">
      <PortalHeader title="My Portfolio" icon={<PieChart className="h-5 w-5 text-primary" />} />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        {/* Back link */}
        <div className="mb-5 flex items-center gap-3">
          <Link href="/client" className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Client Portal
          </Link>
        </div>

        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Investment Portfolio
          </h1>
          <p className="mt-1 text-sm text-muted">Holdings, performance, and transaction history</p>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : error ? (
          <GlassCard className="mt-6"><p className="text-sm text-destructive">{error}</p></GlassCard>
        ) : !portfolio ? (
          <GlassCard className="mt-6 py-10 text-center">
            <PieChart className="mx-auto mb-3 h-10 w-10 text-muted" />
            <p className="font-semibold text-foreground">No portfolio on file</p>
            <p className="mt-1 text-sm text-muted">Contact your account manager to open your portfolio.</p>
          </GlassCard>
        ) : (
          <>
            {/* ── KPI Banner ─────────────────────────────────────────────── */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Value",    value: fmtUsd(portfolio.valuation.totalValue),  sub: null },
                { label: "Total Return",   value: fmtUsd(portfolio.valuation.totalReturn),
                  positive: portfolio.valuation.totalReturn >= 0 },
                { label: "Return %",       value: fmtPct(portfolio.valuation.returnPct),
                  positive: portfolio.valuation.returnPct >= 0, icon: true },
                { label: "Cash Balance",   value: fmtUsd(portfolio.valuation.cashBalance), sub: null },
              ].map(({ label, value, positive, icon }) => (
                <GlassCard key={label} hover={false} className="py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {icon && (positive
                      ? <TrendingUp className="h-4 w-4 text-primary" />
                      : <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <p className={`text-xl font-extrabold ${
                      positive === undefined ? "text-foreground"
                      : positive ? "text-primary" : "text-destructive"
                    }`}>{value}</p>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Pending notice */}
            {(portfolio.valuation.pendingDeposits > 0 || portfolio.valuation.pendingWithdrawals > 0) && (
              <div className="mt-3 flex flex-wrap gap-3">
                {portfolio.valuation.pendingDeposits > 0 && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
                    <Clock className="h-3.5 w-3.5" />
                    Pending deposit: {fmtUsd(portfolio.valuation.pendingDeposits)} — awaiting admin confirmation
                  </p>
                )}
                {portfolio.valuation.pendingWithdrawals > 0 && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
                    <Clock className="h-3.5 w-3.5" />
                    Pending withdrawal: {fmtUsd(portfolio.valuation.pendingWithdrawals)} — awaiting admin confirmation
                  </p>
                )}
              </div>
            )}

            {/* ── Tabs ───────────────────────────────────────────────────── */}
            <div className="mt-6 flex flex-wrap gap-1 border-b border-glass-border">
              {(["overview", "holdings", "allocation", "transactions", "add"] as Tab[]).map((tab) => {
                const icons: Record<Tab, React.ReactNode> = {
                  overview:     <BarChart2   className="h-3.5 w-3.5" />,
                  holdings:     <PieChart    className="h-3.5 w-3.5" />,
                  allocation:   <BarChart2   className="h-3.5 w-3.5" />,
                  transactions: <Receipt     className="h-3.5 w-3.5" />,
                  add:          <Plus        className="h-3.5 w-3.5" />,
                }
                const labels: Record<Tab, string> = {
                  overview: "Performance", holdings: "Holdings",
                  allocation: "Allocation", transactions: "History", add: "Add",
                }
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "border border-b-background border-glass-border bg-card text-primary"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {icons[tab]}{labels[tab]}
                  </button>
                )
              })}
            </div>

            {/* ── Overview / Performance ─────────────────────────────────── */}
            {activeTab === "overview" && (
              <GlassCard className="mt-0 rounded-tl-none">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-foreground">Performance Report</h3>
                  <div className="flex gap-2">
                    {(["daily", "monthly", "alltime"] as PerformancePeriod[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPerfPeriod(p)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                          perfPeriod === p
                            ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                            : "border border-glass-border text-muted hover:text-foreground"
                        }`}
                      >
                        {p === "daily" ? "7 Days" : p === "monthly" ? "30 Days" : "All Time"}
                      </button>
                    ))}
                  </div>
                </div>

                {perfLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : perfReport ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3 mb-6">
                      <div className="rounded-lg bg-surface px-4 py-3 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Start Value</p>
                        <p className="mt-1 text-base font-extrabold text-foreground">{fmtUsd(perfReport.startValue)}</p>
                      </div>
                      <div className="rounded-lg bg-surface px-4 py-3 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Current Value</p>
                        <p className="mt-1 text-base font-extrabold text-foreground">{fmtUsd(perfReport.currentValue)}</p>
                      </div>
                      <div className="rounded-lg bg-surface px-4 py-3 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Period Return</p>
                        <p className={`mt-1 text-base font-extrabold ${perfReport.change >= 0 ? "text-primary" : "text-destructive"}`}>
                          {fmtUsd(perfReport.change)} ({fmtPct(perfReport.changePct)})
                        </p>
                      </div>
                    </div>

                    {/* Snapshot mini-bars */}
                    {perfReport.snapshots.length > 0 && (
                      <div className="mb-6">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Value History</p>
                        <div className="flex items-end gap-1 h-20">
                          {(() => {
                            const vals = perfReport.snapshots.map((s) => s.totalValue)
                            const min  = Math.min(...vals)
                            const max  = Math.max(...vals)
                            const range = max - min || 1
                            return vals.map((v, i) => (
                              <div
                                key={i}
                                title={`${fmtUsd(v)}`}
                                className="flex-1 rounded-t bg-gradient-to-t from-primary/60 to-primary transition-all"
                                style={{ height: `${((v - min) / range) * 80 + 20}%` }}
                              />
                            ))
                          })()}
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-muted">
                          <span>{new Date(perfReport.snapshots[0].date).toLocaleDateString()}</span>
                          <span>{new Date(perfReport.snapshots[perfReport.snapshots.length - 1].date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Activity breakdown */}
                    <div className="grid gap-3 sm:grid-cols-4">
                      {[
                        { label: "Deposited",    val: perfReport.totalDeposited,  cls: "text-primary" },
                        { label: "Withdrawn",    val: perfReport.totalWithdrawn,  cls: "text-destructive" },
                        { label: "Dividends",    val: perfReport.dividendsEarned, cls: "text-primary" },
                        { label: "Fees Charged", val: perfReport.feesCharged,     cls: "text-warning" },
                      ].map(({ label, val, cls }) => (
                        <div key={label} className="rounded-lg border border-glass-border px-3 py-2.5 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
                          <p className={`mt-0.5 text-sm font-extrabold ${cls}`}>{fmtUsd(val)}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted">No performance data available.</p>
                )}
              </GlassCard>
            )}

            {/* ── Holdings Tab ───────────────────────────────────────────── */}
            {activeTab === "holdings" && (
              <GlassCard className="mt-0 rounded-tl-none overflow-x-auto">
                {portfolio.holdings.length === 0 ? (
                  <p className="text-sm text-muted">No holdings recorded yet.</p>
                ) : (
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-glass-border">
                        {["Asset", "Class", "Qty", "Cost Basis", "Current Value", "Alloc %", "Return"].map((h) => (
                          <th key={h} className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary last:pr-0">{h}</th>
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
                            <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${assetClassColour[h.assetClass] ?? "bg-muted/20 text-muted"}`}>
                              {h.assetClass.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-muted">{h.quantity.toLocaleString()}</td>
                          <td className="py-3 pr-4 text-muted">{fmtUsd(h.costBasis)}</td>
                          <td className="py-3 pr-4 font-semibold text-foreground">{fmtUsd(h.currentValue)}</td>
                          <td className="py-3 pr-4 text-muted">{h.allocationPct.toFixed(1)}%</td>
                          <td className={`py-3 font-bold ${h.returnPct >= 0 ? "text-primary" : "text-destructive"}`}>
                            {fmtPct(h.returnPct)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </GlassCard>
            )}

            {/* ── Allocation Tab ─────────────────────────────────────────── */}
            {activeTab === "allocation" && (
              <GlassCard className="mt-0 rounded-tl-none">
                {portfolio.holdings.length === 0 ? (
                  <p className="text-sm text-muted">No holdings to display.</p>
                ) : (
                  <div className="space-y-4">
                    {buildAllocation(portfolio.holdings).map(({ cls, val, pct }) => (
                      <div key={cls}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="font-semibold text-foreground">{cls.replace("_", " ")}</span>
                          <span className="text-muted">{fmtUsd(val)} · {pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-glass-border">
                          <div
                            className="h-2.5 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* ── Transactions Tab ───────────────────────────────────────── */}
            {activeTab === "transactions" && (
              <GlassCard className="mt-0 rounded-tl-none">
                {portfolio.transactions.length === 0 ? (
                  <p className="text-sm text-muted">No transactions on record.</p>
                ) : (
                  <div className="space-y-1">
                    {portfolio.transactions.map((tx) => {
                      const isCredit = isCreditType(tx.type)
                      const isReversed = tx.status === "Reversed"
                      return (
                        <div key={tx.id} className={`flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-surface ${isReversed ? "opacity-50" : ""}`}>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isCredit ? "bg-primary/10" : "bg-destructive/10"}`}>
                              {isCredit
                                ? <TrendingUp className="h-4 w-4 text-primary" />
                                : <TrendingDown className="h-4 w-4 text-destructive" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{tx.description}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted">
                                {tx.symbol && <span>{tx.symbol} ·</span>}
                                <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">
                                  {txStatusIcon[tx.status]}
                                  {tx.status}
                                </span>
                              </div>
                              {tx.adminNote && (
                                <p className="text-[11px] text-muted italic mt-0.5">Note: {tx.adminNote}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${isReversed ? "line-through text-muted" : isCredit ? "text-primary" : "text-destructive"}`}>
                              {isCredit ? "+" : "-"}{fmtUsd(tx.amount)}
                            </p>
                            <StatusBadge label={tx.type} variant={txStatusVariant[tx.status] ?? "default"} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </GlassCard>
            )}

            {/* ── Add Transaction Tab ─────────────────────────────────────── */}
            {activeTab === "add" && (
              <GlassCard className="mt-0 rounded-tl-none">
                <h3 className="mb-1 font-bold text-foreground">Submit Transaction Request</h3>
                <p className="mb-5 text-xs text-muted">
                  Deposit and withdrawal requests are submitted as <span className="font-semibold text-warning">Pending</span> and require admin confirmation.
                </p>

                {txSuccess ? (
                  <div className="rounded-lg bg-primary/10 px-4 py-5 text-center">
                    <CheckCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
                    <p className="font-bold text-primary">{txSuccess}</p>
                    <button
                      onClick={() => { setTxSuccess(""); setActiveTab("transactions") }}
                      className="mt-3 flex items-center gap-1.5 mx-auto text-sm text-muted hover:text-primary"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> View History
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAddTransaction} className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Transaction Type</label>
                      <select
                        value={txType}
                        onChange={(e) => setTxType(e.target.value)}
                        className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary"
                      >
                        <option value="DEPOSIT">Deposit</option>
                        <option value="WITHDRAWAL">Withdrawal</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Amount (USD)</label>
                      <input
                        required type="number" min="0.01" step="0.01"
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                        placeholder="0.00"
                        className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-muted">Description</label>
                      <input
                        required value={txDesc}
                        onChange={(e) => setTxDesc(e.target.value)}
                        placeholder="e.g. Monthly savings deposit"
                        className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    {txError && (
                      <p className="sm:col-span-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{txError}</p>
                    )}
                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="submit" disabled={isPending}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
                      >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Submit Request
                      </button>
                    </div>
                  </form>
                )}
              </GlassCard>
            )}

            {/* ── Accounts ─────────────────────────────────────────────── */}
            {portfolio.accounts.length > 0 && activeTab !== "add" && (
              <GlassCard className="mt-4">
                <h3 className="mb-3 text-sm font-bold text-foreground">Accounts</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {portfolio.accounts.map((acc) => (
                    <div key={acc.id} className="rounded-lg border border-glass-border px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{acc.type}</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">{acc.name}</p>
                      <p className="mt-1 text-lg font-extrabold text-primary">{fmtUsd(acc.balance)}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {portfolio.managedBy && (
              <p className="mt-3 text-xs text-muted">
                Managed by <span className="font-semibold text-foreground">{portfolio.managedBy.name}</span>
              </p>
            )}
          </>
        )}
      </main>
    </AuthGuard>
  )
}

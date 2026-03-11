"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatusBadge } from "@/components/status-badge"
import {
  getPortfoliosAction,
  getPortfolioByIdAction,
  getAdminSummaryAction,
  getPerformanceReportAction,
  createPortfolioAction,
  addPortfolioTransactionAction,
  reverseTransactionAction,
  confirmTransactionAction,
  correctTransactionAction,
  type PortfolioSummary,
  type PortfolioDetail,
  type AdminSummary,
  type PerformancePeriod,
  type TransactionRow,
} from "@/lib/actions/portfolio"
import {
  PieChart, ArrowLeft, Loader2, ChevronRight, X, Plus,
  TrendingUp, TrendingDown, BarChart2, Clock, CheckCircle,
  XCircle, AlertTriangle, RefreshCw, DollarSign, Users,
} from "lucide-react"
import Link from "next/link"

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}
function fmtPct(n: number) { return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%` }

const statusVariant: Record<string, "default" | "success" | "warning" | "critical"> = {
  Active: "success", Inactive: "warning", Closed: "critical",
}
const txStatusVariant: Record<string, "default" | "success" | "warning" | "critical"> = {
  Confirmed: "success", Pending: "warning", Reversed: "critical",
}
const isCreditType = (t: string) => ["BUY", "DEPOSIT", "DIVIDEND", "TRANSFER"].includes(t)

type DetailTab = "summary" | "holdings" | "transactions" | "add" | "performance"

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminPortfoliosPage() {
  const { session } = useAuth()
  const [portfolios,  setPortfolios]  = useState<PortfolioSummary[]>([])
  const [selected,    setSelected]    = useState<PortfolioDetail | null>(null)
  const [summary,     setSummary]     = useState<AdminSummary | null>(null)
  const [detailTab,   setDetailTab]   = useState<DetailTab>("summary")
  const [loadError,   setLoadError]   = useState("")
  const [detailError, setDetailError] = useState("")
  const [isPending,   startTransition] = useTransition()

  // ── Create portfolio form ───────────────────────────────────────────────
  const [showCreate, setShowCreate]   = useState(false)
  const [cpName, setCpName]           = useState("")
  const [cpDesc, setCpDesc]           = useState("")
  const [cpEmail, setCpEmail]         = useState("")
  const [cpError, setCpError]         = useState("")
  const [cpSuccess, setCpSuccess]     = useState("")

  // ── Add transaction form ────────────────────────────────────────────────
  const [txType,    setTxType]    = useState("BUY")
  const [txDesc,    setTxDesc]    = useState("")
  const [txAmount,  setTxAmount]  = useState("")
  const [txQty,     setTxQty]     = useState("")
  const [txPrice,   setTxPrice]   = useState("")
  const [txSymbol,  setTxSymbol]  = useState("")
  const [txError,   setTxError]   = useState("")
  const [txSuccess, setTxSuccess] = useState("")

  // ── Reversal modal ──────────────────────────────────────────────────────
  const [reversing,       setReversing]       = useState<TransactionRow | null>(null)
  const [reversalReason,  setReversalReason]  = useState("")
  const [reversalError,   setReversalError]   = useState("")

  // ── Correction modal ────────────────────────────────────────────────────
  const [correcting,    setCorrecting]   = useState<TransactionRow | null>(null)
  const [corrDesc,      setCorrDesc]     = useState("")
  const [corrAmount,    setCorrAmount]   = useState("")
  const [corrNote,      setCorrNote]     = useState("")
  const [corrError,     setCorrError]    = useState("")

  // ── Performance ─────────────────────────────────────────────────────────
  const [perfPeriod,  setPerfPeriod]  = useState<PerformancePeriod>("monthly")
  const [perfData,    setPerfData]    = useState<{ change: number; changePct: number; snapshots: { date: Date; totalValue: number }[] } | null>(null)

  const reload = useCallback(() => {
    if (!session?.email) return
    startTransition(async () => {
      try {
        const [ps, sm] = await Promise.all([getPortfoliosAction(), getAdminSummaryAction()])
        setPortfolios(ps)
        setSummary(sm)
      } catch { setLoadError("Failed to load portfolios.") }
    })
  }, [session?.email])

  useEffect(() => { reload() }, [reload, cpSuccess, txSuccess])

  const handleSelectPortfolio = (id: string) => {
    if (!session?.email) return
    setDetailError(""); setSelected(null); setPerfData(null)
    startTransition(async () => {
      const res = await getPortfolioByIdAction(id, session.email)
      if (res.ok) { setSelected(res.portfolio); setDetailTab("summary") }
      else setDetailError(res.error)
    })
  }

  // Load performance when selected portfolio + period changes
  useEffect(() => {
    if (!selected || !session?.email) return
    startTransition(async () => {
      const res = await getPerformanceReportAction(selected.id, perfPeriod, session.email)
      if (res.ok) setPerfData(res.report)
    })
  }, [selected?.id, perfPeriod, session?.email])

  // Create portfolio
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setCpError(""); setCpSuccess("")
    if (!session?.email) return
    startTransition(async () => {
      const res = await createPortfolioAction({ name: cpName, description: cpDesc || undefined, ownerEmail: cpEmail, adminEmail: session.email })
      if (res.ok) { setCpSuccess(`Portfolio created.`); setCpName(""); setCpDesc(""); setCpEmail(""); setTimeout(() => { setShowCreate(false); setCpSuccess("") }, 2000) }
      else setCpError(res.error ?? "Failed.")
    })
  }

  // Add transaction
  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault()
    setTxError(""); setTxSuccess("")
    if (!selected || !session?.email) return
    const amount = parseFloat(txAmount)
    if (isNaN(amount) || amount <= 0) { setTxError("Amount must be positive."); return }
    startTransition(async () => {
      const res = await addPortfolioTransactionAction({
        portfolioId: selected.id, type: txType, description: txDesc.trim(), amount,
        quantity: txQty ? parseFloat(txQty) : undefined,
        pricePerUnit: txPrice ? parseFloat(txPrice) : undefined,
        symbol: txSymbol.trim() || undefined, userEmail: session.email, isAdminAction: true,
      })
      if (res.ok) {
        setTxSuccess("Transaction added.")
        setTxDesc(""); setTxAmount(""); setTxQty(""); setTxPrice(""); setTxSymbol("")
        handleSelectPortfolio(selected.id)
      } else setTxError(res.error ?? "Failed.")
    })
  }

  // Reversal submit
  const handleReversal = () => {
    if (!reversing || !session?.email) return
    setReversalError("")
    startTransition(async () => {
      const res = await reverseTransactionAction({ transactionId: reversing.id, reason: reversalReason.trim(), adminEmail: session.email })
      if (res.ok) { setReversing(null); setReversalReason(""); handleSelectPortfolio(selected!.id) }
      else setReversalError(res.error ?? "Failed.")
    })
  }

  // Confirm pending tx
  const handleConfirm = (tx: TransactionRow) => {
    if (!session?.email) return
    startTransition(async () => {
      await confirmTransactionAction({ transactionId: tx.id, adminEmail: session.email })
      handleSelectPortfolio(selected!.id)
    })
  }

  // Correction submit
  const handleCorrect = () => {
    if (!correcting || !session?.email) return
    setCorrError("")
    startTransition(async () => {
      const res = await correctTransactionAction({
        transactionId: correcting.id, adminEmail: session.email, adminNote: corrNote.trim(),
        description: corrDesc.trim() || undefined,
        amount: corrAmount ? parseFloat(corrAmount) : undefined,
      })
      if (res.ok) { setCorrecting(null); setCorrDesc(""); setCorrAmount(""); setCorrNote(""); handleSelectPortfolio(selected!.id) }
      else setCorrError(res.error ?? "Failed.")
    })
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AuthGuard requiredRole="admin">
      <PortalHeader title="Portfolio Oversight" icon={<PieChart className="h-5 w-5 text-primary" />} />

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Admin Portal
          </Link>
        </div>

        {/* ── AUM Summary Banner ──────────────────────────────────────────── */}
        {summary && (
          <div className="grid gap-3 sm:grid-cols-4 mb-6">
            {[
              { icon: <DollarSign className="h-4 w-4 text-primary" />, label: "Total AUM",    value: fmtUsd(summary.totalAUM) },
              { icon: <PieChart   className="h-4 w-4 text-primary" />, label: "Portfolios",   value: `${summary.activePortfolios} / ${summary.totalPortfolios} active` },
              { icon: <Clock      className="h-4 w-4 text-warning" />, label: "Pending Txns", value: summary.pendingTxCount.toString(), warn: summary.pendingTxCount > 0 },
              { icon: <Users      className="h-4 w-4 text-primary" />, label: "Under Mgmt",   value: `${summary.totalPortfolios} clients` },
            ].map(({ icon, label, value, warn }) => (
              <GlassCard key={label} hover={false} className="py-4">
                <div className="flex items-center gap-2 mb-1">{icon}<p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p></div>
                <p className={`text-lg font-extrabold ${warn ? "text-warning" : "text-foreground"}`}>{value}</p>
              </GlassCard>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent">Client Portfolios</h1>
            <p className="mt-1 text-sm text-muted">Select a portfolio to manage transactions and review performance</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> New Portfolio
          </button>
        </div>

        {/* ── Create Portfolio Form ─────────────────────────────────────── */}
        {showCreate && (
          <GlassCard className="mb-5">
            <div className="mb-3 flex justify-between items-center">
              <h3 className="font-bold text-foreground">Create Portfolio</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-4 w-4 text-muted hover:text-foreground" /></button>
            </div>
            {cpSuccess ? (
              <p className="rounded-lg bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">{cpSuccess}</p>
            ) : (
              <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Portfolio Name</label>
                  <input required value={cpName} onChange={(e) => setCpName(e.target.value)} placeholder="e.g. Growth Portfolio 2024" className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Client Email</label>
                  <input required type="email" value={cpEmail} onChange={(e) => setCpEmail(e.target.value)} placeholder="client@example.com" className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted">Description (optional)</label>
                  <input value={cpDesc} onChange={(e) => setCpDesc(e.target.value)} placeholder="Investment strategy description" className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary" />
                </div>
                {cpError && <p className="sm:col-span-2 text-xs text-destructive">{cpError}</p>}
                <div className="sm:col-span-2 flex justify-end">
                  <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create
                  </button>
                </div>
              </form>
            )}
          </GlassCard>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* ── Portfolio List ──────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <GlassCard>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                <BarChart2 className="h-4 w-4 text-primary" /> All Portfolios ({portfolios.length})
              </h3>
              {loadError ? (
                <p className="text-sm text-destructive">{loadError}</p>
              ) : isPending && portfolios.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : portfolios.length === 0 ? (
                <p className="text-sm text-muted">No portfolios yet. Create one above.</p>
              ) : (
                <div className="space-y-2">
                  {portfolios.map((p) => (
                    <button
                      key={p.id} onClick={() => handleSelectPortfolio(p.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition-colors hover:border-primary hover:bg-surface ${selected?.id === p.id ? "border-primary bg-surface" : "border-glass-border"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                          <p className="truncate text-xs text-muted">{p.owner.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <StatusBadge label={p.status} variant={statusVariant[p.status] ?? "default"} />
                          <ChevronRight className="h-3.5 w-3.5 text-muted" />
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-xs">
                        <span className="font-bold text-foreground">{fmtUsd(p.valuation.totalValue)}</span>
                        <span className={p.valuation.returnPct >= 0 ? "text-primary" : "text-destructive"}>
                          {fmtPct(p.valuation.returnPct)}
                        </span>
                        <span className="text-muted">{p.holdingCount} holdings</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* ── Portfolio Detail Panel ──────────────────────────────────── */}
          <div className="lg:col-span-3">
            {isPending && !selected ? (
              <GlassCard className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </GlassCard>
            ) : detailError ? (
              <GlassCard><p className="text-sm text-destructive">{detailError}</p></GlassCard>
            ) : selected ? (
              <>
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-foreground">{selected.name}</h2>
                    <p className="text-xs text-muted">{selected.owner.name} · {selected.owner.email}</p>
                  </div>
                  <button onClick={() => setSelected(null)}>
                    <X className="h-4 w-4 text-muted hover:text-foreground" />
                  </button>
                </div>

                {/* Detail sub-tabs */}
                <div className="mb-0 flex flex-wrap gap-1 border-b border-glass-border">
                  {(["summary", "holdings", "transactions", "add", "performance"] as DetailTab[]).map((t) => (
                    <button key={t} onClick={() => setDetailTab(t)}
                      className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                        detailTab === t
                          ? "border border-b-background border-glass-border bg-card text-primary"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                {/* ── Summary ──────────────────────────────────────────── */}
                {detailTab === "summary" && (
                  <GlassCard className="rounded-tl-none mt-0">
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      {[
                        { label: "Total Value",  value: fmtUsd(selected.valuation.totalValue) },
                        { label: "Total Return", value: fmtUsd(selected.valuation.totalReturn), pos: selected.valuation.totalReturn >= 0 },
                        { label: "Return %",     value: fmtPct(selected.valuation.returnPct),    pos: selected.valuation.returnPct >= 0 },
                      ].map(({ label, value, pos }) => (
                        <div key={label} className="rounded-lg bg-surface px-2 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
                          <p className={`mt-0.5 text-sm font-extrabold ${pos === undefined ? "text-foreground" : pos ? "text-primary" : "text-destructive"}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {selected.valuation.pendingDeposits > 0 && (
                      <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
                        <Clock className="h-3.5 w-3.5" /> {fmtUsd(selected.valuation.pendingDeposits)} pending deposit
                      </p>
                    )}
                    {selected.valuation.pendingWithdrawals > 0 && (
                      <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
                        <Clock className="h-3.5 w-3.5" /> {fmtUsd(selected.valuation.pendingWithdrawals)} pending withdrawal
                      </p>
                    )}
                    {/* Top holdings */}
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Top Holdings</h4>
                    <div className="space-y-1">
                      {selected.holdings.slice(0, 5).map((h) => (
                        <div key={h.id} className="flex justify-between rounded-lg px-2 py-2 hover:bg-surface text-sm">
                          <span className="font-medium text-foreground">{h.symbol} <span className="text-xs text-muted">{h.name}</span></span>
                          <span className={`font-bold ${h.returnPct >= 0 ? "text-primary" : "text-destructive"}`}>{fmtPct(h.returnPct)}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* ── Holdings ─────────────────────────────────────────── */}
                {detailTab === "holdings" && (
                  <GlassCard className="rounded-tl-none mt-0 overflow-x-auto">
                    {selected.holdings.length === 0 ? (
                      <p className="text-sm text-muted">No holdings.</p>
                    ) : (
                      <table className="w-full min-w-[480px] text-sm text-left">
                        <thead>
                          <tr className="border-b border-glass-border">
                            {["Symbol","Class","Value","Cost","Return %"].map((h) => (
                              <th key={h} className="pb-2 pr-3 text-xs font-bold uppercase tracking-wider text-primary">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selected.holdings.map((h) => (
                            <tr key={h.id} className="border-b border-border/30 hover:bg-surface">
                              <td className="py-2 pr-3 font-semibold text-foreground">{h.symbol}<p className="text-[11px] text-muted font-normal">{h.name}</p></td>
                              <td className="py-2 pr-3 text-xs text-muted">{h.assetClass.replace("_"," ")}</td>
                              <td className="py-2 pr-3 font-semibold text-foreground">{fmtUsd(h.currentValue)}</td>
                              <td className="py-2 pr-3 text-muted">{fmtUsd(h.costBasis)}</td>
                              <td className={`py-2 font-bold ${h.returnPct >= 0 ? "text-primary" : "text-destructive"}`}>{fmtPct(h.returnPct)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </GlassCard>
                )}

                {/* ── Transactions ─────────────────────────────────────── */}
                {detailTab === "transactions" && (
                  <GlassCard className="rounded-tl-none mt-0">
                    {selected.transactions.length === 0 ? (
                      <p className="text-sm text-muted">No transactions.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selected.transactions.map((tx) => {
                          const isCredit   = isCreditType(tx.type)
                          const isReversed = tx.status === "Reversed"
                          const isPend     = tx.status === "Pending"
                          return (
                            <div key={tx.id} className={`rounded-lg border border-glass-border px-3 py-2.5 ${isReversed ? "opacity-50" : ""}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-foreground">{tx.description}</p>
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5">
                                    {tx.symbol && <span>{tx.symbol} ·</span>}
                                    <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  {tx.adminNote && <p className="text-[11px] text-muted italic mt-0.5">{tx.adminNote}</p>}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <p className={`text-xs font-bold ${isReversed ? "line-through text-muted" : isCredit ? "text-primary" : "text-destructive"}`}>
                                    {isCredit ? "+" : "-"}{fmtUsd(tx.amount)}
                                  </p>
                                  <StatusBadge label={tx.status} variant={txStatusVariant[tx.status] ?? "default"} />
                                </div>
                              </div>
                              {/* Admin action buttons */}
                              {!isReversed && (
                                <div className="mt-1.5 flex gap-2">
                                  {isPend && (
                                    <button
                                      onClick={() => handleConfirm(tx)}
                                      className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/10"
                                    >
                                      <CheckCircle className="h-3 w-3" /> Confirm
                                    </button>
                                  )}
                                  {!isPend && (
                                    <>
                                      <button
                                        onClick={() => { setReversing(tx); setReversalReason(""); setReversalError("") }}
                                        className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/10"
                                      >
                                        <XCircle className="h-3 w-3" /> Reverse
                                      </button>
                                      <button
                                        onClick={() => { setCorrecting(tx); setCorrDesc(tx.description); setCorrAmount(tx.amount.toString()); setCorrNote(""); setCorrError("") }}
                                        className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold text-muted hover:bg-surface"
                                      >
                                        <AlertTriangle className="h-3 w-3" /> Correct
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                              {tx.reversalOfId && (
                                <p className="mt-1 text-[11px] text-muted">Reversal of: {tx.reversalOfId.slice(0, 12)}…</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </GlassCard>
                )}

                {/* ── Add Transaction ───────────────────────────────────── */}
                {detailTab === "add" && (
                  <GlassCard className="rounded-tl-none mt-0">
                    <h3 className="mb-4 font-bold text-foreground">Add Transaction</h3>
                    {txSuccess ? (
                      <div className="rounded-lg bg-primary/10 px-4 py-4 text-center">
                        <CheckCircle className="mx-auto mb-2 h-7 w-7 text-primary" />
                        <p className="text-sm font-bold text-primary">{txSuccess}</p>
                        <button onClick={() => { setTxSuccess(""); setDetailTab("transactions") }} className="mt-2 flex items-center gap-1 mx-auto text-xs text-muted hover:text-primary">
                          <RefreshCw className="h-3 w-3" /> View Transactions
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleAddTx} className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted">Type</label>
                          <select value={txType} onChange={(e) => setTxType(e.target.value)} className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary">
                            {["BUY","SELL","DIVIDEND","DEPOSIT","WITHDRAWAL","FEE","TRANSFER"].map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted">Amount (USD)</label>
                          <input required type="number" min="0.01" step="0.01" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="0.00" className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-muted">Description</label>
                          <input required value={txDesc} onChange={(e) => setTxDesc(e.target.value)} placeholder="Transaction description" className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted">Symbol (optional)</label>
                          <input value={txSymbol} onChange={(e) => setTxSymbol(e.target.value)} placeholder="e.g. AAPL" className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted">Qty (optional)</label>
                          <input type="number" min="0" step="any" value={txQty} onChange={(e) => setTxQty(e.target.value)} placeholder="Units" className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary" />
                        </div>
                        {txError && <p className="sm:col-span-2 text-xs text-destructive">{txError}</p>}
                        <div className="sm:col-span-2 flex justify-end">
                          <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Add Transaction
                          </button>
                        </div>
                      </form>
                    )}
                  </GlassCard>
                )}

                {/* ── Performance ───────────────────────────────────────── */}
                {detailTab === "performance" && (
                  <GlassCard className="rounded-tl-none mt-0">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-bold text-foreground">Performance</h3>
                      <div className="flex gap-1.5">
                        {(["daily","monthly","alltime"] as PerformancePeriod[]).map((p) => (
                          <button key={p} onClick={() => setPerfPeriod(p)}
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${perfPeriod === p ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground" : "border border-glass-border text-muted hover:text-foreground"}`}
                          >
                            {p === "daily" ? "7D" : p === "monthly" ? "30D" : "All"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {perfData ? (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          {perfData.change >= 0
                            ? <TrendingUp className="h-5 w-5 text-primary" />
                            : <TrendingDown className="h-5 w-5 text-destructive" />}
                          <div>
                            <p className={`text-xl font-extrabold ${perfData.change >= 0 ? "text-primary" : "text-destructive"}`}>
                              {fmtUsd(perfData.change)} ({fmtPct(perfData.changePct)})
                            </p>
                            <p className="text-xs text-muted">Period change</p>
                          </div>
                        </div>
                        {perfData.snapshots.length > 0 && (
                          <div className="flex items-end gap-0.5 h-16">
                            {(() => {
                              const vals = perfData.snapshots.map((s) => s.totalValue)
                              const min = Math.min(...vals); const max = Math.max(...vals)
                              const range = max - min || 1
                              return vals.map((v, i) => (
                                <div key={i} title={fmtUsd(v)} className="flex-1 rounded-t bg-gradient-to-t from-primary/60 to-primary"
                                  style={{ height: `${((v - min) / range) * 70 + 30}%` }} />
                              ))
                            })()}
                          </div>
                        )}
                        {perfData.snapshots.length === 0 && (
                          <p className="text-sm text-muted">No snapshot history for this period.</p>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                    )}
                  </GlassCard>
                )}
              </>
            ) : (
              <GlassCard className="flex h-48 flex-col items-center justify-center text-center">
                <PieChart className="mb-2 h-8 w-8 text-muted" />
                <p className="text-sm text-muted">Select a portfolio from the list</p>
              </GlassCard>
            )}
          </div>
        </div>
      </main>

      {/* ── Reversal Modal ─────────────────────────────────────────────────── */}
      {reversing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" /> Reverse Transaction
              </h3>
              <button onClick={() => setReversing(null)}><X className="h-4 w-4 text-muted hover:text-foreground" /></button>
            </div>
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{reversing.description}</p>
              <p className="text-xs text-muted mt-0.5">{reversing.type} · {fmtUsd(reversing.amount)} · {new Date(reversing.createdAt).toLocaleDateString()}</p>
            </div>
            <label className="mb-1 block text-xs font-medium text-muted">Reason for reversal</label>
            <textarea
              rows={3} value={reversalReason} onChange={(e) => setReversalReason(e.target.value)}
              placeholder="Describe the reason for reversal…"
              className="w-full rounded-lg border border-glass-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            {reversalError && <p className="mt-2 text-xs text-destructive">{reversalError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setReversing(null)} className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground">Cancel</button>
              <button onClick={handleReversal} disabled={!reversalReason.trim() || isPending}
                className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground disabled:opacity-60">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirm Reversal
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── Correction Modal ───────────────────────────────────────────────── */}
      {correcting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" /> Correct Transaction
              </h3>
              <button onClick={() => setCorrecting(null)}><X className="h-4 w-4 text-muted hover:text-foreground" /></button>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Description (leave blank to keep)</label>
                <input value={corrDesc} onChange={(e) => setCorrDesc(e.target.value)} className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Amount USD (leave blank to keep)</label>
                <input type="number" min="0.01" step="0.01" value={corrAmount} onChange={(e) => setCorrAmount(e.target.value)} className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Admin note (required)</label>
                <input required value={corrNote} onChange={(e) => setCorrNote(e.target.value)} placeholder="Reason for correction…" className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary" />
              </div>
            </div>
            {corrError && <p className="mt-2 text-xs text-destructive">{corrError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setCorrecting(null)} className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground">Cancel</button>
              <button onClick={handleCorrect} disabled={!corrNote.trim() || isPending}
                className="flex items-center gap-2 rounded-lg bg-warning px-4 py-2 text-sm font-bold text-warning-foreground disabled:opacity-60">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Apply Correction
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </AuthGuard>
  )
}

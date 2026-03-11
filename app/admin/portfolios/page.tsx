"use client"

import { useState, useEffect, useTransition } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatusBadge } from "@/components/status-badge"
import {
  getPortfoliosAction,
  getPortfolioByIdAction,
  createPortfolioAction,
  type PortfolioSummary,
  type PortfolioDetail,
} from "@/lib/actions/portfolio"
import {
  PieChart,
  ArrowLeft,
  Loader2,
  ChevronRight,
  X,
  Plus,
  TrendingUp,
  TrendingDown,
  BarChart2,
} from "lucide-react"
import Link from "next/link"

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}
function fmtPct(n: number) {
  const sign = n >= 0 ? "+" : ""
  return `${sign}${n.toFixed(2)}%`
}

const statusVariant: Record<string, "default" | "success" | "warning" | "critical"> = {
  Active:   "success",
  Inactive: "warning",
  Closed:   "critical",
}

export default function AdminPortfoliosPage() {
  const { session } = useAuth()
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([])
  const [selected, setSelected]   = useState<PortfolioDetail | null>(null)
  const [loadError, setLoadError] = useState("")
  const [detailError, setDetailError] = useState("")
  const [isPending, startTransition] = useTransition()

  // Create-portfolio form state
  const [showCreate, setShowCreate] = useState(false)
  const [cpName, setCpName]             = useState("")
  const [cpDescription, setCpDescription] = useState("")
  const [cpOwnerEmail, setCpOwnerEmail] = useState("")
  const [cpError, setCpError]           = useState("")
  const [cpSuccess, setCpSuccess]       = useState("")

  // Load all portfolios
  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await getPortfoliosAction()
        setPortfolios(data)
      } catch {
        setLoadError("Failed to load portfolios.")
      }
    })
  }, [cpSuccess])

  const handleSelectPortfolio = (id: string) => {
    if (!session?.email) return
    setDetailError("")
    setSelected(null)
    startTransition(async () => {
      try {
        const data = await getPortfolioByIdAction(id, session.email)
        if (!data) setDetailError("Portfolio not found.")
        else setSelected(data)
      } catch {
        setDetailError("Failed to load portfolio details.")
      }
    })
  }

  const handleCreatePortfolio = (e: React.FormEvent) => {
    e.preventDefault()
    setCpError("")
    setCpSuccess("")
    if (!session?.email) return
    startTransition(async () => {
      const res = await createPortfolioAction({
        name: cpName.trim(),
        description: cpDescription.trim() || undefined,
        ownerEmail: cpOwnerEmail.trim(),
        adminEmail: session.email,
      })
      if (res.ok) {
        setCpSuccess(`Portfolio "${cpName}" created.`)
        setCpName(""); setCpDescription(""); setCpOwnerEmail("")
        setTimeout(() => { setShowCreate(false); setCpSuccess("") }, 2000)
      } else {
        setCpError(res.error ?? "Failed to create portfolio.")
      }
    })
  }

  return (
    <AuthGuard requiredRole="admin">
      <PortalHeader
        title="Portfolio Oversight"
        icon={<PieChart className="h-5 w-5 text-primary" />}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Portal
          </Link>
        </div>

        <div className="flex items-start justify-between" style={{ animation: "fadeIn 0.4s ease-out" }}>
          <div>
            <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
              Client Portfolios
            </h1>
            <p className="mt-1 text-sm text-muted">View and manage all client investment portfolios</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            New Portfolio
          </button>
        </div>

        {/* ── Create Portfolio Form ──────────────────────────────────────── */}
        {showCreate && (
          <GlassCard className="mt-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-foreground">Create Portfolio</h3>
              <button onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4 text-muted hover:text-foreground" />
              </button>
            </div>
            {cpSuccess ? (
              <p className="rounded-lg bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">{cpSuccess}</p>
            ) : (
              <form onSubmit={handleCreatePortfolio} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Portfolio Name</label>
                  <input
                    required
                    value={cpName}
                    onChange={(e) => setCpName(e.target.value)}
                    placeholder="e.g. Growth Portfolio 2024"
                    className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Client Email</label>
                  <input
                    required
                    type="email"
                    value={cpOwnerEmail}
                    onChange={(e) => setCpOwnerEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted">Description (optional)</label>
                  <input
                    value={cpDescription}
                    onChange={(e) => setCpDescription(e.target.value)}
                    placeholder="Brief description of investment strategy"
                    className="h-10 w-full rounded-lg border border-glass-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                {cpError && <p className="sm:col-span-2 text-xs text-destructive">{cpError}</p>}
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
                  >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create
                  </button>
                </div>
              </form>
            )}
          </GlassCard>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* ── Portfolio list ─────────────────────────────────────────── */}
          <GlassCard>
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
              <BarChart2 className="h-4 w-4 text-primary" />
              All Portfolios ({portfolios.length})
            </h3>
            {loadError ? (
              <p className="text-sm text-destructive">{loadError}</p>
            ) : isPending && portfolios.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : portfolios.length === 0 ? (
              <p className="text-sm text-muted">No portfolios on file. Create one above.</p>
            ) : (
              <div className="space-y-2">
                {portfolios.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPortfolio(p.id)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors hover:border-primary hover:bg-surface ${selected?.id === p.id ? "border-primary bg-surface" : "border-glass-border"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="text-xs text-muted">{p.owner.name} · {p.owner.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge label={p.status} variant={statusVariant[p.status] ?? "default"} />
                        <ChevronRight className="h-4 w-4 text-muted" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                      <span className="font-semibold text-foreground">{fmtUsd(p.totalValue)}</span>
                      <span>{p.holdingCount} holdings</span>
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>

          {/* ── Portfolio detail ───────────────────────────────────────── */}
          <div>
            {isPending && selected === null && !showCreate ? (
              <GlassCard className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </GlassCard>
            ) : detailError ? (
              <GlassCard>
                <p className="text-sm text-destructive">{detailError}</p>
              </GlassCard>
            ) : selected ? (
              <GlassCard>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{selected.name}</h3>
                    {selected.description && (
                      <p className="mt-0.5 text-xs text-muted">{selected.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      Owner: <span className="font-semibold text-foreground">{selected.owner.name}</span>
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)}>
                    <X className="h-4 w-4 text-muted hover:text-foreground" />
                  </button>
                </div>

                {/* Summary row */}
                <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-surface p-3 text-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Value</p>
                    <p className="mt-0.5 text-base font-extrabold text-foreground">{fmtUsd(selected.totalValue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Return</p>
                    <div className="mt-0.5 flex items-center justify-center gap-0.5">
                      {selected.totalReturn >= 0
                        ? <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                      <p className={`text-base font-extrabold ${selected.totalReturn >= 0 ? "text-primary" : "text-destructive"}`}>
                        {fmtPct(selected.returnPct)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Holdings</p>
                    <p className="mt-0.5 text-base font-extrabold text-foreground">{selected.holdings.length}</p>
                  </div>
                </div>

                {/* Holdings */}
                {selected.holdings.length > 0 && (
                  <>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Holdings</h4>
                    <div className="mb-4 space-y-1.5">
                      {selected.holdings.map((h) => (
                        <div key={h.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{h.symbol}</p>
                            <p className="text-[11px] text-muted">{h.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-foreground">{fmtUsd(h.currentValue)}</p>
                            <p className={`text-[11px] font-semibold ${h.returnPct >= 0 ? "text-primary" : "text-destructive"}`}>
                              {fmtPct(h.returnPct)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Recent transactions */}
                {selected.transactions.length > 0 && (
                  <>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Recent Transactions</h4>
                    <div className="space-y-1">
                      {selected.transactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface">
                          <div>
                            <p className="text-xs font-medium text-foreground">{tx.description}</p>
                            <p className="text-[11px] text-muted">{new Date(tx.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-foreground">{fmtUsd(tx.amount)}</p>
                            <StatusBadge label={tx.type} variant="default" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </GlassCard>
            ) : (
              <GlassCard className="flex h-48 flex-col items-center justify-center text-center">
                <PieChart className="mb-2 h-8 w-8 text-muted" />
                <p className="text-sm text-muted">Select a portfolio to view details</p>
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}

"use client"

import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { transactions } from "@/lib/data"
import { Briefcase, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function ClientPage() {
  const { session } = useAuth()

  return (
    <AuthGuard requiredRole="client">
      <PortalHeader
        title="Client Portal"
        icon={<Briefcase className="h-5 w-5 text-primary" />}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Welcome Back, {session?.name || "Client"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Personal Portfolio & Trading Access
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Portfolio Summary */}
          <GlassCard>
            <h3 className="mb-4 text-base font-bold text-foreground">Portfolio Summary</h3>
            <div className="rounded-xl border border-glass-border bg-gradient-to-br from-primary/10 to-secondary/10 p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Total Balance</p>
              <p className="mt-2 text-4xl font-extrabold text-primary md:text-5xl">$100,000.00</p>
              <div className="mt-2 flex items-center justify-center gap-1 text-sm font-bold text-primary">
                <ArrowUpRight className="h-4 w-4" />
                +2.45% (Past 24h)
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="flex-1 rounded-lg bg-gradient-to-r from-primary to-secondary py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]">
                Deposit
              </button>
              <button className="flex-1 rounded-lg border border-glass-border py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10">
                Withdraw
              </button>
            </div>
          </GlassCard>

          {/* Virtual Trading */}
          <GlassCard>
            <h3 className="mb-4 text-base font-bold text-foreground">Virtual Trading</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Select Asset</label>
                <select className="h-11 w-full rounded-lg border border-glass-border bg-input px-3 text-base text-foreground outline-none focus:border-primary">
                  <option>GEM Digital Asset (GDA)</option>
                  <option>ATR Real Estate Token (RET)</option>
                  <option>Global Equity Index</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">{"Amount ($)"}</label>
                <input
                  type="number"
                  defaultValue={1000}
                  className="h-11 w-full rounded-lg border border-glass-border bg-input px-3 text-base text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3">
                <button className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]">
                  BUY
                </button>
                <button className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-bold text-destructive-foreground transition-transform hover:scale-[1.02]">
                  SELL
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Recent Transactions */}
        <GlassCard className="mt-4">
          <h3 className="mb-4 text-base font-bold text-foreground">Recent Transactions</h3>
          <div className="space-y-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-surface"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tx.positive ? "bg-primary/10" : "bg-destructive/10"}`}>
                    {tx.positive ? (
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">{tx.label}</span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.positive ? "text-primary" : "text-destructive"}`}>
                    {tx.amount}
                  </p>
                  <p className="text-[11px] text-muted">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </AuthGuard>
  )
}

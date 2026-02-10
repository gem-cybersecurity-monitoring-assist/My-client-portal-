"use client"

import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatCard } from "@/components/stat-card"
import { aiAgents, aiLogs } from "@/lib/data"
import { Bot } from "lucide-react"

const colorMap = {
  primary: { bar: "bg-primary", text: "text-primary" },
  secondary: { bar: "bg-secondary", text: "text-secondary" },
  warning: { bar: "bg-warning", text: "text-warning" },
} as const

export default function EnterpriseAIPage() {
  return (
    <AuthGuard>
      <PortalHeader
        title="AI Operations"
        icon={<Bot className="h-5 w-5 text-primary" />}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Enterprise AI Platform
          </h1>
          <p className="mt-1 text-sm text-muted">
            Autonomous Agent Fleet & Real-time Analytics Dashboard
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard value={14} label="Active Agents" />
          <StatCard value="2.4M" label="Tasks Processed" />
          <StatCard value="99.8%" label="Accuracy" />
        </div>

        {/* Autonomous Agents */}
        <h2 className="mt-8 border-b-2 border-glass-border pb-2 text-lg font-bold text-foreground md:text-xl">
          Autonomous Agents
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {aiAgents.map((agent) => {
            const colors = colorMap[agent.color]
            return (
              <GlassCard key={agent.name} className="border-t-[3px] border-t-secondary">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">{agent.name}</h3>
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"
                    style={{ animation: "pulse-glow 2s infinite" }}
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{agent.description}</p>
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted">
                    <span>{agent.metric}</span>
                    <span>{agent.value}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-border/50">
                    <div
                      className={`h-full rounded-full ${colors.bar}`}
                      style={{ width: `${agent.value}%` }}
                    />
                  </div>
                </div>
                <button className="mt-4 h-9 w-full rounded-lg border border-glass-border text-xs font-bold text-primary transition-colors hover:bg-primary/10">
                  Configure
                </button>
              </GlassCard>
            )
          })}
        </div>

        {/* Task Execution Log */}
        <GlassCard className="mt-6">
          <h3 className="mb-4 text-base font-bold text-foreground">Global Task Execution Log</h3>
          <div className="space-y-2 font-mono text-sm">
            {aiLogs.map((log, i) => {
              const colors = colorMap[log.color]
              return (
                <div key={i} className="flex flex-col gap-0.5 md:flex-row md:items-center md:gap-2">
                  <span className="text-xs text-muted">[{log.time}]</span>
                  <span className={`text-xs font-semibold ${colors.text}`}>{log.agent}</span>
                  <span className="text-xs text-foreground">{log.action}</span>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </main>
    </AuthGuard>
  )
}

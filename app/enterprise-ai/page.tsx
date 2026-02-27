"use client"

import { memo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatCard } from "@/components/stat-card"
import { aiAgents, aiLogs } from "@/lib/data"
import { Bot } from "lucide-react"

// ⚡ Bolt Optimization: Move static icon out of render function.
const AI_ICON = <Bot className="h-5 w-5 text-primary" />

const colorMap = {
  primary: { bar: "bg-primary", text: "text-primary" },
  secondary: { bar: "bg-secondary", text: "text-secondary" },
  warning: { bar: "bg-warning", text: "text-warning" },
} as const

/**
 * ⚡ Bolt Optimization: Memoize individual AI Agent cards.
 * Uses GPU-accelerated pulse animation utility for better performance.
 */
const AIAgentCard = memo(function AIAgentCard({ agent }: { agent: (typeof aiAgents)[0] }) {
  const colors = colorMap[agent.color]
  return (
    <GlassCard className="border-t-[3px] border-t-secondary">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">{agent.name}</h3>
        <span
          className="gpu-pulse inline-block h-2.5 w-2.5 rounded-full bg-primary"
          aria-hidden="true"
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
})

/**
 * ⚡ Bolt Optimization: Memoize individual AI Log items.
 * Prevents redundant renders during list updates.
 */
const AILogItem = memo(function AILogItem({ log }: { log: (typeof aiLogs)[0] }) {
  const colors = colorMap[log.color]
  return (
    <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:gap-2">
      <span className="text-xs text-muted">[{log.time}]</span>
      <span className={`text-xs font-semibold ${colors.text}`}>{log.agent}</span>
      <span className="text-xs text-foreground">{log.action}</span>
    </div>
  )
})

export default function EnterpriseAIPage() {
  return (
    <AuthGuard>
      <PortalHeader
        title="AI Operations"
        icon={AI_ICON}
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
          {aiAgents.map((agent) => (
            <AIAgentCard key={agent.name} agent={agent} />
          ))}
        </div>

        {/* Task Execution Log */}
        <GlassCard className="mt-6">
          <h3 className="mb-4 text-base font-bold text-foreground">Global Task Execution Log</h3>
          <div className="space-y-2 font-mono text-sm">
            {aiLogs.map((log) => (
              <AILogItem
                key={`${log.time}-${log.agent}-${log.action.substring(0, 10)}`}
                log={log}
              />
            ))}
          </div>
        </GlassCard>
      </main>
    </AuthGuard>
  )
}

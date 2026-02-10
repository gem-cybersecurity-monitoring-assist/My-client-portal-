"use client"

import { useState, useRef, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatCard } from "@/components/stat-card"
import { teams } from "@/lib/data"
import { Users, Send } from "lucide-react"

type TerminalLine = { text: string; isResponse?: boolean }

export default function TeamPage() {
  const [filter, setFilter] = useState<"ALL" | "GEM" | "Alliance">("ALL")
  const [command, setCommand] = useState("")
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { text: "> AI Overseer Initializing..." },
    { text: "> System status: OPTIMAL" },
    { text: "> Monitoring active agents..." },
  ])
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalLines])

  const filtered = filter === "ALL" ? teams : teams.filter((m) => m.team === filter)

  const sendCommand = () => {
    if (!command.trim()) return
    setTerminalLines((prev) => [
      ...prev,
      { text: `> ${command}` },
      { text: `[AI] Executing: ${command}... Done.`, isResponse: true },
    ])
    setCommand("")
  }

  const filterBtns: Array<"ALL" | "GEM" | "Alliance"> = ["ALL", "GEM", "Alliance"]

  return (
    <AuthGuard requiredRole="team">
      <PortalHeader
        title="Team Portal"
        icon={<Users className="h-5 w-5 text-primary" />}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Team Workspace
          </h1>
          <p className="mt-1 text-sm text-muted">
            Collaborative Directory & AI Operations Oversight
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {/* Terminal */}
          <GlassCard className="md:col-span-2">
            <h3 className="mb-3 text-base font-bold text-foreground">AI Overseer Terminal</h3>
            <div
              ref={terminalRef}
              className="h-52 overflow-y-auto rounded-lg border border-border/50 bg-[#000] p-3 font-mono text-sm md:h-64"
            >
              {terminalLines.map((line, i) => (
                <div key={i} className={line.isResponse ? "text-secondary" : "text-primary"}>
                  {line.text}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendCommand()}
                placeholder="Enter command..."
                className="h-11 flex-1 rounded-lg border border-glass-border bg-input px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
              <button
                onClick={sendCommand}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </GlassCard>

          {/* Quick Metrics */}
          <GlassCard>
            <h3 className="mb-4 text-base font-bold text-foreground">Quick Metrics</h3>
            <div className="space-y-3">
              <StatCard value="94%" label="Project Completion" />
              <StatCard value={47} label="Team Members" />
            </div>
          </GlassCard>
        </div>

        {/* Personnel Directory */}
        <GlassCard className="mt-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-base font-bold text-foreground">Personnel Directory</h3>
            <div className="flex gap-2">
              {filterBtns.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "border border-glass-border text-primary hover:bg-primary/10"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border-l-4 border-l-primary bg-surface p-3.5"
              >
                <div className="text-sm font-bold text-primary">{m.name}</div>
                <div className="mt-0.5 text-xs text-muted">{m.role}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                  <span>{m.team}</span>
                  <span>Clearance: {m.clearance}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </AuthGuard>
  )
}

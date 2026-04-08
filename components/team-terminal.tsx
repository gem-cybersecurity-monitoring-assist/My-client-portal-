"use client"

import { useState, useRef, useEffect, memo } from "react"
import { GlassCard } from "./glass-card"
import { Send } from "lucide-react"

type TerminalLine = { text: string; isResponse?: boolean }

// ⚡ Bolt Optimization: Move static icon out of render function for stable references.
const SEND_ICON = <Send className="h-4 w-4" />

/**
 * ⚡ Bolt Optimization: Memoize individual terminal lines.
 * This prevents old log lines from re-rendering when typing in the command input.
 */
const TerminalLineItem = memo(function TerminalLineItem({ line }: { line: TerminalLine }) {
  return (
    <div className={line.isResponse ? "text-secondary" : "text-primary"}>
      {line.text}
    </div>
  )
})

/**
 * ⚡ Bolt Optimization: Memoize the entire terminal history list.
 * This decouples the high-frequency 'command' state (typing) from the
 * potentially large list of terminal lines. During every keystroke,
 * React will skip the reconciliation of the entire history list.
 */
const TerminalHistory = memo(function TerminalHistory({ lines }: { lines: TerminalLine[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <TerminalLineItem key={i} line={line} />
      ))}
    </>
  )
})

// ⚡ Bolt Optimization: Localize terminal state and wrap in memo.
// This prevents typing in the terminal from re-rendering the entire TeamPage,
// and prevents TeamPage filter changes from re-rendering the terminal.
// Impact: Improves typing responsiveness and reduces unnecessary re-renders.
export const TeamTerminal = memo(function TeamTerminal() {
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

  const sendCommand = () => {
    if (!command.trim()) return
    setTerminalLines((prev) => [
      ...prev,
      { text: `> ${command}` },
      { text: `[AI] Executing: ${command}... Done.`, isResponse: true },
    ])
    setCommand("")
  }

  return (
    <GlassCard className="md:col-span-2">
      <h3 className="mb-3 text-base font-bold text-foreground">AI Overseer Terminal</h3>
      <div
        ref={terminalRef}
        className="h-52 overflow-y-auto rounded-lg border border-border/50 bg-[#000] p-3 font-mono text-sm md:h-64"
      >
        <TerminalHistory lines={terminalLines} />
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
          {SEND_ICON}
        </button>
      </div>
    </GlassCard>
  )
})

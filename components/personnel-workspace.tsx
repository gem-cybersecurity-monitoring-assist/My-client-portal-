"use client"

import { useState, useMemo, memo } from "react"
import { GlassCard } from "./glass-card"
import { PersonnelDirectory } from "./personnel-directory"
import { teams } from "@/lib/data"

const FILTER_BTNS: Array<"ALL" | "GEM" | "Alliance"> = ["ALL", "GEM", "Alliance"]

/**
 * ⚡ Bolt Optimization: PersonnelWorkspace Component
 *
 * This component colocates the 'filter' state and filtering logic for the personnel directory.
 * By pushing this state down from the parent TeamPage, we ensure that:
 * 1. High-frequency updates in sibling components (like the TeamTerminal) do not
 *    trigger re-renders or re-calculations of the personnel list.
 * 2. Filter changes only re-render this specific component, not the entire page.
 *
 * Impact: Improves overall page responsiveness and reduces redundant O(n) filtering.
 */
export const PersonnelWorkspace = memo(function PersonnelWorkspace() {
  const [filter, setFilter] = useState<"ALL" | "GEM" | "Alliance">("ALL")

  // ⚡ Bolt Optimization: Memoize filtered list to prevent unnecessary re-calculations.
  const filtered = useMemo(() => {
    return filter === "ALL" ? teams : teams.filter((m) => m.team === filter)
  }, [filter])

  return (
    <GlassCard className="mt-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-base font-bold text-foreground">Personnel Directory</h3>
        <div className="flex gap-2">
          {FILTER_BTNS.map((f) => (
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
      <PersonnelDirectory members={filtered} />
    </GlassCard>
  )
})

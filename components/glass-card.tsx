"use client"

import { cn } from "@/lib/utils"
import { type ReactNode } from "react"

/**
 * ⚡ Bolt Optimization: GlassCard
 *
 * This component utilizes targeted transitions for 'transform', 'border-color', and
 * 'box-shadow' to optimize browser style recalculations and reduce GPU overhead.
 *
 * ⚡ Bolt Optimization (Latest): Removed React.memo
 * Intentionally omitted React.memo as this is a foundational wrapper component
 * that primarily receives dynamic 'children'. Shallow comparison on inline JSX
 * props is inefficient and rarely results in skipped renders.
 */
export function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-glass-border bg-card p-5 backdrop-blur-xl transition-[transform,border-color] duration-300",
        hover && "hover:-translate-y-1 hover:border-primary",
        className
      )}
    >
      {/* ⚡ Bolt Optimization: Use a pseudo-element for hover shadow to leverage GPU composition.
          Animating opacity is significantly cheaper than animating box-shadow directly. */}
      {hover && (
        <div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 shadow-[0_12px_40px_var(--color-glass-shadow)] transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

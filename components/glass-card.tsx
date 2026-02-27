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
        "rounded-xl border border-glass-border bg-card p-5 backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300",
        hover && "hover:-translate-y-1 hover:border-primary hover:shadow-[0_12px_40px_var(--color-glass-shadow)]",
        className
      )}
    >
      {children}
    </div>
  )
}

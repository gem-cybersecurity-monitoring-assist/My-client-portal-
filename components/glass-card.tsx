"use client"

import { cn } from "@/lib/utils"
import { memo, type ReactNode } from "react"

/**
 * ⚡ Bolt Optimization: GlassCard
 *
 * 1. Wrapped in React.memo to prevent unnecessary re-renders when parent state changes
 *    but props remain stable.
 * 2. Replaced 'transition-all' with targeted transitions for 'transform', 'border-color',
 *    and 'box-shadow' to optimize browser style recalculations and reduce GPU overhead.
 */
export const GlassCard = memo(function GlassCard({
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
})

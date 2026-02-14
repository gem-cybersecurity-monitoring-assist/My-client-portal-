"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

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
        "rounded-xl border border-glass-border bg-card p-5 transition-colors duration-200",
        hover && "hover:border-primary hover:shadow-[0_8px_24px_var(--color-glass-shadow)]",
        className
      )}
    >
      {children}
    </div>
  )
}

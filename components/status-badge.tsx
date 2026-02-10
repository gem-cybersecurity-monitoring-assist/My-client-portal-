import { cn } from "@/lib/utils"

const variants = {
  healthy: "bg-primary/20 text-primary",
  warning: "bg-warning/20 text-warning",
  critical: "bg-destructive/20 text-destructive",
  default: "bg-primary/20 text-primary",
  info: "bg-secondary/20 text-secondary",
  success: "bg-primary/20 text-primary",
} as const

export function StatusBadge({
  label,
  variant = "default",
}: {
  label: string
  variant?: keyof typeof variants
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
        variants[variant]
      )}
    >
      {label}
    </span>
  )
}

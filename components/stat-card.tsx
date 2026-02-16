import { memo } from "react"

export const StatCard = memo(function StatCard({
  value,
  label,
}: {
  value: string | number
  label: string
}) {
  return (
    <div className="rounded-xl bg-surface p-4 text-center">
      <div className="text-3xl font-extrabold text-primary">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  )
})

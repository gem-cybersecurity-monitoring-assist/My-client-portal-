import { memo } from "react"
import type { TeamMember } from "@/lib/data"

// ⚡ Bolt Optimization: Memoize individual personnel cards.
// This prevents each card from re-rendering if its data hasn't changed.
export const PersonnelCard = memo(function PersonnelCard({ member }: { member: TeamMember }) {
  return (
    <div className="rounded-lg border-l-4 border-l-primary bg-surface p-3.5">
      <div className="text-sm font-bold text-primary">{member.name}</div>
      <div className="mt-0.5 text-xs text-muted">{member.role}</div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
        <span>{member.team}</span>
        <span>Clearance: {member.clearance}</span>
      </div>
    </div>
  )
})

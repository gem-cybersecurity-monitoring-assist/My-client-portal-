import { memo } from "react"
import { PersonnelCard } from "./personnel-card"
import type { TeamMember } from "@/lib/data"

// ⚡ Bolt Optimization: Memoize the entire directory grid.
// This ensures the grid only re-renders when the filtered list actually changes,
// preventing it from re-rendering when the user types in the terminal.
export const PersonnelDirectory = memo(function PersonnelDirectory({
  members,
}: {
  members: TeamMember[]
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => (
        <PersonnelCard key={m.id} member={m} />
      ))}
    </div>
  )
})

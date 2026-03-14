"use client"

import { useState, useMemo, memo } from "react"
import { teams, type TeamMember } from "@/lib/data"
import { Search } from "lucide-react"
import { StatusBadge } from "./status-badge"

// ⚡ Bolt Optimization: Hoist static icons to constants for stable references.
const SEARCH_ICON = <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

/**
 * ⚡ Bolt Optimization: Memoize individual user lookup items.
 * Prevents unnecessary re-renders of list items that haven't changed during search updates.
 */
const UserLookupItem = memo(function UserLookupItem({ user }: { user: TeamMember }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-surface"
    >
      <span className="text-sm font-medium text-foreground">{user.name}</span>
      <StatusBadge label={user.role} variant="default" />
    </div>
  )
})

/**
 * ⚡ Bolt Optimization: UserLookup Component
 *
 * Pushes high-frequency 'search' state down from the parent AdminPage.
 * This prevents every keystroke from re-rendering the entire page, including
 * expensive sibling components like the 'Managed Portfolios' card.
 */
export const UserLookup = memo(function UserLookup() {
  const [search, setSearch] = useState("")

  // ⚡ Bolt Optimization: Memoize filtered list to prevent unnecessary re-calculations.
  // Pre-calculate search term outside the filter loop for better performance.
  const filteredTeams = useMemo(() => {
    const term = search.toLowerCase()
    return teams.filter((u) =>
      u.name.toLowerCase().includes(term)
    )
  }, [search])

  return (
    <div className="flex flex-col h-full">
      <h3 className="mb-4 text-base font-bold text-foreground">Quick User Lookup</h3>
      <div className="relative mb-4">
        {SEARCH_ICON}
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-lg border border-glass-border bg-input pl-10 pr-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
      </div>
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {filteredTeams.slice(0, 8).map((u) => (
          <UserLookupItem key={u.id} user={u} />
        ))}
        {filteredTeams.length === 0 && (
          <p className="py-4 text-center text-xs text-muted">No users found.</p>
        )}
      </div>
    </div>
  )
})

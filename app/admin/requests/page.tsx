"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatusBadge } from "@/components/status-badge"
import { serviceRequests, type ServiceRequest } from "@/lib/data"
import { ClipboardList, ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

const statusVariant: Record<string, "default" | "success" | "warning" | "critical" | "info"> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "critical",
  "In Review": "info",
}

const priorityVariant: Record<string, "default" | "success" | "warning" | "critical"> = {
  Low: "default",
  Medium: "warning",
  High: "critical",
}

export default function AdminRequestsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<ServiceRequest["status"] | "All">("All")

  const filtered = serviceRequests.filter((r) => {
    const matchesSearch =
      r.client.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "All" || r.status === filter
    return matchesSearch && matchesFilter
  })

  const counts = {
    All: serviceRequests.length,
    Pending: serviceRequests.filter((r) => r.status === "Pending").length,
    "In Review": serviceRequests.filter((r) => r.status === "In Review").length,
    Approved: serviceRequests.filter((r) => r.status === "Approved").length,
    Rejected: serviceRequests.filter((r) => r.status === "Rejected").length,
  }

  return (
    <AuthGuard requiredRole="admin">
      <PortalHeader
        title="Request Management"
        icon={<ClipboardList className="h-5 w-5 text-primary" />}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Portal
          </Link>
        </div>

        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Service Requests
          </h1>
          <p className="mt-1 text-sm text-muted">Review and action all platform requests</p>
        </div>

        {/* Status filter tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(["All", "Pending", "In Review", "Approved", "Rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                filter === s
                  ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  : "border border-glass-border text-muted hover:text-primary"
              }`}
            >
              {s} ({counts[s]})
            </button>
          ))}
        </div>

        <GlassCard className="mt-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by client, request ID, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-glass-border bg-input pl-10 pr-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">ID</th>
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">Client</th>
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">Type</th>
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">Subject</th>
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">Priority</th>
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-primary">Status</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-wider text-primary">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted">
                      No requests match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((req) => (
                    <tr key={req.id} className="border-b border-border/50 hover:bg-surface/50">
                      <td className="py-3 pr-4 font-mono text-xs text-muted">{req.id}</td>
                      <td className="py-3 pr-4 font-medium text-foreground">{req.client}</td>
                      <td className="py-3 pr-4 text-muted">{req.type}</td>
                      <td className="max-w-[200px] py-3 pr-4 truncate text-foreground">{req.subject}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge label={req.priority} variant={priorityVariant[req.priority]} />
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge label={req.status} variant={statusVariant[req.status] ?? "default"} />
                      </td>
                      <td className="py-3 text-muted">{req.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>
    </AuthGuard>
  )
}

"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatusBadge } from "@/components/status-badge"
import { serviceRequests } from "@/lib/data"
import { FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"

const statusVariant: Record<string, "default" | "success" | "warning" | "critical" | "info"> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "critical",
  "In Review": "info",
}

const requestTypes = ["Withdrawal", "Deposit", "Support", "Account Change"] as const

export default function ClientRequestsPage() {
  const { session } = useAuth()
  const [type, setType] = useState<typeof requestTypes[number]>("Support")
  const [subject, setSubject] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const myRequests = serviceRequests.filter((r) => r.email === session?.email)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) return
    setSubmitted(true)
    setSubject("")
  }

  return (
    <AuthGuard requiredRole="client">
      <PortalHeader
        title="My Requests"
        icon={<FileText className="h-5 w-5 text-primary" />}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/client"
            className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Client Portal
          </Link>
        </div>

        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Service Requests
          </h1>
          <p className="mt-1 text-sm text-muted">Submit and track your platform requests</p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Submit new request */}
          <GlassCard>
            <h3 className="mb-4 text-base font-bold text-foreground">New Request</h3>
            {submitted ? (
              <div className="rounded-lg bg-primary/10 px-4 py-6 text-center">
                <p className="font-bold text-primary">Request submitted successfully!</p>
                <p className="mt-1 text-sm text-muted">Our team will review it shortly.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 rounded-lg bg-gradient-to-r from-primary to-secondary px-5 py-2 text-sm font-bold text-primary-foreground"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Request Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as typeof requestTypes[number])}
                    className="h-11 w-full rounded-lg border border-glass-border bg-input px-3 text-base text-foreground outline-none focus:border-primary"
                  >
                    {requestTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Subject</label>
                  <textarea
                    required
                    rows={4}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Describe your request..."
                    className="w-full rounded-lg border border-glass-border bg-input px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-gradient-to-r from-primary to-secondary text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  Submit Request
                </button>
              </form>
            )}
          </GlassCard>

          {/* My request history */}
          <GlassCard>
            <h3 className="mb-4 text-base font-bold text-foreground">My Requests</h3>
            {myRequests.length === 0 ? (
              <p className="text-sm text-muted">No requests on file.</p>
            ) : (
              <div className="space-y-2">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-lg border border-border/50 px-3 py-3 transition-colors hover:bg-surface"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{req.subject}</span>
                      <StatusBadge
                        label={req.status}
                        variant={statusVariant[req.status] ?? "default"}
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                      <span>{req.id}</span>
                      <span>·</span>
                      <span>{req.type}</span>
                      <span>·</span>
                      <span>{req.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </main>
    </AuthGuard>
  )
}

"use client"

import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { PortalHeader } from "@/components/portal-header"
import { GlassCard } from "@/components/glass-card"
import { StatCard } from "@/components/stat-card"
import Link from "next/link"
import {
  LayoutDashboard,
  Crown,
  Settings,
  Users,
  Briefcase,
  Bot,
  Shield,
} from "lucide-react"

const portals = [
  {
    title: "SuperAdmin Dashboard",
    description: "Tenant management, system logs, infrastructure monitoring",
    badge: "PLATFORM CONTROL",
    href: "/superadmin",
    icon: Crown,
  },
  {
    title: "Admin Dashboard",
    description: "User management, RBAC, audit logs, portfolio oversight",
    badge: "ORGANIZATION",
    href: "/admin",
    icon: Settings,
  },
  {
    title: "Team Workspace",
    description: "Personnel directory, architecture diagrams, AI Overseer terminal",
    badge: "COLLABORATION",
    href: "/team",
    icon: Users,
  },
  {
    title: "Client Dashboard",
    description: "Demo portfolio ($100K), transaction history, account settings",
    badge: "PORTFOLIO ACCESS",
    href: "/client",
    icon: Briefcase,
  },
  {
    title: "Enterprise AI Platform",
    description: "Autonomous agents, client management, marketing campaigns, analytics",
    badge: "AI POWERED",
    href: "/enterprise-ai",
    icon: Bot,
  },
]

export default function DashboardPage() {
  const { session } = useAuth()

  return (
    <AuthGuard>
      <PortalHeader title="GEM & ATR Platform" icon={<LayoutDashboard className="h-5 w-5 text-primary" />} />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-4xl">
            GEM & ATR Platform
          </h1>
          <p className="mt-1 text-sm text-muted md:text-base">
            Welcome back, {session?.name || "Guest"}. Select a portal to continue.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard value={7} label="Core Pages" />
          <StatCard value={6} label="Portals" />
          <StatCard value={4} label="User Roles" />
          <StatCard value="100%" label="Functional" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {portals.map((portal, i) => (
            <GlassCard key={portal.href} className="flex flex-col">
              <div style={{ animation: `fadeIn ${0.3 + i * 0.08}s ease-out` }}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <portal.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {portal.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">{portal.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{portal.description}</p>
                <Link
                  href={portal.href}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary px-5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {"Access Portal"}
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard hover={false} className="mt-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-primary">Platform Ready</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Your complete enterprise platform is built and operational.
            Start with any portal above or explore the full platform.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary px-8 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Launch Platform
          </Link>
        </GlassCard>

        <footer className="mt-12 border-t border-glass-border py-6 text-center">
          <p className="text-sm text-muted">2026 GEM & ATR Digital Command Center</p>
          <p className="mt-1 text-xs text-muted-foreground">Enterprise-Grade Multi-Tenant SaaS Platform</p>
        </footer>
      </main>
    </AuthGuard>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { GlassCard } from "@/components/glass-card"
import { Shield, Crown, Settings, Users, Briefcase, Loader2 } from "lucide-react"

const quickAccess = [
  { label: "SuperAdmin", email: "superadmin@gem.com", pass: "super123", icon: Crown, route: "/superadmin" },
  { label: "Admin", email: "admin@gem.com", pass: "admin123", icon: Settings, route: "/admin" },
  { label: "Team", email: "team@gem.com", pass: "team123", icon: Users, route: "/team" },
  { label: "Client", email: "client@gem.com", pass: "client123", icon: Briefcase, route: "/client" },
]

export default function Home() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, isLoading, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && session) {
      const route = session.role === "superadmin" ? "/superadmin"
        : session.role === "admin" ? "/admin"
        : session.role === "team" ? "/team"
        : session.role === "client" ? "/client"
        : "/dashboard"
      router.replace(route)
    }
  }, [isLoading, isAuthenticated, session, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const success = login(email, password)
    if (success) {
      router.replace("/dashboard")
    } else {
      setError("Invalid credentials. Try one of the quick access options below.")
      setLoading(false)
    }
  }

  const handleQuickAccess = (item: (typeof quickAccess)[0]) => {
    setLoading(true)
    const success = login(item.email, item.pass)
    if (success) {
      router.replace(item.route)
    } else {
      setLoading(false)
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md" style={{ animation: "fadeIn 0.5s ease-out" }}>
        <GlassCard hover={false} className="p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
              GEM & ATR
            </h1>
            <p className="mt-1.5 text-sm text-muted">Secure Authentication Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm text-muted">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-lg border border-glass-border bg-input px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm text-muted">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-lg border border-glass-border bg-input px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-glass-border" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Quick Access</span>
            <div className="h-px flex-1 bg-glass-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickAccess.map((item) => (
              <button
                key={item.label}
                onClick={() => handleQuickAccess(item)}
                disabled={loading}
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-glass-border bg-transparent text-sm font-semibold text-primary transition-all hover:bg-primary/10 disabled:opacity-60"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

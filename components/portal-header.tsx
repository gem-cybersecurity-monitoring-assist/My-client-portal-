"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { LogOut, LayoutDashboard } from "lucide-react"

export function PortalHeader({
  title,
  icon,
}: {
  title: string
  icon: React.ReactNode
}) {
  const { session, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-glass-border bg-background/80 px-4 py-3 backdrop-blur-lg sm:px-6">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-xl flex-shrink-0">{icon}</span>
        <span className="text-base font-bold text-foreground truncate">{title}</span>
      </div>
      <nav className="flex items-center gap-2 sm:gap-5 flex-shrink-0">
        {session && (
          <span className="hidden text-sm text-muted sm:inline">
            {session.name}
          </span>
        )}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 p-2 text-sm text-muted transition-colors hover:text-primary rounded-lg hover:bg-primary/10"
          title="Dashboard"
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 p-2 text-sm text-muted transition-colors hover:text-destructive rounded-lg hover:bg-destructive/10"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </nav>
    </header>
  )
}

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
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-glass-border bg-background/95 px-4 py-3 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{icon}</span>
        <span className="text-base font-bold text-foreground">{title}</span>
      </div>
      <nav className="flex items-center gap-3 md:gap-5">
        {session && (
          <span className="hidden text-sm text-muted md:inline">
            {session.name}
          </span>
        )}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden md:inline">Dashboard</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </nav>
    </header>
  )
}

"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import type { UserRole } from "@/lib/data"

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole?: UserRole
}) {
  const { session, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (isLoading || hasRedirected.current) return
    if (!isAuthenticated) {
      hasRedirected.current = true
      router.replace("/")
      return
    }
    if (requiredRole && session?.role !== requiredRole && session?.role !== "superadmin") {
      hasRedirected.current = true
      router.replace("/dashboard")
    }
  }, [isLoading, isAuthenticated, session, requiredRole, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (requiredRole && session?.role !== requiredRole && session?.role !== "superadmin") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}

"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
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

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    if (requiredRole && session?.role !== requiredRole && session?.role !== "superadmin") {
      router.replace("/dashboard")
    }
  }, [isLoading, isAuthenticated, session, requiredRole, router])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (requiredRole && session?.role !== requiredRole && session?.role !== "superadmin") return null

  return <>{children}</>
}

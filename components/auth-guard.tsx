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
  const { session, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/")
      return
    }
    if (requiredRole && session?.role !== requiredRole && session?.role !== "superadmin") {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, session, requiredRole, router])

  if (!isAuthenticated) {
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

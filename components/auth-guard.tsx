"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import type { UserRole } from "@/lib/data"

// ⚡ Bolt Optimization: Hoist static loader icon to module-level constant.
// This ensures a stable element reference during the loading state.
const LOADER_ICON = (
  <div className="flex min-h-dvh items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)

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
      router.replace("/")
      return
    }
    if (requiredRole && session?.role !== requiredRole && session?.role !== "superadmin") {
      router.replace("/dashboard")
    }
  }, [isLoading, isAuthenticated, session, requiredRole, router])

  if (isLoading) {
    return LOADER_ICON
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

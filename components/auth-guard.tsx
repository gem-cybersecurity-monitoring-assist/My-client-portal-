"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
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
      router.push("/login")
      return
    }
    if (requiredRole && session?.role !== requiredRole && session?.role !== "superadmin") {
      router.push("/dashboard")
    }
  }, [isAuthenticated, session, requiredRole, router])

  if (!isAuthenticated) return null
  if (requiredRole && session?.role !== requiredRole && session?.role !== "superadmin") return null

  return <>{children}</>
}

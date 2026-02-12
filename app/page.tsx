"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  console.log("[v0] Home render: isLoading =", isLoading, "isAuthenticated =", isAuthenticated)

  useEffect(() => {
    console.log("[v0] Home useEffect: isLoading =", isLoading, "isAuthenticated =", isAuthenticated)
    if (isLoading) return
    if (isAuthenticated) {
      console.log("[v0] Home: redirecting to /dashboard")
      router.replace("/dashboard")
    } else {
      console.log("[v0] Home: redirecting to /login")
      router.replace("/login")
    }
  }, [isLoading, isAuthenticated, router])

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

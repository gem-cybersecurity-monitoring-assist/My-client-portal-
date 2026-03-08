"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { loginAction, logoutAction } from "@/lib/actions/auth"

export type UserRole = "superadmin" | "admin" | "team" | "client"

type Session = {
  id: string
  email: string
  role: UserRole
  name: string
  loginTime: string
}

type AuthContextType = {
  session: Session | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gem_session")
      if (stored) setSession(JSON.parse(stored))
    } catch {
      localStorage.removeItem("gem_session")
    }
    setHydrated(true)
  }, [])

  const isLoading = !hydrated

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAction(email, password)
    if (!result.ok) return { ok: false, error: result.error }

    const newSession: Session = {
      id:        result.user.id,
      email:     result.user.email,
      role:      result.user.role as UserRole,
      name:      result.user.name,
      loginTime: new Date().toISOString(),
    }
    setSession(newSession)
    localStorage.setItem("gem_session", JSON.stringify(newSession))
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    if (session?.id) {
      logoutAction(session.id).catch(() => {})
    }
    setSession(null)
    localStorage.removeItem("gem_session")
  }, [session])

  return (
    <AuthContext.Provider
      value={{
        session,
        login,
        logout,
        isAuthenticated: !!session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

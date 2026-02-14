"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { USERS, type UserRole } from "./data"

type Session = {
  email: string
  role: UserRole
  name: string
  loginTime: string
}

type AuthContextType = {
  session: Session | null
  login: (email: string, password: string) => boolean
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
      if (stored) {
        setSession(JSON.parse(stored))
      }
    } catch {
      localStorage.removeItem("gem_session")
    }
    setHydrated(true)
  }, [])

  const isLoading = !hydrated

  const login = useCallback((email: string, password: string): boolean => {
    const user = USERS[email]
    if (!user || user.password !== password) return false
    const newSession: Session = {
      email: user.email,
      role: user.role,
      name: user.name,
      loginTime: new Date().toISOString(),
    }
    setSession(newSession)
    localStorage.setItem("gem_session", JSON.stringify(newSession))
    return true
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    localStorage.removeItem("gem_session")
  }, [])

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

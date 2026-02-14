"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
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
  const [isLoading, setIsLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      const stored = localStorage.getItem("gem_session")
      if (stored) {
        setSession(JSON.parse(stored))
      }
    } catch {
      localStorage.removeItem("gem_session")
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((email: string, password: string): boolean => {
    const user = USERS[email]
    if (user && user.password === password) {
      const newSession: Session = {
        email,
        role: user.role,
        name: user.name,
        loginTime: new Date().toISOString(),
      }
      localStorage.setItem("gem_session", JSON.stringify(newSession))
      setSession(newSession)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("gem_session")
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, login, logout, isAuthenticated: !!session, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const LoginForm = dynamic(() => import("@/components/login-form"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

export default function Home() {
  return <LoginForm />
}

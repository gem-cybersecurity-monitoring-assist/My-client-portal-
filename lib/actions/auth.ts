"use server"

import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export type LoginResult =
  | { ok: true;  user: { id: string; email: string; name: string; role: string } }
  | { ok: false; error: string }

/** Validate credentials against the database and write an audit log entry. */
export async function loginAction(email: string, password: string): Promise<LoginResult> {
  if (!email || !password) {
    return { ok: false, error: "Email and password are required." }
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.active) {
    return { ok: false, error: "Invalid credentials." }
  }

  const valid = await bcrypt.compare(password, user.hashedPassword)
  if (!valid) {
    // Audit failed login attempt
    await prisma.auditLog.create({
      data: {
        action: "login.failed",
        entity: "User",
        metadata: JSON.stringify({ email }),
      },
    })
    return { ok: false, error: "Invalid credentials." }
  }

  // Audit successful login
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "login",
      entity: "User",
      entityId: user.id,
      metadata: JSON.stringify({ email: user.email }),
    },
  })

  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }
}

/** Write a logout audit log entry (session cleared client-side). */
export async function logoutAction(userId: string): Promise<void> {
  if (!userId) return
  await prisma.auditLog.create({
    data: {
      userId,
      action: "logout",
      entity: "User",
      entityId: userId,
    },
  })
}

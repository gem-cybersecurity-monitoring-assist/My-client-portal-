"use server"

import { prisma } from "@/lib/db"

export type UserRow = {
  id: string
  email: string
  name: string
  role: string
  active: boolean
  createdAt: Date
}

/** Fetch all platform users — for admin/superadmin. */
export async function getUsersAction(): Promise<UserRow[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  })
}

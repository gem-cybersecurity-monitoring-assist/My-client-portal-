"use server"

import { prisma } from "@/lib/db"

export type AuditRow = {
  id: string
  action: string
  entity: string | null
  entityId: string | null
  metadata: string | null
  createdAt: Date
  user: { name: string; email: string } | null
}

/** Fetch the most recent audit log entries — for superadmin. */
export async function getAuditLogsAction(limit = 50): Promise<AuditRow[]> {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
    },
  })
}

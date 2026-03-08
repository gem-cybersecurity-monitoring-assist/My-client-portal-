"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type RequestRow = {
  id: string
  type: string
  subject: string
  status: string
  priority: string
  notes: string | null
  createdAt: Date
  client: { name: string; email: string }
  admin: { name: string } | null
}

/** Fetch all service requests — for admins/superadmin. */
export async function getRequestsAction(): Promise<RequestRow[]> {
  return prisma.serviceRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, email: true } },
      admin:  { select: { name: true } },
    },
  })
}

/** Fetch requests for a specific client user. */
export async function getMyRequestsAction(clientEmail: string): Promise<RequestRow[]> {
  const user = await prisma.user.findUnique({ where: { email: clientEmail } })
  if (!user) return []

  return prisma.serviceRequest.findMany({
    where:   { clientId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, email: true } },
      admin:  { select: { name: true } },
    },
  })
}

export type CreateRequestInput = {
  type: string
  subject: string
  priority?: string
  clientEmail: string
}

/** Create a new service request and write an audit log entry. */
export async function createRequestAction(
  input: CreateRequestInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const client = await prisma.user.findUnique({ where: { email: input.clientEmail } })
  if (!client) return { ok: false, error: "Client user not found." }

  const request = await prisma.serviceRequest.create({
    data: {
      type:     input.type,
      subject:  input.subject,
      priority: input.priority ?? "Medium",
      status:   "Pending",
      clientId: client.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId:   client.id,
      action:   "request.create",
      entity:   "ServiceRequest",
      entityId: request.id,
      metadata: JSON.stringify({ type: input.type, subject: input.subject }),
    },
  })

  revalidatePath("/client/requests")
  revalidatePath("/admin/requests")

  return { ok: true, id: request.id }
}

export type UpdateRequestInput = {
  requestId: string
  status: string
  notes?: string
  adminEmail: string
}

/** Update request status (admin approve/reject/review) and record an approval. */
export async function updateRequestStatusAction(
  input: UpdateRequestInput,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await prisma.user.findUnique({ where: { email: input.adminEmail } })
  if (!admin) return { ok: false, error: "Admin user not found." }

  const [request] = await prisma.$transaction([
    prisma.serviceRequest.update({
      where: { id: input.requestId },
      data: {
        status:  input.status,
        adminId: admin.id,
        notes:   input.notes,
      },
    }),
    prisma.approval.create({
      data: {
        requestId: input.requestId,
        adminId:   admin.id,
        action:    input.status,
        notes:     input.notes,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId:   admin.id,
        action:   `request.${input.status.toLowerCase().replace(/\s+/g, ".")}`,
        entity:   "ServiceRequest",
        entityId: input.requestId,
        metadata: JSON.stringify({ status: input.status, notes: input.notes }),
      },
    }),
  ])

  revalidatePath("/admin/requests")
  revalidatePath("/client/requests")

  return { ok: true }
}

/**
 * Prisma seed script  — run: pnpm db:seed
 * Uses @prisma/adapter-pg (Prisma 7 requires a driver adapter at runtime).
 */

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const DB_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/client_admin_portal"

const pool = new Pool({ connectionString: DB_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const SALT_ROUNDS = 10

async function main() {
  console.log("🌱 Seeding database…")

  // ── Users ──────────────────────────────────────────────────────────────

  const [superadmin, admin, , client] = await Promise.all([
    prisma.user.upsert({
      where: { email: "superadmin@gem.com" },
      update: {},
      create: {
        email: "superadmin@gem.com",
        hashedPassword: await bcrypt.hash("super123", SALT_ROUNDS),
        name: "Super Admin",
        role: "superadmin",
      },
    }),
    prisma.user.upsert({
      where: { email: "admin@gem.com" },
      update: {},
      create: {
        email: "admin@gem.com",
        hashedPassword: await bcrypt.hash("admin123", SALT_ROUNDS),
        name: "Organization Admin",
        role: "admin",
      },
    }),
    prisma.user.upsert({
      where: { email: "team@gem.com" },
      update: {},
      create: {
        email: "team@gem.com",
        hashedPassword: await bcrypt.hash("team123", SALT_ROUNDS),
        name: "Team Member",
        role: "team",
      },
    }),
    prisma.user.upsert({
      where: { email: "client@gem.com" },
      update: {},
      create: {
        email: "client@gem.com",
        hashedPassword: await bcrypt.hash("client123", SALT_ROUNDS),
        name: "Platform Client",
        role: "client",
      },
    }),
  ])

  console.log("  ✓ 4 users")

  // ── Service Requests ────────────────────────────────────────────────────

  const req1 = await prisma.serviceRequest.upsert({
    where: { id: "seed-req-001" },
    update: {},
    create: {
      id: "seed-req-001",
      type: "Withdrawal",
      subject: "Withdraw $5,000 to linked bank account",
      status: "Pending",
      priority: "High",
      clientId: client.id,
    },
  })

  const req2 = await prisma.serviceRequest.upsert({
    where: { id: "seed-req-002" },
    update: {},
    create: {
      id: "seed-req-002",
      type: "Support",
      subject: "Portfolio balance discrepancy on dashboard",
      status: "In Review",
      priority: "Medium",
      clientId: client.id,
      adminId: admin.id,
    },
  })

  await prisma.serviceRequest.upsert({
    where: { id: "seed-req-003" },
    update: {},
    create: {
      id: "seed-req-003",
      type: "Account Change",
      subject: "Update beneficiary information",
      status: "Approved",
      priority: "Low",
      clientId: client.id,
      adminId: admin.id,
    },
  })

  await prisma.serviceRequest.upsert({
    where: { id: "seed-req-004" },
    update: {},
    create: {
      id: "seed-req-004",
      type: "Deposit",
      subject: "Wire transfer confirmation needed",
      status: "Pending",
      priority: "Medium",
      clientId: client.id,
    },
  })

  await prisma.serviceRequest.upsert({
    where: { id: "seed-req-005" },
    update: {},
    create: {
      id: "seed-req-005",
      type: "Withdrawal",
      subject: "Quarterly withdrawal — $12,000",
      status: "Rejected",
      priority: "High",
      clientId: client.id,
      adminId: admin.id,
    },
  })

  console.log("  ✓ 5 service requests")

  // ── Approvals ────────────────────────────────────────────────────────────

  await prisma.approval.upsert({
    where: { id: "seed-appr-001" },
    update: {},
    create: {
      id: "seed-appr-001",
      requestId: req2.id,
      adminId: admin.id,
      action: "In Review",
      notes: "Escalated for compliance review",
    },
  })

  await prisma.approval.upsert({
    where: { id: "seed-appr-002" },
    update: {},
    create: {
      id: "seed-appr-002",
      requestId: req1.id,
      adminId: admin.id,
      action: "Pending",
      notes: "Awaiting KYC verification",
    },
  })

  console.log("  ✓ 2 approvals")

  // ── Incidents ────────────────────────────────────────────────────────────

  await prisma.incident.upsert({
    where: { id: "seed-inc-001" },
    update: {},
    create: {
      id: "seed-inc-001",
      title: "Suspicious login attempt from unknown IP",
      description: "Multiple failed login attempts detected from 185.x.x.x",
      severity: "High",
      status: "In Progress",
      reportedById: superadmin.id,
      assignedToId: admin.id,
    },
  })

  await prisma.incident.upsert({
    where: { id: "seed-inc-002" },
    update: {},
    create: {
      id: "seed-inc-002",
      title: "Automated backup failure — node EU-03",
      description: "Scheduled backup at 02:00 UTC failed with timeout error",
      severity: "Medium",
      status: "Open",
      reportedById: superadmin.id,
    },
  })

  await prisma.incident.upsert({
    where: { id: "seed-inc-003" },
    update: {},
    create: {
      id: "seed-inc-003",
      title: "Unusual withdrawal pattern flagged",
      description: "FraudSentry AI flagged 3 rapid withdrawal requests",
      severity: "Critical",
      status: "Resolved",
      reportedById: admin.id,
      assignedToId: superadmin.id,
    },
  })

  console.log("  ✓ 3 incidents")

  // ── Audit Logs ────────────────────────────────────────────────────────────

  for (const entry of [
    { userId: superadmin.id, action: "login",          entity: "User",           entityId: superadmin.id, metadata: JSON.stringify({ email: superadmin.email }) },
    { userId: admin.id,      action: "login",          entity: "User",           entityId: admin.id,      metadata: JSON.stringify({ email: admin.email }) },
    { userId: admin.id,      action: "request.review", entity: "ServiceRequest", entityId: req2.id,       metadata: JSON.stringify({ status: "In Review" }) },
    { userId: client.id,     action: "request.create", entity: "ServiceRequest", entityId: req1.id,       metadata: JSON.stringify({ type: "Withdrawal" }) },
    { userId: superadmin.id, action: "logout",         entity: "User",           entityId: superadmin.id, metadata: JSON.stringify({ email: superadmin.email }) },
  ]) {
    await prisma.auditLog.create({ data: entry })
  }

  console.log("  ✓ 5 audit log entries")
  console.log("\n✅ Seed complete.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

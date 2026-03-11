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

  // ── Portfolio ─────────────────────────────────────────────────────────────

  const portfolio = await prisma.portfolio.upsert({
    where:  { id: "seed-portfolio-001" },
    update: {},
    create: {
      id:          "seed-portfolio-001",
      name:        "Platform Client Growth Portfolio",
      description: "Diversified growth-oriented portfolio across equities, bonds, and real estate.",
      status:      "Active",
      ownerId:     client.id,
      managedById: admin.id,
      accounts: {
        create: [
          { id: "seed-acct-001", name: "Primary Cash",       type: "Cash",      balance: 15420.50  },
          { id: "seed-acct-002", name: "Investment Account", type: "Investment", balance: 112424.82 },
        ],
      },
    },
  })

  const holdingSeed = [
    { id: "seed-h-001", name: "Apple Inc.",         symbol: "AAPL",  assetClass: "STOCK",          quantity: 200,  costBasis: 26980, currentValue: 38500 },
    { id: "seed-h-002", name: "Microsoft Corp.",    symbol: "MSFT",  assetClass: "STOCK",          quantity: 90,   costBasis: 27375, currentValue: 36500 },
    { id: "seed-h-003", name: "Bitcoin",            symbol: "BTC",   assetClass: "CRYPTO",         quantity: 0.78, costBasis: 28060, currentValue: 32000 },
    { id: "seed-h-004", name: "Prologis REIT",      symbol: "PLD",   assetClass: "REAL_ESTATE",    quantity: 350,  costBasis: 35000, currentValue: 42000 },
    { id: "seed-h-005", name: "US Treasury 10Y",    symbol: "UST10", assetClass: "BONDS",          quantity: 20,   costBasis: 18500, currentValue: 19650 },
    { id: "seed-h-006", name: "Blackstone PE Fund", symbol: "BXPE",  assetClass: "PRIVATE_EQUITY", quantity: 1,    costBasis: 45000, currentValue: 50000 },
  ]
  for (const h of holdingSeed) {
    await prisma.holding.upsert({
      where:  { id: h.id },
      update: {},
      create: { ...h, portfolioId: portfolio.id },
    })
  }

  const txSeed = [
    { id: "seed-tx-001", type: "BUY",      description: "Purchased Apple Inc. (200 shares)",        amount: 26980, quantity: 200,  pricePerUnit: 134.90, symbol: "AAPL" },
    { id: "seed-tx-002", type: "BUY",      description: "Purchased Microsoft Corp. (90 shares)",     amount: 27375, quantity: 90,   pricePerUnit: 304.17, symbol: "MSFT" },
    { id: "seed-tx-003", type: "BUY",      description: "Bitcoin purchase",                           amount: 28060, quantity: 0.78, pricePerUnit: 35974,  symbol: "BTC"  },
    { id: "seed-tx-004", type: "DIVIDEND", description: "Microsoft quarterly dividend",               amount: 285,   quantity: null, pricePerUnit: null,   symbol: "MSFT" },
    { id: "seed-tx-005", type: "DEPOSIT",  description: "Initial cash deposit to investment account", amount: 50000, quantity: null, pricePerUnit: null,   symbol: null   },
    { id: "seed-tx-006", type: "BUY",      description: "Prologis REIT purchase (350 units)",         amount: 35000, quantity: 350,  pricePerUnit: 100,    symbol: "PLD"  },
    { id: "seed-tx-007", type: "FEE",      description: "Annual portfolio management fee",             amount: 250,   quantity: null, pricePerUnit: null,   symbol: null   },
  ]
  for (const tx of txSeed) {
    await prisma.portfolioTransaction.upsert({
      where:  { id: tx.id },
      update: {},
      create: { ...tx, portfolioId: portfolio.id },
    })
  }

  const baseValue = 218650
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const totalValue  = baseValue + (i * 500 - 1500)  // deterministic, no Math.random
    const snapId      = `seed-snap-00${7 - i}`
    await prisma.performanceSnapshot.upsert({
      where:  { id: snapId },
      update: {},
      create: {
        id: snapId, date: d, totalValue,
        dayChange: totalValue - baseValue,
        dayChangePct: ((totalValue - baseValue) / baseValue) * 100,
        portfolioId: portfolio.id,
      },
    })
  }

  await prisma.auditLog.create({
    data: {
      userId:   admin.id,
      action:   "portfolio.create",
      entity:   "Portfolio",
      entityId: portfolio.id,
      metadata: JSON.stringify({ name: portfolio.name, ownerEmail: client.email }),
    },
  })

  console.log("  ✓ 1 portfolio, 2 accounts, 6 holdings, 7 transactions, 7 snapshots")
  console.log("\n✅ Seed complete.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

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

  // ── Transactions (richer dataset with statuses) ────────────────────────────
  type TxSeed = {
    id: string; type: string; description: string; amount: number
    quantity?: number | null; pricePerUnit?: number | null; symbol?: string | null
    status: string; adminNote?: string | null; reversalOfId?: string | null
  }
  const txSeed: TxSeed[] = [
    // Confirmed historical buys
    { id: "seed-tx-001", type: "DEPOSIT",  description: "Initial portfolio funding",                   amount: 100000, status: "Confirmed", symbol: null    },
    { id: "seed-tx-002", type: "BUY",      description: "Purchased Apple Inc. (200 shares @ $134.90)", amount: 26980,  status: "Confirmed", quantity: 200,  pricePerUnit: 134.90, symbol: "AAPL" },
    { id: "seed-tx-003", type: "BUY",      description: "Purchased Microsoft Corp. (90 shares)",        amount: 27375,  status: "Confirmed", quantity: 90,   pricePerUnit: 304.17, symbol: "MSFT" },
    { id: "seed-tx-004", type: "BUY",      description: "Bitcoin purchase (0.78 BTC @ $35,974)",        amount: 28060,  status: "Confirmed", quantity: 0.78, pricePerUnit: 35974,  symbol: "BTC"  },
    { id: "seed-tx-005", type: "BUY",      description: "Prologis REIT (350 units @ $100.00)",          amount: 35000,  status: "Confirmed", quantity: 350,  pricePerUnit: 100,    symbol: "PLD"  },
    { id: "seed-tx-006", type: "BUY",      description: "US Treasury 10Y (20 bonds)",                   amount: 18500,  status: "Confirmed", quantity: 20,   pricePerUnit: 925,    symbol: "UST10"},
    { id: "seed-tx-007", type: "BUY",      description: "Blackstone PE Fund commitment",                amount: 45000,  status: "Confirmed", quantity: 1,    pricePerUnit: 45000,  symbol: "BXPE" },
    // Dividends and fees
    { id: "seed-tx-008", type: "DIVIDEND", description: "Microsoft Q1 2025 dividend",                   amount: 285,    status: "Confirmed", symbol: "MSFT" },
    { id: "seed-tx-009", type: "DIVIDEND", description: "Prologis REIT Q1 2025 distribution",           amount: 420,    status: "Confirmed", symbol: "PLD"  },
    { id: "seed-tx-010", type: "FEE",      description: "Q1 2025 portfolio management fee (0.25%)",      amount: 547,    status: "Confirmed", symbol: null   },
    // A reversal example
    { id: "seed-tx-011", type: "WITHDRAWAL", description: "Withdrawal request — duplicate entry",        amount: 5000,   status: "Reversed",  adminNote: "Reversed: duplicate submission by client", symbol: null },
    { id: "seed-tx-012", type: "WITHDRAWAL", description: "REVERSAL: Withdrawal request — duplicate entry", amount: 5000, status: "Reversed", adminNote: "Reversed: duplicate submission by client", reversalOfId: "seed-tx-011", symbol: null },
    // Pending client requests
    { id: "seed-tx-013", type: "DEPOSIT",    description: "Monthly savings transfer",                    amount: 2500,   status: "Pending",   symbol: null   },
    // A corrected transaction
    { id: "seed-tx-014", type: "DIVIDEND",   description: "Apple Q1 2025 dividend (corrected)",          amount: 142,    status: "Confirmed", adminNote: "Corrected: original amount was $128, updated per corporate action notice", symbol: "AAPL" },
  ]
  for (const tx of txSeed) {
    await prisma.portfolioTransaction.upsert({
      where:  { id: tx.id },
      update: {},
      create: {
        portfolioId:  portfolio.id,
        type:         tx.type,
        description:  tx.description,
        amount:       tx.amount,
        quantity:     tx.quantity ?? null,
        pricePerUnit: tx.pricePerUnit ?? null,
        symbol:       tx.symbol ?? null,
        status:       tx.status,
        adminNote:    tx.adminNote ?? null,
        reversalOfId: tx.reversalOfId ?? null,
      },
    })
  }

  // ── Performance Snapshots (30 days, daily) ──────────────────────────────
  const baseValue = 218650
  const seedSnapCount = 30
  for (let i = seedSnapCount - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    // Simulate a mild upward trend with small perturbations
    const trend      = (seedSnapCount - 1 - i) * 120     // +$120/day trend
    const perturbation = ((i * 37) % 1000) - 500          // deterministic ±$500
    const totalValue = baseValue + trend + perturbation
    const dayChange  = i === seedSnapCount - 1 ? 0 : 120 + (((i * 37) % 1000) - 500)
    const snapId     = `seed-snap-${String(seedSnapCount - i).padStart(3, "0")}`
    await prisma.performanceSnapshot.upsert({
      where:  { id: snapId },
      update: {},
      create: {
        id: snapId, date: d, totalValue,
        dayChange,
        dayChangePct: (dayChange / baseValue) * 100,
        portfolioId: portfolio.id,
      },
    })
  }

  // ── Audit logs for portfolio operations ─────────────────────────────────
  await prisma.auditLog.create({
    data: { userId: admin.id, action: "portfolio.create",   entity: "Portfolio",            entityId: portfolio.id,      metadata: JSON.stringify({ name: portfolio.name, ownerEmail: client.email }) },
  })
  await prisma.auditLog.create({
    data: { userId: admin.id, action: "portfolio.transaction.reverse", entity: "PortfolioTransaction", entityId: "seed-tx-011", metadata: JSON.stringify({ reason: "duplicate submission" }) },
  })
  await prisma.auditLog.create({
    data: { userId: admin.id, action: "portfolio.transaction.correct", entity: "PortfolioTransaction", entityId: "seed-tx-014", metadata: JSON.stringify({ note: "Corporate action update" }) },
  })
  await prisma.auditLog.create({
    data: { userId: client.id, action: "portfolio.transaction.add", entity: "PortfolioTransaction", entityId: "seed-tx-013", metadata: JSON.stringify({ type: "DEPOSIT", amount: 2500, status: "Pending" }) },
  })

  console.log("  ✓ 1 portfolio, 2 accounts, 6 holdings, 14 transactions (confirmed/pending/reversed), 30 snapshots")
  console.log("\n✅ Seed complete.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

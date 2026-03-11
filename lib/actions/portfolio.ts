"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ─── Zod Validation Schemas ─────────────────────────────────────────────────

const VALID_TYPES = ["BUY", "SELL", "DIVIDEND", "DEPOSIT", "WITHDRAWAL", "FEE", "TRANSFER"] as const
const CLIENT_TYPES = ["DEPOSIT", "WITHDRAWAL"] as const
const VALID_ASSET_CLASSES = ["STOCK", "CRYPTO", "REAL_ESTATE", "PRIVATE_EQUITY", "BONDS", "CASH"] as const

export const AddTransactionSchema = z.object({
  portfolioId:  z.string().min(1),
  type:         z.enum(VALID_TYPES),
  description:  z.string().min(3, "Description must be at least 3 characters").max(200),
  amount:       z.number().positive("Amount must be positive"),
  quantity:     z.number().positive().optional(),
  pricePerUnit: z.number().positive().optional(),
  symbol:       z.string().max(20).optional(),
})

export const ClientAddTransactionSchema = AddTransactionSchema.extend({
  type: z.enum(CLIENT_TYPES, {
    errorMap: () => ({ message: "Clients may only submit Deposit or Withdrawal transactions" }),
  }),
})

const AddHoldingSchema = z.object({
  portfolioId:  z.string().min(1),
  name:         z.string().min(1).max(100),
  symbol:       z.string().min(1).max(20),
  assetClass:   z.enum(VALID_ASSET_CLASSES),
  quantity:     z.number().positive(),
  costBasis:    z.number().nonnegative(),
  currentValue: z.number().nonnegative(),
})

const CreatePortfolioSchema = z.object({
  name:        z.string().min(2).max(100),
  description: z.string().max(300).optional(),
  ownerEmail:  z.string().email(),
  adminEmail:  z.string().email(),
})

// ─── Output Types ───────────────────────────────────────────────────────────

export type HoldingRow = {
  id:           string
  name:         string
  symbol:       string
  assetClass:   string
  quantity:     number
  costBasis:    number
  currentValue: number
  returnPct:    number
  allocationPct: number
}

export type TransactionRow = {
  id:           string
  type:         string
  description:  string
  amount:       number
  quantity:     number | null
  pricePerUnit: number | null
  symbol:       string | null
  status:       string
  adminNote:    string | null
  reversalOfId: string | null
  createdAt:    Date
}

export type AccountRow = {
  id:       string
  name:     string
  type:     string
  balance:  number
  currency: string
}

export type PortfolioDetail = {
  id:          string
  name:        string
  description: string | null
  status:      string
  createdAt:   Date
  owner:       { id: string; name: string; email: string }
  managedBy:   { name: string; email: string } | null
  accounts:    AccountRow[]
  holdings:    HoldingRow[]
  transactions: TransactionRow[]
  valuation:   PortfolioValuation
}

export type PortfolioValuation = {
  totalValue:    number
  totalCost:     number
  totalReturn:   number
  returnPct:     number
  cashBalance:   number     // sum of Cash accounts
  invested:      number     // totalValue - cashBalance
  pendingDeposits: number   // sum of Pending DEPOSIT transactions
  pendingWithdrawals: number
}

export type PortfolioSummary = {
  id:           string
  name:         string
  status:       string
  owner:        { name: string; email: string }
  valuation:    PortfolioValuation
  holdingCount: number
  createdAt:    Date
}

export type PerformancePeriod = "daily" | "monthly" | "alltime"

export type PerformanceReport = {
  period:          PerformancePeriod
  currentValue:    number
  startValue:      number
  change:          number
  changePct:       number
  snapshots:       { date: Date; totalValue: number; dayChange: number }[]
  totalDeposited:  number
  totalWithdrawn:  number
  dividendsEarned: number
  feesCharged:     number
}

export type AdminSummary = {
  totalPortfolios:  number
  activePortfolios: number
  totalAUM:         number       // total assets under management
  pendingTxCount:   number
  recentActivity:   { portfolioName: string; ownerName: string; action: string; createdAt: Date }[]
}

// ─── Ownership / Role Guard ─────────────────────────────────────────────────

async function assertAccess(portfolioId: string, userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user || !user.active) return { ok: false as const, error: "Unauthorized." }

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      owner:    { select: { id: true, name: true, email: true } },
      managedBy: { select: { name: true, email: true } },
    },
  })
  if (!portfolio) return { ok: false as const, error: "Portfolio not found." }

  const isAdmin = ["admin", "superadmin"].includes(user.role)
  const isOwner = portfolio.ownerId === user.id

  if (!isAdmin && !isOwner) {
    // Audit the denial
    await prisma.auditLog.create({
      data: {
        userId:   user.id,
        action:   "auth.denied",
        entity:   "Portfolio",
        entityId: portfolioId,
        metadata: JSON.stringify({ reason: "not owner or admin" }),
      },
    })
    return { ok: false as const, error: "Access denied." }
  }

  return { ok: true as const, user, portfolio, isAdmin }
}

async function assertAdmin(adminEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return { ok: false as const, error: "Admin access required." }
  }
  return { ok: true as const, user }
}

// ─── Valuation Helper ───────────────────────────────────────────────────────

function computeValuation(
  holdings:    { currentValue: number; costBasis: number }[],
  accounts:    { type: string; balance: number }[],
  transactions: { type: string; amount: number; status: string }[],
): PortfolioValuation {
  const totalValue  = holdings.reduce((s, h) => s + h.currentValue, 0)
  const totalCost   = holdings.reduce((s, h) => s + h.costBasis, 0)
  const cashBalance = accounts
    .filter((a) => a.type === "Cash")
    .reduce((s, a) => s + a.balance, 0)

  const confirmed = transactions.filter((t) => t.status === "Confirmed")
  const pending   = transactions.filter((t) => t.status === "Pending")

  return {
    totalValue,
    totalCost,
    totalReturn:        totalValue - totalCost,
    returnPct:          totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    cashBalance,
    invested:           totalValue - cashBalance,
    pendingDeposits:    pending.filter((t) => t.type === "DEPOSIT").reduce((s, t) => s + t.amount, 0),
    pendingWithdrawals: pending.filter((t) => t.type === "WITHDRAWAL").reduce((s, t) => s + t.amount, 0),
  }
}

function toHoldingRows(
  holdings: { id: string; name: string; symbol: string; assetClass: string; quantity: number; costBasis: number; currentValue: number }[],
): HoldingRow[] {
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0)
  return holdings.map((h) => ({
    ...h,
    returnPct:     h.costBasis > 0 ? ((h.currentValue - h.costBasis) / h.costBasis) * 100 : 0,
    allocationPct: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0,
  }))
}

// ─── Client Read Actions ────────────────────────────────────────────────────

/** Fetch the primary portfolio for the logged-in client (enforces ownership). */
export async function getMyPortfolioAction(userEmail: string): Promise<PortfolioDetail | null> {
  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user) return null

  const portfolio = await prisma.portfolio.findFirst({
    where:   { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      owner:    { select: { id: true, name: true, email: true } },
      managedBy: { select: { name: true, email: true } },
      accounts: true,
      holdings: { orderBy: { currentValue: "desc" } },
      transactions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  })

  if (!portfolio) return null
  return buildPortfolioDetail(portfolio)
}

/** Fetch performance report for a portfolio (client sees own, admin sees any). */
export async function getPerformanceReportAction(
  portfolioId: string,
  period: PerformancePeriod,
  userEmail: string,
): Promise<{ ok: true; report: PerformanceReport } | { ok: false; error: string }> {
  const access = await assertAccess(portfolioId, userEmail)
  if (!access.ok) return access

  const now   = new Date()
  const since = new Date(now)
  if (period === "daily")   since.setDate(since.getDate() - 7)
  if (period === "monthly") since.setDate(since.getDate() - 30)
  if (period === "alltime") since.setFullYear(2000)

  const [snapshots, transactions] = await Promise.all([
    prisma.performanceSnapshot.findMany({
      where:   { portfolioId, date: { gte: since } },
      orderBy: { date: "asc" },
    }),
    prisma.portfolioTransaction.findMany({
      where:   { portfolioId, createdAt: { gte: since }, status: "Confirmed" },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const holdings = await prisma.holding.findMany({ where: { portfolioId } })
  const currentValue = holdings.reduce((s: number, h: { currentValue: number }) => s + h.currentValue, 0)
  const startValue   = snapshots.length > 0 ? snapshots[0].totalValue : currentValue

  const totalDeposited  = transactions.filter((t) => t.type === "DEPOSIT").reduce((s, t) => s + t.amount, 0)
  const totalWithdrawn  = transactions.filter((t) => t.type === "WITHDRAWAL").reduce((s, t) => s + t.amount, 0)
  const dividendsEarned = transactions.filter((t) => t.type === "DIVIDEND").reduce((s, t) => s + t.amount, 0)
  const feesCharged     = transactions.filter((t) => t.type === "FEE").reduce((s, t) => s + t.amount, 0)

  // Audit: valuation recalculated
  await prisma.auditLog.create({
    data: {
      userId:   access.user.id,
      action:   "portfolio.valuation.recalc",
      entity:   "Portfolio",
      entityId: portfolioId,
      metadata: JSON.stringify({ period, currentValue }),
    },
  })

  return {
    ok: true,
    report: {
      period,
      currentValue,
      startValue,
      change:     currentValue - startValue,
      changePct:  startValue > 0 ? ((currentValue - startValue) / startValue) * 100 : 0,
      snapshots:  snapshots.map((s) => ({ date: s.date, totalValue: s.totalValue, dayChange: s.dayChange })),
      totalDeposited,
      totalWithdrawn,
      dividendsEarned,
      feesCharged,
    },
  }
}

// ─── Admin Read Actions ─────────────────────────────────────────────────────

/** Fetch all portfolios with computed valuations (admin only). */
export async function getPortfoliosAction(): Promise<PortfolioSummary[]> {
  const portfolios = await prisma.portfolio.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner:        { select: { name: true, email: true } },
      accounts:     { select: { type: true, balance: true } },
      holdings:     { select: { currentValue: true, costBasis: true } },
      transactions: { select: { type: true, amount: true, status: true } },
      _count:       { select: { holdings: true } },
    },
  })

  return portfolios.map((p) => ({
    id:           p.id,
    name:         p.name,
    status:       p.status,
    owner:        p.owner,
    valuation:    computeValuation(p.holdings, p.accounts, p.transactions),
    holdingCount: p._count.holdings,
    createdAt:    p.createdAt,
  }))
}

/** Fetch a single portfolio by ID with access audit log (admin or owner). */
export async function getPortfolioByIdAction(
  portfolioId: string,
  userEmail: string,
): Promise<{ ok: true; portfolio: PortfolioDetail } | { ok: false; error: string }> {
  const access = await assertAccess(portfolioId, userEmail)
  if (!access.ok) return access

  const full = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      owner:    { select: { id: true, name: true, email: true } },
      managedBy: { select: { name: true, email: true } },
      accounts: true,
      holdings: { orderBy: { currentValue: "desc" } },
      transactions: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!full) return { ok: false, error: "Portfolio not found." }

  if (access.isAdmin) {
    await prisma.auditLog.create({
      data: {
        userId:   access.user.id,
        action:   "portfolio.review",
        entity:   "Portfolio",
        entityId: portfolioId,
        metadata: JSON.stringify({ portfolioOwner: full.owner.email }),
      },
    })
  }

  return { ok: true, portfolio: buildPortfolioDetail(full) }
}

/** Admin dashboard summary — AUM, counts, pending activity. */
export async function getAdminSummaryAction(): Promise<AdminSummary> {
  const [all, pendingTxs, recentLogs] = await Promise.all([
    prisma.portfolio.findMany({
      include: {
        owner:    { select: { name: true } },
        holdings: { select: { currentValue: true } },
      },
    }),
    prisma.portfolioTransaction.count({ where: { status: "Pending" } }),
    prisma.auditLog.findMany({
      where:   { action: { startsWith: "portfolio." } },
      orderBy: { createdAt: "desc" },
      take:    5,
      include: { user: { select: { name: true } } },
    }),
  ])

  const totalAUM = all.reduce(
    (s, p) => s + p.holdings.reduce((hs, h) => hs + h.currentValue, 0),
    0,
  )

  return {
    totalPortfolios:  all.length,
    activePortfolios: all.filter((p) => p.status === "Active").length,
    totalAUM,
    pendingTxCount:   pendingTxs,
    recentActivity:   recentLogs.map((l) => ({
      portfolioName: l.entity ?? "",
      ownerName:     l.user?.name ?? "System",
      action:        l.action,
      createdAt:     l.createdAt,
    })),
  }
}

// ─── Transaction Actions ────────────────────────────────────────────────────

export type AddTransactionInput = {
  portfolioId:  string
  type:         string
  description:  string
  amount:       number
  quantity?:    number
  pricePerUnit?: number
  symbol?:      string
  userEmail:    string
  isAdminAction?: boolean
}

/** Add a portfolio transaction. Clients get Pending; admins get Confirmed. */
export async function addPortfolioTransactionAction(
  input: AddTransactionInput,
): Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string[]> }> {
  const user = await prisma.user.findUnique({ where: { email: input.userEmail } })
  if (!user || !user.active) return { ok: false, error: "User not found." }

  const isAdmin = ["admin", "superadmin"].includes(user.role)

  // Schema to use depends on role
  const schema = isAdmin ? AddTransactionSchema : ClientAddTransactionSchema
  const parsed = schema.safeParse({
    portfolioId:  input.portfolioId,
    type:         input.type,
    description:  input.description,
    amount:       input.amount,
    quantity:     input.quantity,
    pricePerUnit: input.pricePerUnit,
    symbol:       input.symbol,
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form"
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message]
    }
    return { ok: false, error: "Validation failed.", fieldErrors }
  }

  // Route-level ownership check
  const portfolio = await prisma.portfolio.findUnique({ where: { id: input.portfolioId } })
  if (!portfolio) return { ok: false, error: "Portfolio not found." }
  if (!isAdmin && portfolio.ownerId !== user.id) return { ok: false, error: "Access denied." }

  const status = isAdmin ? "Confirmed" : "Pending"

  const tx = await prisma.portfolioTransaction.create({
    data: {
      portfolioId:  input.portfolioId,
      type:         parsed.data.type,
      description:  parsed.data.description,
      amount:       parsed.data.amount,
      quantity:     parsed.data.quantity ?? null,
      pricePerUnit: parsed.data.pricePerUnit ?? null,
      symbol:       parsed.data.symbol ?? null,
      status,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId:   user.id,
      action:   "portfolio.transaction.add",
      entity:   "PortfolioTransaction",
      entityId: tx.id,
      metadata: JSON.stringify({
        portfolioId: input.portfolioId,
        type:   tx.type,
        amount: tx.amount,
        symbol: tx.symbol,
        status,
      }),
    },
  })

  revalidatePath("/client/portfolio")
  revalidatePath("/admin/portfolios")
  return { ok: true }
}

export type ReverseTransactionInput = {
  transactionId: string
  reason:        string
  adminEmail:    string
}

/** Admin reverses a Confirmed transaction. Creates a reversal record and marks original as Reversed. */
export async function reverseTransactionAction(
  input: ReverseTransactionInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!input.reason?.trim()) return { ok: false, error: "Reversal reason is required." }

  const adminCheck = await assertAdmin(input.adminEmail)
  if (!adminCheck.ok) return adminCheck

  const original = await prisma.portfolioTransaction.findUnique({ where: { id: input.transactionId } })
  if (!original) return { ok: false, error: "Transaction not found." }
  if (original.status === "Reversed") return { ok: false, error: "Transaction is already reversed." }
  if (original.status === "Pending")  return { ok: false, error: "Cannot reverse a Pending transaction; confirm or delete it first." }
  if (original.reversalOfId)          return { ok: false, error: "Cannot reverse a reversal entry." }

  await prisma.$transaction([
    // Mark original as Reversed
    prisma.portfolioTransaction.update({
      where: { id: input.transactionId },
      data:  { status: "Reversed", adminNote: `Reversed: ${input.reason}` },
    }),
    // Create offsetting reversal record
    prisma.portfolioTransaction.create({
      data: {
        portfolioId:  original.portfolioId,
        type:         original.type,
        description:  `REVERSAL: ${original.description}`,
        amount:       original.amount,
        quantity:     original.quantity,
        pricePerUnit: original.pricePerUnit,
        symbol:       original.symbol,
        status:       "Reversed",
        adminNote:    input.reason,
        reversalOfId: original.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId:   adminCheck.user.id,
        action:   "portfolio.transaction.reverse",
        entity:   "PortfolioTransaction",
        entityId: input.transactionId,
        metadata: JSON.stringify({ reason: input.reason, originalAmount: original.amount }),
      },
    }),
  ])

  revalidatePath("/client/portfolio")
  revalidatePath("/admin/portfolios")
  return { ok: true }
}

export type ConfirmTransactionInput = {
  transactionId: string
  adminEmail:    string
  adminNote?:    string
}

/** Admin confirms a Pending transaction. */
export async function confirmTransactionAction(
  input: ConfirmTransactionInput,
): Promise<{ ok: boolean; error?: string }> {
  const adminCheck = await assertAdmin(input.adminEmail)
  if (!adminCheck.ok) return adminCheck

  const tx = await prisma.portfolioTransaction.findUnique({ where: { id: input.transactionId } })
  if (!tx)                         return { ok: false, error: "Transaction not found." }
  if (tx.status !== "Pending")     return { ok: false, error: "Only Pending transactions can be confirmed." }

  await prisma.$transaction([
    prisma.portfolioTransaction.update({
      where: { id: input.transactionId },
      data:  { status: "Confirmed", adminNote: input.adminNote ?? null },
    }),
    prisma.auditLog.create({
      data: {
        userId:   adminCheck.user.id,
        action:   "portfolio.transaction.confirm",
        entity:   "PortfolioTransaction",
        entityId: input.transactionId,
        metadata: JSON.stringify({ portfolioId: tx.portfolioId, amount: tx.amount }),
      },
    }),
  ])

  revalidatePath("/client/portfolio")
  revalidatePath("/admin/portfolios")
  return { ok: true }
}

export type CorrectTransactionInput = {
  transactionId: string
  adminEmail:    string
  description?:  string
  amount?:       number
  adminNote:     string
}

/** Admin corrects a transaction (description or amount). Full audit trail. */
export async function correctTransactionAction(
  input: CorrectTransactionInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!input.adminNote?.trim()) return { ok: false, error: "Admin note required for corrections." }

  const adminCheck = await assertAdmin(input.adminEmail)
  if (!adminCheck.ok) return adminCheck

  const tx = await prisma.portfolioTransaction.findUnique({ where: { id: input.transactionId } })
  if (!tx)                        return { ok: false, error: "Transaction not found." }
  if (tx.status === "Reversed")   return { ok: false, error: "Cannot correct a reversed transaction." }
  if (input.amount !== undefined && input.amount <= 0) return { ok: false, error: "Amount must be positive." }

  const updateData: Record<string, unknown> = { adminNote: input.adminNote }
  if (input.description) updateData.description = input.description
  if (input.amount)      updateData.amount = input.amount

  await prisma.$transaction([
    prisma.portfolioTransaction.update({ where: { id: input.transactionId }, data: updateData }),
    prisma.auditLog.create({
      data: {
        userId:   adminCheck.user.id,
        action:   "portfolio.transaction.correct",
        entity:   "PortfolioTransaction",
        entityId: input.transactionId,
        metadata: JSON.stringify({
          before: { description: tx.description, amount: tx.amount },
          after:  updateData,
          note:   input.adminNote,
        }),
      },
    }),
  ])

  revalidatePath("/client/portfolio")
  revalidatePath("/admin/portfolios")
  return { ok: true }
}

// ─── Portfolio Mutation Actions ─────────────────────────────────────────────

export type CreatePortfolioInput = {
  name:        string
  description?: string
  ownerEmail:  string
  adminEmail:  string
}

export async function createPortfolioAction(
  input: CreatePortfolioInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const parsed = CreatePortfolioSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") }
  }

  const [owner, admin] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.ownerEmail } }),
    prisma.user.findUnique({ where: { email: input.adminEmail } }),
  ])
  if (!owner) return { ok: false, error: "Client user not found." }
  if (!admin) return { ok: false, error: "Admin user not found." }
  if (!["client", "team"].includes(owner.role)) {
    return { ok: false, error: "Portfolio owner must be a client or team member." }
  }

  const portfolio = await prisma.portfolio.create({
    data: {
      name:        input.name,
      description: input.description,
      ownerId:     owner.id,
      managedById: admin.id,
      accounts: {
        create: [
          { name: "Primary Cash",       type: "Cash",       balance: 0 },
          { name: "Investment Account", type: "Investment",  balance: 0 },
        ],
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId:   admin.id,
      action:   "portfolio.create",
      entity:   "Portfolio",
      entityId: portfolio.id,
      metadata: JSON.stringify({ name: input.name, ownerEmail: input.ownerEmail }),
    },
  })

  revalidatePath("/admin/portfolios")
  return { ok: true, id: portfolio.id }
}

export type AddHoldingInput = {
  portfolioId:  string
  name:         string
  symbol:       string
  assetClass:   string
  quantity:     number
  costBasis:    number
  currentValue: number
  adminEmail:   string
}

export async function addHoldingAction(
  input: AddHoldingInput,
): Promise<{ ok: boolean; error?: string }> {
  const adminCheck = await assertAdmin(input.adminEmail)
  if (!adminCheck.ok) return adminCheck

  const parsed = AddHoldingSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") }
  }

  const portfolio = await prisma.portfolio.findUnique({ where: { id: input.portfolioId } })
  if (!portfolio) return { ok: false, error: "Portfolio not found." }

  const holding = await prisma.holding.create({
    data: {
      portfolioId:  input.portfolioId,
      name:         input.name,
      symbol:       input.symbol,
      assetClass:   input.assetClass,
      quantity:     input.quantity,
      costBasis:    input.costBasis,
      currentValue: input.currentValue,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId:   adminCheck.user.id,
      action:   "portfolio.holding.add",
      entity:   "Holding",
      entityId: holding.id,
      metadata: JSON.stringify({
        portfolioId: input.portfolioId,
        symbol:      input.symbol,
        assetClass:  input.assetClass,
        costBasis:   input.costBasis,
      }),
    },
  })

  revalidatePath("/client/portfolio")
  revalidatePath("/admin/portfolios")
  return { ok: true }
}

// ─── Internal Builder ───────────────────────────────────────────────────────

type RawPortfolio = {
  id:          string
  name:        string
  description: string | null
  status:      string
  createdAt:   Date
  owner:       { id: string; name: string; email: string }
  managedBy:   { name: string; email: string } | null
  accounts:    { id: string; name: string; type: string; balance: number; currency: string }[]
  holdings:    { id: string; name: string; symbol: string; assetClass: string; quantity: number; costBasis: number; currentValue: number }[]
  transactions: {
    id: string; type: string; description: string; amount: number
    quantity: number | null; pricePerUnit: number | null; symbol: string | null
    status: string; adminNote: string | null; reversalOfId: string | null; createdAt: Date
  }[]
}

function buildPortfolioDetail(p: RawPortfolio): PortfolioDetail {
  return {
    id:          p.id,
    name:        p.name,
    description: p.description,
    status:      p.status,
    createdAt:   p.createdAt,
    owner:       p.owner,
    managedBy:   p.managedBy,
    accounts:    p.accounts,
    holdings:    toHoldingRows(p.holdings),
    transactions: p.transactions,
    valuation:   computeValuation(p.holdings, p.accounts, p.transactions),
  }
}

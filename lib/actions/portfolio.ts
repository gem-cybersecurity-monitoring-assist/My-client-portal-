"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

// ─── Read Types ─────────────────────────────────────────────────────────────

export type HoldingRow = {
  id: string
  name: string
  symbol: string
  assetClass: string
  quantity: number
  costBasis: number
  currentValue: number
  returnPct: number
}

export type TransactionRow = {
  id: string
  type: string
  description: string
  amount: number
  quantity: number | null
  pricePerUnit: number | null
  symbol: string | null
  createdAt: Date
}

export type AccountRow = {
  id: string
  name: string
  type: string
  balance: number
  currency: string
}

export type PortfolioDetail = {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: Date
  owner: { id: string; name: string; email: string }
  managedBy: { name: string; email: string } | null
  accounts: AccountRow[]
  holdings: HoldingRow[]
  transactions: TransactionRow[]
  totalValue: number
  totalCost: number
  totalReturn: number
  returnPct: number
}

export type PortfolioSummary = {
  id: string
  name: string
  status: string
  owner: { name: string; email: string }
  totalValue: number
  holdingCount: number
  createdAt: Date
}

// ─── Client Actions ─────────────────────────────────────────────────────────

/** Fetch the portfolio for the logged-in client. */
export async function getMyPortfolioAction(
  userEmail: string,
): Promise<PortfolioDetail | null> {
  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user) return null

  const portfolio = await prisma.portfolio.findFirst({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      managedBy: { select: { name: true, email: true } },
      accounts: true,
      holdings: { orderBy: { currentValue: "desc" } },
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  })

  if (!portfolio) return null
  return toPortfolioDetail(portfolio)
}

// ─── Admin Actions ──────────────────────────────────────────────────────────

/** Fetch all portfolios — for admin/superadmin oversight. */
export async function getPortfoliosAction(): Promise<PortfolioSummary[]> {
  const portfolios = await prisma.portfolio.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { holdings: true } },
      holdings: { select: { currentValue: true } },
    },
  })

  return portfolios.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    owner: p.owner,
    totalValue: p.holdings.reduce((s, h) => s + h.currentValue, 0),
    holdingCount: p._count.holdings,
    createdAt: p.createdAt,
  }))
}

/** Fetch a single portfolio by ID — for admin detail view with audit log. */
export async function getPortfolioByIdAction(
  portfolioId: string,
  adminEmail: string,
): Promise<PortfolioDetail | null> {
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!admin) return null

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      managedBy: { select: { name: true, email: true } },
      accounts: true,
      holdings: { orderBy: { currentValue: "desc" } },
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  })

  if (!portfolio) return null

  // Audit: admin reviewed this portfolio
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "portfolio.review",
      entity: "Portfolio",
      entityId: portfolio.id,
      metadata: JSON.stringify({ portfolioOwner: portfolio.owner.email }),
    },
  })

  return toPortfolioDetail(portfolio)
}

// ─── Mutation Actions ────────────────────────────────────────────────────────

export type CreatePortfolioInput = {
  name: string
  description?: string
  ownerEmail: string
  adminEmail: string
}

/** Admin creates a portfolio on behalf of a client. */
export async function createPortfolioAction(
  input: CreatePortfolioInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const [owner, admin] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.ownerEmail } }),
    prisma.user.findUnique({ where: { email: input.adminEmail } }),
  ])
  if (!owner) return { ok: false, error: "Client user not found." }
  if (!admin) return { ok: false, error: "Admin user not found." }

  const portfolio = await prisma.portfolio.create({
    data: {
      name: input.name,
      description: input.description,
      ownerId: owner.id,
      managedById: admin.id,
      accounts: {
        create: [
          { name: "Primary Cash", type: "Cash", balance: 0 },
          { name: "Investment Account", type: "Investment", balance: 0 },
        ],
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "portfolio.create",
      entity: "Portfolio",
      entityId: portfolio.id,
      metadata: JSON.stringify({ name: input.name, ownerEmail: input.ownerEmail }),
    },
  })

  revalidatePath("/admin/portfolios")
  return { ok: true, id: portfolio.id }
}

export type AddHoldingInput = {
  portfolioId: string
  name: string
  symbol: string
  assetClass: string
  quantity: number
  costBasis: number
  currentValue: number
  adminEmail: string
}

/** Admin adds a holding to a portfolio. */
export async function addHoldingAction(
  input: AddHoldingInput,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await prisma.user.findUnique({ where: { email: input.adminEmail } })
  if (!admin) return { ok: false, error: "Admin user not found." }

  const holding = await prisma.holding.create({
    data: {
      portfolioId: input.portfolioId,
      name: input.name,
      symbol: input.symbol,
      assetClass: input.assetClass,
      quantity: input.quantity,
      costBasis: input.costBasis,
      currentValue: input.currentValue,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "portfolio.holding.add",
      entity: "Holding",
      entityId: holding.id,
      metadata: JSON.stringify({
        portfolioId: input.portfolioId,
        symbol: input.symbol,
        assetClass: input.assetClass,
        costBasis: input.costBasis,
      }),
    },
  })

  revalidatePath("/client/portfolio")
  revalidatePath("/admin/portfolios")
  return { ok: true }
}

export type AddTransactionInput = {
  portfolioId: string
  type: string
  description: string
  amount: number
  quantity?: number
  pricePerUnit?: number
  symbol?: string
  userEmail: string
}

/** Record a portfolio transaction (client or admin). */
export async function addPortfolioTransactionAction(
  input: AddTransactionInput,
): Promise<{ ok: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.userEmail } })
  if (!user) return { ok: false, error: "User not found." }

  const tx = await prisma.portfolioTransaction.create({
    data: {
      portfolioId: input.portfolioId,
      type: input.type,
      description: input.description,
      amount: input.amount,
      quantity: input.quantity ?? null,
      pricePerUnit: input.pricePerUnit ?? null,
      symbol: input.symbol ?? null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "portfolio.transaction.add",
      entity: "PortfolioTransaction",
      entityId: tx.id,
      metadata: JSON.stringify({
        portfolioId: input.portfolioId,
        type: input.type,
        amount: input.amount,
        symbol: input.symbol,
      }),
    },
  })

  revalidatePath("/client/portfolio")
  revalidatePath("/admin/portfolios")
  return { ok: true }
}

// ─── Helper ─────────────────────────────────────────────────────────────────

type PortfolioWithIncludes = Awaited<ReturnType<typeof prisma.portfolio.findFirst>> & {
  owner: { id: string; name: string; email: string }
  managedBy: { name: string; email: string } | null
  accounts: { id: string; name: string; type: string; balance: number; currency: string }[]
  holdings: { id: string; name: string; symbol: string; assetClass: string; quantity: number; costBasis: number; currentValue: number }[]
  transactions: { id: string; type: string; description: string; amount: number; quantity: number | null; pricePerUnit: number | null; symbol: string | null; createdAt: Date }[]
}

function toPortfolioDetail(p: NonNullable<PortfolioWithIncludes>): PortfolioDetail {
  const totalValue = p.holdings.reduce((s, h) => s + h.currentValue, 0)
  const totalCost  = p.holdings.reduce((s, h) => s + h.costBasis, 0)
  const totalReturn = totalValue - totalCost
  const returnPct  = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    createdAt: p.createdAt,
    owner: p.owner,
    managedBy: p.managedBy,
    accounts: p.accounts,
    holdings: p.holdings.map((h) => ({
      ...h,
      returnPct: h.costBasis > 0 ? ((h.currentValue - h.costBasis) / h.costBasis) * 100 : 0,
    })),
    transactions: p.transactions,
    totalValue,
    totalCost,
    totalReturn,
    returnPct,
  }
}

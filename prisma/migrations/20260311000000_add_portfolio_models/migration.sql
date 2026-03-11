-- Migration: add_portfolio_models
-- Portfolio relations on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dummy_check" BOOLEAN DEFAULT TRUE;
ALTER TABLE "User" DROP COLUMN IF EXISTS "dummy_check";

-- Portfolio
CREATE TABLE IF NOT EXISTS "Portfolio" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "status"      TEXT NOT NULL DEFAULT 'Active',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId"     TEXT NOT NULL,
    "managedById" TEXT,
    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- PortfolioAccount
CREATE TABLE IF NOT EXISTS "PortfolioAccount" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "type"        TEXT NOT NULL,
    "balance"     DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency"    TEXT NOT NULL DEFAULT 'USD',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portfolioId" TEXT NOT NULL,
    CONSTRAINT "PortfolioAccount_pkey" PRIMARY KEY ("id")
);

-- Holding
CREATE TABLE IF NOT EXISTS "Holding" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "symbol"       TEXT NOT NULL,
    "assetClass"   TEXT NOT NULL,
    "quantity"     DOUBLE PRECISION NOT NULL,
    "costBasis"    DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portfolioId"  TEXT NOT NULL,
    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- PortfolioTransaction
CREATE TABLE IF NOT EXISTS "PortfolioTransaction" (
    "id"           TEXT NOT NULL,
    "type"         TEXT NOT NULL,
    "description"  TEXT NOT NULL,
    "amount"       DOUBLE PRECISION NOT NULL,
    "quantity"     DOUBLE PRECISION,
    "pricePerUnit" DOUBLE PRECISION,
    "symbol"       TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portfolioId"  TEXT NOT NULL,
    CONSTRAINT "PortfolioTransaction_pkey" PRIMARY KEY ("id")
);

-- PerformanceSnapshot
CREATE TABLE IF NOT EXISTS "PerformanceSnapshot" (
    "id"           TEXT NOT NULL,
    "date"         TIMESTAMP(3) NOT NULL,
    "totalValue"   DOUBLE PRECISION NOT NULL,
    "dayChange"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dayChangePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portfolioId"  TEXT NOT NULL,
    CONSTRAINT "PerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- Foreign keys (IF NOT EXISTS guard via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Portfolio_ownerId_fkey') THEN
    ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Portfolio_managedById_fkey') THEN
    ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_managedById_fkey"
      FOREIGN KEY ("managedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PortfolioAccount_portfolioId_fkey') THEN
    ALTER TABLE "PortfolioAccount" ADD CONSTRAINT "PortfolioAccount_portfolioId_fkey"
      FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Holding_portfolioId_fkey') THEN
    ALTER TABLE "Holding" ADD CONSTRAINT "Holding_portfolioId_fkey"
      FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PortfolioTransaction_portfolioId_fkey') THEN
    ALTER TABLE "PortfolioTransaction" ADD CONSTRAINT "PortfolioTransaction_portfolioId_fkey"
      FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PerformanceSnapshot_portfolioId_fkey') THEN
    ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_portfolioId_fkey"
      FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

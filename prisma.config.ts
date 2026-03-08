import path from "node:path"
import { defineConfig } from "prisma/config"

const DB_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/client_admin_portal"

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: DB_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
})

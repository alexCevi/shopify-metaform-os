import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Fallback so `prisma generate` works without DATABASE_URL; set DATABASE_URL for migrate/deploy
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
})

// This file configures the Prisma CLI (migrate, studio, etc.)
// The adapter for PrismaClient is configured separately in lib/prisma.ts
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Migrations need a direct (non-pooler) connection. Runtime Prisma uses DATABASE_URL.
    url: process.env['DIRECT_URL'] || process.env['DATABASE_URL'],
  },
})

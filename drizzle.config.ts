import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres.eqmritowkzgguapkypif:Chakri2458Prod@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false },
  },
});

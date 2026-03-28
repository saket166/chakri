import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || "aws-1-ap-south-1.pooler.supabase.com",
    port: 5432,
    user: process.env.DB_USER || "postgres.eqmritowkzgguapkypif",
    password: "Chakri2458Prod",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  },
});

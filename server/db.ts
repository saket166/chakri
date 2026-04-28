import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 15, // Match Supabase's default pool size
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000, // Close idle connections quickly
  keepAlive: true, // Prevent zombie connections if AWS drops idle TCP
});

export const db = drizzle(pool, { schema });
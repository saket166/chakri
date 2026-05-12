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
  idleTimeoutMillis: 30000, // Increase slightly for Supavisor
  keepAlive: true, // Prevent zombie connections if AWS drops idle TCP
});

pool.on('error', (err) => {
  console.error('Unexpected database error on idle client', err);
});

export const db = drizzle(pool, { schema });
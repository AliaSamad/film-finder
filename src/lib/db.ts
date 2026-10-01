import { Pool } from "pg";

// Reuse one pool across hot reloads in dev so we don't exhaust connections.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export function getPool(): Pool {
  if (!globalForPg.pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    globalForPg.pgPool = new Pool({ connectionString, max: 10 });
  }
  return globalForPg.pgPool;
}

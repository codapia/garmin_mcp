import "server-only";
import { Pool } from "pg";

const globalForDb = globalThis as unknown as { fitnessPool?: Pool };
export function db(): Pool {
  if (!globalForDb.fitnessPool) {
    for (const key of ["PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD"]) {
      if (!process.env[key]) throw new Error("Falta configuración de BD: " + key);
    }
    globalForDb.fitnessPool = new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || "5432"),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return globalForDb.fitnessPool;
}

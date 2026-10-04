import "server-only";
import pg from "pg";

/**
 * Conexión a la base de datos (develop por ahora).
 * SOLO servidor — nunca importar desde componentes cliente.
 */

const connectionString = process.env.DATABASE_URL_DEVELOP;

if (!connectionString) {
  throw new Error(
    "[Fernández Tours] Falta DATABASE_URL_DEVELOP en .env.local"
  );
}

declare global {
  var __pgPool: pg.Pool | undefined;
}

// Reutilizar el pool entre hot-reloads en desarrollo
export const pool = global.__pgPool ?? new pg.Pool({ connectionString });
global.__pgPool = pool;

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await pool.query<T>(text, params);
  return rows;
}

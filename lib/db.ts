import "server-only";
import pg from "pg";

/**
 * Conexión a la base de datos.
 * SOLO servidor — nunca importar desde componentes cliente.
 * La conexión es lazy: no falla en build si falta la env var.
 * Usa DATABASE_URL (configurable por entorno en Vercel).
 */

let _pool: pg.Pool | null = null;
let _initError: Error | null = null;

function getPool(): pg.Pool {
  if (_initError) throw _initError;
  if (_pool) return _pool;

  // Prioridad: DATABASE_URL (configurable por entorno) > DATABASE_URL_DEVELOP (legacy local)
  const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_DEVELOP;
  if (!connectionString) {
    _initError = new Error(
      "[Fernández Tours] Falta DATABASE_URL en variables de entorno.\n" +
      "Configura DATABASE_URL en Vercel (producción/preview) o DATABASE_URL_DEVELOP en .env.local"
    );
    throw _initError;
  }

  const globalWithPool = globalThis as typeof globalThis & { __pgPool?: pg.Pool };
  _pool = globalWithPool.__pgPool ?? new pg.Pool({ connectionString });
  globalWithPool.__pgPool = _pool;
  return _pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const { rows } = await pool.query<T>(text, params);
  return rows;
}

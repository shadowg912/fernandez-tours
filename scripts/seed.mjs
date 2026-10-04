import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL_DEVELOP;
if (!url) throw new Error("Falta DATABASE_URL_DEVELOP en .env.local");

const client = new pg.Client({ connectionString: url });
await client.connect();

const sql = readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8");
await client.query(sql);

const tables = ["clients", "services", "students", "payments"];
for (const t of tables) {
  const { rows } = await client.query(`select count(*)::int as n from ${t}`);
  console.log(`  ${t}: ${rows[0].n} filas`);
}
await client.end();
console.log("✅ Seed aplicado correctamente");

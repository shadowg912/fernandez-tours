import pg from "pg";

/**
 * Datos de prueba para rutas diarias (SOLO develop).
 *
 * Marca como "hechos" (status='done') los días de servicio de cada ruta
 * diaria desde el inicio del mes hasta hoy, respetando los días de la
 * semana configurados en cada ruta.
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-routes.mjs
 *   node --env-file=.env.local scripts/seed-routes.mjs --month 2026-10
 *   node --env-file=.env.local scripts/seed-routes.mjs --route "Ruta jose"
 *   node --env-file=.env.local scripts/seed-routes.mjs --reset
 *
 * --reset: borra pagos de ruta y ejecuciones, las regenera y vuelve a marcar
 *          el mes. Útil para volver a probar desde cero.
 *
 * Es idempotente: volver a correrlo no duplica ni rompe nada.
 */

const url = process.env.DATABASE_URL_DEVELOP;
if (!url) throw new Error("Falta DATABASE_URL_DEVELOP en .env.local");

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const monthArg = arg("--month");   // YYYY-MM
const routeArg = arg("--route");   // nombre exacto (opcional)
const reset = args.includes("--reset");

if (monthArg && !/^\d{4}-\d{2}$/.test(monthArg)) {
  throw new Error(`--month inválido: "${monthArg}" (usa YYYY-MM)`);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  // Rango: desde el 1ro del mes (indicado o el actual) hasta hoy.
  const { rows: [range] } = await client.query(
    monthArg
      ? `select to_char($1::date, 'YYYY-MM-DD') as start_date,
                to_char(least(current_date, ($1::date + interval '1 month - 1 day')::date), 'YYYY-MM-DD') as end_date`
      : `select to_char(date_trunc('month', current_date), 'YYYY-MM-DD') as start_date,
                to_char(current_date, 'YYYY-MM-DD') as end_date`,
    monthArg ? [`${monthArg}-01`] : []
  );

  const routes = await client.query(
    `select id, name, daily_fee, days_of_week
       from daily_routes
      ${routeArg ? "where name = $1" : ""}
      order by name`,
    routeArg ? [routeArg] : []
  );

  if (routes.rows.length === 0) {
    console.log(routeArg ? `No se encontró la ruta "${routeArg}".` : "No hay rutas diarias.");
  }

  if (reset && routes.rows.length > 0) {
    if (routeArg) {
      for (const r of routes.rows) {
        await client.query("delete from route_payments where route_id = $1", [r.id]);
        await client.query("delete from route_executions where route_id = $1", [r.id]);
      }
    } else {
      await client.query("delete from route_payments");
      await client.query("delete from route_executions");
    }
    for (const r of routes.rows) {
      await client.query("select generate_route_executions($1)", [r.id]);
    }
    console.log("♻️  Pagos y ejecuciones reiniciados, ejecuciones regeneradas.\n");
  }

  console.log(`📅 Marcando días hechos del ${range.start_date} al ${range.end_date}\n`);

  for (const r of routes.rows) {
    const res = await client.query(
      `insert into route_executions (route_id, execution_date, status)
       select $1, g.d, 'done'
       from generate_series($2::date, $3::date, interval '1 day') as g(d)
       where (case extract(dow from g.d)::int
                when 0 then 'Sun' when 1 then 'Mon' when 2 then 'Tue'
                when 3 then 'Wed' when 4 then 'Thu' when 5 then 'Fri' when 6 then 'Sat'
              end) = any($4::text[])
       on conflict (route_id, execution_date) do update set status = 'done'`,
      [r.id, range.start_date, range.end_date, r.days_of_week]
    );

    const stats = await client.query(
      `select
         count(*) filter (where status = 'done' and execution_date <= current_date)::int as service_days,
         coalesce((select sum(days_paid) from route_payments where route_id = $1), 0)::int as paid_days
       from route_executions where route_id = $1`,
      [r.id]
    );
    const { service_days: serviceDays, paid_days: paidDays } = stats.rows[0];
    const pending = serviceDays - paidDays;
    console.log(
      `• ${r.name}: ${serviceDays} días hechos, ${paidDays} pagados, ` +
      `${pending >= 0 ? `${pending} pendientes` : `${Math.abs(pending)} prepagados`} ` +
      `(${res.rowCount} fechas marcadas)`
    );
  }
} finally {
  await client.end();
}

console.log("\n✅ Listo.");

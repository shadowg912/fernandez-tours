"use server";

import { revalidatePath } from "next/cache";
import { DailyRouteDraft, DailyRouteStats, RouteExecution, RoutePayment, RoutePaymentDraft } from "@/lib/types";

export interface TodayRouteStats {
  completed: number;
  collected: number;
  pending: number;
  skipped: number;
}

// Lazy import to avoid bundling pg/client-side
async function getQuery() {
  const { query } = await import("@/lib/db");
  return query;
}

export async function createDailyRoute(d: DailyRouteDraft) {
  const query = await getQuery();
  const rows = await query(
    `insert into daily_routes (name, daily_fee, days_of_week, generation_window_days)
     values ($1,$2,$3,$4)
     returning id`,
    [d.name, d.dailyFee, d.daysOfWeek, d.generationWindowDays ?? 60]
  );
  const routeId = rows[0].id;
  await query("select generate_route_executions($1)", [routeId]);
  revalidatePath("/rutas");
}

export async function updateDailyRoute(id: string, d: Partial<DailyRouteDraft>) {
  const query = await getQuery();
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;
  if (d.name !== undefined) { sets.push(`name=$${idx++}`); vals.push(d.name); }
  if (d.dailyFee !== undefined) { sets.push(`daily_fee=$${idx++}`); vals.push(d.dailyFee); }
  if (d.daysOfWeek !== undefined) { sets.push(`days_of_week=$${idx++}`); vals.push(d.daysOfWeek); }
  if (d.generationWindowDays !== undefined) { sets.push(`generation_window_days=$${idx++}`); vals.push(d.generationWindowDays); }
  if (sets.length === 0) return;
  vals.push(id);
  await query(`update daily_routes set ${sets.join(", ")} where id=$${idx}`, vals);
  
  // Regenerar TODAS las fechas si cambiaron días o ventana
  if (d.daysOfWeek !== undefined || d.generationWindowDays !== undefined) {
    await query("delete from route_executions where route_id=$1", [id]);
    await query("select generate_route_executions($1)", [id]);
  }
  revalidatePath("/rutas");
}

export async function deleteDailyRoute(id: string) {
  const query = await getQuery();
  await query("delete from daily_routes where id=$1", [id]);
  revalidatePath("/rutas");
}

export async function toggleExecutionStatus(routeId: string, executionDate: string, newStatus: "pending" | "done" | "skipped") {
  const query = await getQuery();
  // Upsert: insert if not exists, update if exists. El cobro vive en route_payments.
  await query(
    `insert into route_executions (route_id, execution_date, status)
     values ($1, $2, $3)
     on conflict (route_id, execution_date) do update set status = $3`,
    [routeId, executionDate, newStatus]
  );
  revalidatePath("/rutas");
  revalidatePath("/agenda");
}

export async function copyDailyRouteToNextMonth(routeId: string) {
  const query = await getQuery();
  const newId = await query("select copy_route_to_next_month($1) as id", [routeId]);
  revalidatePath("/rutas");
  return newId[0].id;
}

export async function getRouteExecutions(routeId: string): Promise<RouteExecution[]> {
  const query = await getQuery();
  const rows = await query(
    "select * from route_executions where route_id = $1 order by execution_date",
    [routeId]
  );
  return rows.map((r: Record<string, unknown>) => {
    const execDate = r.execution_date;
    const dateStr = execDate instanceof Date 
      ? execDate.toISOString().slice(0, 10)
      : String(execDate).slice(0, 10);
    return {
      id: String(r.id),
      routeId: String(r.route_id),
      executionDate: dateStr,
      status: String(r.status) as RouteExecution["status"],
    };
  });
}

/* ---------- Pagos de ruta (días pagados) ---------- */

export async function createRoutePayment(d: RoutePaymentDraft): Promise<void> {
  const query = await getQuery();
  const routeRows = await query<{ daily_fee: number }>(
    "select daily_fee from daily_routes where id=$1",
    [d.routeId]
  );
  if (routeRows.length === 0) throw new Error("Ruta no encontrada");
  const feePerDay = Number(routeRows[0].daily_fee);
  const days = Math.max(1, Math.floor(d.daysPaid));
  const amount = days * feePerDay;

  await query(
    `insert into route_payments (route_id, days_paid, fee_per_day, amount, payment_date, method, observation)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [d.routeId, days, feePerDay, amount, d.paymentDate, d.method, d.observation ?? null]
  );
  revalidatePath("/rutas");
  revalidatePath("/pagos");
}

export async function getRoutePayments(routeId: string): Promise<RoutePayment[]> {
  const query = await getQuery();
  const rows = await query(
    "select * from route_payments where route_id=$1 order by payment_date desc, created_at desc",
    [routeId]
  );
  return rows.map(mapRoutePayment);
}

export async function deleteRoutePayment(id: string): Promise<void> {
  const query = await getQuery();
  await query("delete from route_payments where id=$1", [id]);
  revalidatePath("/rutas");
  revalidatePath("/pagos");
}

function mapRoutePayment(r: Record<string, unknown>): RoutePayment {
  const date = r.payment_date;
  const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
  return {
    id: String(r.id),
    routeId: String(r.route_id),
    daysPaid: Number(r.days_paid),
    feePerDay: Number(r.fee_per_day),
    amount: Number(r.amount),
    paymentDate: dateStr,
    method: String(r.method) as RoutePayment["method"],
    observation: r.observation == null ? undefined : String(r.observation),
  };
}

/**
 * Estadísticas de pago por ruta:
 * serviceDays = días hechos hasta hoy, paidDays = días pagados,
 * pendingDays = serviceDays - paidDays (negativo = saldo a favor).
 */
export async function getRouteStats(): Promise<Record<string, DailyRouteStats>> {
  const query = await getQuery();
  const rows = await query<{
    id: string;
    service_days: number;
    paid_days: number;
    total_collected: number;
  }>(
    `select dr.id,
       (select count(*) from route_executions e
          where e.route_id = dr.id and e.status = 'done' and e.execution_date <= current_date)::int as service_days,
       coalesce((select sum(days_paid) from route_payments p where p.route_id = dr.id), 0)::int as paid_days,
       coalesce((select sum(amount) from route_payments p where p.route_id = dr.id), 0)::int as total_collected
     from daily_routes dr`
  );
  const stats: Record<string, DailyRouteStats> = {};
  for (const r of rows) {
    const serviceDays = Number(r.service_days);
    const paidDays = Number(r.paid_days);
    stats[String(r.id)] = {
      serviceDays,
      paidDays,
      pendingDays: serviceDays - paidDays,
      totalCollected: Number(r.total_collected),
    };
  }
  return stats;
}

/**
 * Reporte de días pendientes de pago de una ruta.
 * Los pagos se aplican a las fechas más antiguas primero (FIFO).
 */
export async function getRoutePendingDays(routeId: string): Promise<string[]> {
  const query = await getQuery();
  const rows = await query<{ execution_date: unknown }>(
    `with done_days as (
       select execution_date,
              row_number() over (order by execution_date) as rn
       from route_executions
       where route_id = $1 and status = 'done' and execution_date <= current_date
     ),
     paid as (
       select coalesce(sum(days_paid), 0)::int as paid_days
       from route_payments where route_id = $1
     )
     select to_char(execution_date, 'YYYY-MM-DD') as execution_date
     from done_days, paid
     where rn > paid.paid_days
     order by execution_date`,
    [routeId]
  );
  return rows.map((r) => String(r.execution_date));
}

/**
 * Reporte global: días pendientes de pago por ruta (una fila por día).
 */
export async function getPendingDaysReport(): Promise<
  { routeId: string; routeName: string; dailyFee: number; dates: string[] }[]
> {
  const query = await getQuery();
  const rows = await query<{ route_id: string; route_name: string; daily_fee: number; execution_date: string }>(
    `with done_days as (
       select route_id, execution_date,
              row_number() over (partition by route_id order by execution_date) as rn
       from route_executions
       where status = 'done' and execution_date <= current_date
     ),
     paid as (
       select route_id, coalesce(sum(days_paid), 0)::int as paid_days
       from route_payments group by route_id
     )
     select dr.id as route_id, dr.name as route_name, dr.daily_fee,
            to_char(d.execution_date, 'YYYY-MM-DD') as execution_date
     from daily_routes dr
     join done_days d on d.route_id = dr.id
     left join paid p on p.route_id = dr.id
     where d.rn > coalesce(p.paid_days, 0)
     order by dr.name, d.execution_date`
  );
  const byRoute = new Map<string, { routeId: string; routeName: string; dailyFee: number; dates: string[] }>();
  for (const r of rows) {
    const key = String(r.route_id);
    if (!byRoute.has(key)) {
      byRoute.set(key, {
        routeId: key,
        routeName: String(r.route_name),
        dailyFee: Number(r.daily_fee),
        dates: [],
      });
    }
    byRoute.get(key)!.dates.push(String(r.execution_date));
  }
  return [...byRoute.values()];
}


export async function getTodayRouteStats(routeId: string): Promise<TodayRouteStats> {
  const query = await getQuery();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await query(
    `select 
      count(*) filter (where status = 'done')::int as completed,
      coalesce((select sum(amount) from route_payments where route_id = $1 and payment_date = $2), 0)::int as collected,
      count(*) filter (where status = 'pending')::int as pending,
      count(*) filter (where status = 'skipped')::int as skipped
     from route_executions where route_id = $1 and execution_date = $2`,
    [routeId, today]
  );
  const row = rows[0];
  if (!row) return { completed: 0, collected: 0, pending: 0, skipped: 0 };
  return {
    completed: Number(row.completed),
    collected: Number(row.collected),
    pending: Number(row.pending),
    skipped: Number(row.skipped),
  };
}

export async function getGlobalTodayStats(): Promise<TodayRouteStats> {
  const query = await getQuery();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await query(
    `select 
      count(*) filter (where status = 'done')::int as completed,
      coalesce((select sum(amount) from route_payments where payment_date = $1), 0)::int as collected,
      count(*) filter (where status = 'pending')::int as pending,
      count(*) filter (where status = 'skipped')::int as skipped
     from route_executions where execution_date = $1`,
    [today]
  );
  const row = rows[0];
  if (!row) return { completed: 0, collected: 0, pending: 0, skipped: 0 };
  return {
    completed: Number(row.completed),
    collected: Number(row.collected),
    pending: Number(row.pending),
    skipped: Number(row.skipped),
  };
}
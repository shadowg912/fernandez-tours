"use server";

import { revalidatePath } from "next/cache";
import { DailyRouteDraft, RouteExecution } from "@/lib/types";

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
  const routeRows = await query("select daily_fee from daily_routes where id=$1", [routeId]);
  if (routeRows.length === 0) throw new Error("Ruta no encontrada");
  const dailyFee = routeRows[0].daily_fee;
  
  const amount = newStatus === "done" ? dailyFee : 0;
  
  // Upsert: insert if not exists, update if exists
  await query(
    `insert into route_executions (route_id, execution_date, status, amount_collected)
     values ($1, $2, $3, $4)
     on conflict (route_id, execution_date) do update set 
       status = $3,
       amount_collected = $4`,
    [routeId, executionDate, newStatus, amount]
  );
  revalidatePath("/rutas");
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
      amountCollected: Number(r.amount_collected),
    };
  });
}

export async function getTodayRouteStats(routeId: string): Promise<TodayRouteStats> {
  const query = await getQuery();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await query(
    `select 
      count(*) filter (where status = 'done')::int as completed,
      coalesce(sum(amount_collected) filter (where status = 'done'), 0)::int as collected,
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
      coalesce(sum(amount_collected) filter (where status = 'done'), 0)::int as collected,
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
"use server";

import { revalidatePath } from "next/cache";
import { ClientDraft, DailyRouteDraft, PaymentDraft, Route, ServiceDraft, StudentDraft } from "@/lib/types";

// Lazy import to avoid bundling pg/client-side
async function getQuery() {
  const { query } = await import("@/lib/db");
  return query;
}

/* ---------- Estudiantes ---------- */
export async function createStudent(d: StudentDraft) {
  const query = await getQuery();
  await query(
    `insert into students (name, school, address, entry_time, exit_time, days, monthly_fee, frequency, guardian, phone, route_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [d.name, d.school ?? null, d.address ?? null, d.entryTime, d.exitTime, d.days, d.monthlyFee, d.frequency, d.guardian ?? null, d.phone ?? null, d.routeId ?? null]
  );
  revalidatePath("/transporte");
}

export async function updateStudent(id: string, d: StudentDraft) {
  const query = await getQuery();
  await query(
    `update students set name=$1, school=$2, address=$3, entry_time=$4, exit_time=$5, days=$6, monthly_fee=$7,
     frequency=$8, guardian=$9, phone=$10, route_id=$11 where id=$12`,
    [d.name, d.school ?? null, d.address ?? null, d.entryTime, d.exitTime, d.days, d.monthlyFee, d.frequency, d.guardian ?? null, d.phone ?? null, d.routeId ?? null, id]
  );
  // Recalcular cobertura solo si hay pagos registrados (no borrar cobertura legacy).
  const hasPayments = await query("select 1 from payments where student_id=$1 and status='completado' limit 1", [id]);
  if (hasPayments.length > 0) await query("select refresh_student_paid_until($1)", [id]);
  revalidatePath("/transporte");
}

export async function deleteStudent(id: string) {
  const query = await getQuery();
  await query("delete from students where id=$1", [id]);
  revalidatePath("/transporte");
}

export async function markStudentPaid(student: { id: string; name: string; monthlyFee: number }, payment: { date: string; method: string; period?: string; observation?: string }) {
  const query = await getQuery();
  await query(
    `insert into payments (client_name, date, concept, amount, method, status, period, observation, student_id)
     values ($1,$2,$3,$4,$5,'completado',$6,$7,$8)`,
    [
      student.name,
      payment.date,
      `Transporte estudiantil — ${payment.period ?? "periodo actual"}`,
      student.monthlyFee,
      payment.method,
      payment.period ?? null,
      payment.observation ?? null,
      student.id,
    ]
  );
  await query("select refresh_student_paid_until($1)", [student.id]);
  revalidatePath("/transporte");
  revalidatePath("/pagos");
  revalidatePath("/");
}

export async function quickPayStudent(id: string) {
  const query = await getQuery();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await query<{ monthly_fee: number; name: string }>("select monthly_fee, name from students where id=$1", [id]);
  if (rows.length === 0) throw new Error("Estudiante no encontrado");
  const student = rows[0];

  await query(
    `insert into payments (client_name, date, concept, amount, method, status, student_id)
     values ($1,$2,$3,$4,'efectivo','completado',$5)`,
    [student.name, today, `Transporte estudiantil — pago rápido`, student.monthly_fee, id]
  );
  await query("select refresh_student_paid_until($1)", [id]);
  revalidatePath("/transporte");
  revalidatePath("/pagos");
  revalidatePath("/");
}

/* ---------- Servicios ---------- */
export async function createService(d: ServiceDraft) {
  const query = await getQuery();
  await query(
    `insert into services (client_name, date, time, origin, destination, passengers, price, status, observations)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [d.clientName, d.date, d.time, d.origin, d.destination, d.passengers, d.price, d.status, d.observations ?? null]
  );
  revalidatePath("/servicios");
  revalidatePath("/");
  revalidatePath("/agenda");
}

export async function completeService(id: string) {
  const query = await getQuery();
  await query("update services set status='completado' where id=$1", [id]);
  revalidatePath("/");
  revalidatePath("/servicios");
  revalidatePath("/agenda");
}

export async function cancelService(id: string) {
  const query = await getQuery();
  await query("update services set status='cancelado' where id=$1", [id]);
  revalidatePath("/");
  revalidatePath("/servicios");
  revalidatePath("/agenda");
}

export async function confirmService(id: string) {
  const query = await getQuery();
  await query("update services set status='confirmado' where id=$1", [id]);
  revalidatePath("/servicios");
  revalidatePath("/agenda");
}

/* ---------- Clientes ---------- */
export async function createClient(d: ClientDraft) {
  const query = await getQuery();
  await query(
    `insert into clients (name, phone, email, address, service_type) values ($1,$2,$3,$4,$5)`,
    [d.name, d.phone, d.email ?? null, d.address ?? null, d.serviceType]
  );
  revalidatePath("/clientes");
}

/* ---------- Pagos ---------- */
export async function createPayment(d: PaymentDraft) {
  const query = await getQuery();
  await query(
    `insert into payments (client_name, date, concept, amount, method, status, period, observation, student_id, client_id, advance)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [d.clientName, d.date, d.concept, d.amount, d.method, d.status, d.period ?? null, d.observation ?? null, d.studentId ?? null, d.clientId ?? null, d.advance ?? false]
  );
  if (d.studentId) await query("select refresh_student_paid_until($1)", [d.studentId]);
  revalidatePath("/pagos");
  revalidatePath("/");
  revalidatePath("/transporte");
}

export async function updatePayment(id: string, d: PaymentDraft) {
  const query = await getQuery();
  const prev = await query<{ student_id: string | null }>("select student_id from payments where id=$1", [id]);
  const prevStudent = prev[0]?.student_id ?? null;
  await query(
    `update payments
     set client_name=$1, date=$2, concept=$3, amount=$4, method=$5, status=$6, period=$7, observation=$8,
         student_id=$9, client_id=$10, advance=$11
     where id=$12`,
    [d.clientName, d.date, d.concept, d.amount, d.method, d.status, d.period ?? null, d.observation ?? null, d.studentId ?? null, d.clientId ?? null, d.advance ?? false, id]
  );
  const affected = new Set<string>();
  if (prevStudent) affected.add(prevStudent);
  if (d.studentId) affected.add(d.studentId);
  for (const sid of affected) await query("select refresh_student_paid_until($1)", [sid]);
  revalidatePath("/pagos");
  revalidatePath("/");
  revalidatePath("/transporte");
}

export async function deletePayment(id: string) {
  const query = await getQuery();
  const prev = await query<{ student_id: string | null }>("select student_id from payments where id=$1", [id]);
  const prevStudent = prev[0]?.student_id ?? null;
  await query("delete from payments where id=$1", [id]);
  if (prevStudent) await query("select refresh_student_paid_until($1)", [prevStudent]);
  revalidatePath("/pagos");
  revalidatePath("/");
  revalidatePath("/transporte");
}

export async function markPaymentPaid(id: string) {
  const query = await getQuery();
  const rows = await query<{ student_id: string | null }>("select student_id from payments where id=$1", [id]);
  const studentId = rows[0]?.student_id ?? null;
  await query("update payments set status='completado' where id=$1", [id]);
  if (studentId) await query("select refresh_student_paid_until($1)", [studentId]);
  revalidatePath("/pagos");
  revalidatePath("/");
  revalidatePath("/transporte");
}

/* ---------- Rutas (estudiantes) ---------- */
export async function createRoute(d: Omit<Route, "id">) {
  const query = await getQuery();
  await query(
    `insert into routes (name, description, color) values ($1,$2,$3)`,
    [d.name, d.description ?? null, d.color]
  );
  revalidatePath("/transporte");
}

export async function updateRoute(id: string, d: Partial<Omit<Route, "id">>) {
  const query = await getQuery();
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;
  if (d.name !== undefined) { sets.push(`name=$${idx++}`); vals.push(d.name); }
  if (d.description !== undefined) { sets.push(`description=$${idx++}`); vals.push(d.description); }
  if (d.color !== undefined) { sets.push(`color=$${idx++}`); vals.push(d.color); }
  if (sets.length === 0) return;
  vals.push(id);
  await query(`update routes set ${sets.join(", ")} where id=$${idx}`, vals);
  revalidatePath("/transporte");
}

export async function deleteRoute(id: string) {
  const query = await getQuery();
  await query("delete from routes where id=$1", [id]);
  revalidatePath("/transporte");
}

/* ---------- Rutas Diarias (Daily Routes) ---------- */
export async function createDailyRoute(d: DailyRouteDraft) {
  const query = await getQuery();
  await query(
    `insert into daily_routes (name, daily_fee, days_of_week, generation_window_days)
     values ($1,$2,$3,$4)`,
    [d.name, d.dailyFee, d.daysOfWeek, d.generationWindowDays ?? 60]
  );
  // Generar ejecuciones automáticamente
  await query("select generate_route_executions(currval('daily_routes_id_seq'))");
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
  
  // Regenerar ejecuciones si cambiaron días o ventana
  if (d.daysOfWeek !== undefined || d.generationWindowDays !== undefined) {
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
  await query(
    `update route_executions
     set status = $1
     where route_id = $2 and execution_date = $3`,
    [newStatus, routeId, executionDate]
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

export async function getRouteExecutions(routeId: string) {
  const query = await getQuery();
  const rows = await query(
    "select * from route_executions where route_id = $1 order by execution_date",
    [routeId]
  );
  return rows.map((r: Record<string, unknown>) => ({
    id: String(r.id),
    routeId: String(r.route_id),
    executionDate: String(r.execution_date).slice(0, 10),
    status: String(r.status),
  }));
}

export async function getDailyRouteWithSummary(routeId: string) {
  const query = await getQuery();
  const routeRows = await query("select * from daily_routes where id = $1", [routeId]);
  if (routeRows.length === 0) return null;
  
  const route = routeRows[0];
  const execRows = await query(
    "select * from route_executions where route_id = $1 order by execution_date",
    [routeId]
  );
  
  const executions = execRows.map((r: Record<string, unknown>) => ({
    id: String(r.id),
    routeId: String(r.route_id),
    executionDate: String(r.execution_date).slice(0, 10),
    status: String(r.status),
  }));
  
  const collectedRows = await query("select coalesce(sum(amount),0)::int as total from route_payments where route_id = $1", [routeId]);
  const totalCollected = Number(collectedRows[0]?.total ?? 0);
  const totalPending = executions.filter((e: Record<string, unknown>) => e.status === "pending").length;
  const totalSkipped = executions.filter((e: Record<string, unknown>) => e.status === "skipped").length;
  
  return {
    route: {
      id: String(route.id),
      name: String(route.name),
      dailyFee: Number(route.daily_fee),
      daysOfWeek: (route.days_of_week as string[]) ?? [],
    },
    executions,
    totalCollected,
    totalPending,
    totalSkipped,
  };
}
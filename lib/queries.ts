import { query } from "./db";
import { Client, DailyRoute, Payment, Route, RouteExecution, Service, ServiceStatus, Student } from "./types";

type Row = Record<string, unknown>;

function toDateString(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

function mapService(r: Row): Service {
  return {
    id: String(r.id),
    clientName: String(r.client_name),
    date: toDateString(r.date),
    time: String(r.time),
    origin: String(r.origin),
    destination: String(r.destination),
    passengers: Number(r.passengers),
    price: Number(r.price),
    status: String(r.status) as ServiceStatus,
    paidAmount: Number(r.paid_amount ?? 0),
  };
}

function mapClient(r: Row): Client {
  return {
    id: String(r.id),
    name: String(r.name),
    phone: String(r.phone),
    email: r.email == null ? undefined : String(r.email),
    address: r.address == null ? undefined : String(r.address),
    serviceType: String(r.service_type),
    lastService: r.last_service == null ? "" : String(r.last_service),
    balance: Number(r.balance),
  };
}

function mapStudent(r: Row): Student {
  return {
    id: String(r.id),
    name: String(r.name),
    school: r.school == null ? undefined : String(r.school),
    address: String(r.address),
    entryTime: String(r.entry_time).slice(0, 5),
    exitTime: String(r.exit_time).slice(0, 5),
    days: (r.days as string[]) ?? [],
    monthlyFee: Number(r.monthly_fee),
    frequency: r.frequency as Student["frequency"],
    paid: Boolean(r.paid),
    paidUntil: r.paid_until == null ? undefined : toDateString(r.paid_until),
    guardian: String(r.guardian),
    phone: String(r.phone),
    routeId: r.route_id == null ? undefined : String(r.route_id),
  };
}

function mapRoute(r: Row): Route {
  return {
    id: String(r.id),
    name: String(r.name),
    description: r.description == null ? undefined : String(r.description),
    color: String(r.color),
  };
}

function mapDailyRoute(r: Row): DailyRoute {
  return {
    id: String(r.id),
    name: String(r.name),
    dailyFee: Number(r.daily_fee),
    daysOfWeek: (r.days_of_week as string[]) ?? [],
    generationWindowDays: Number(r.generation_window_days),
  };
}

function mapRouteExecution(r: Row): RouteExecution {
  return {
    id: String(r.id),
    routeId: String(r.route_id),
    executionDate: toDateString(r.execution_date),
    status: String(r.status) as RouteExecution["status"],
  };
}

function mapPayment(r: Row): Payment {
  const source = r.source == null ? "payment" : (String(r.source) as Payment["source"]);
  return {
    id: String(r.id),
    clientName: String(r.client_name),
    date: toDateString(r.date),
    concept: String(r.concept),
    amount: Number(r.amount),
    method: r.method as Payment["method"],
    status: r.status as Payment["status"],
    period: r.period == null ? undefined : String(r.period),
    observation: r.observation == null ? undefined : String(r.observation),
    studentId: r.student_id == null ? undefined : String(r.student_id),
    clientId: r.client_id == null ? undefined : String(r.client_id),
    serviceId: r.service_id == null ? undefined : String(r.service_id),
    advance: Boolean(r.advance),
    source,
    routeId: r.route_id == null ? undefined : String(r.route_id),
    daysPaid: r.days_paid == null ? undefined : Number(r.days_paid),
    feePerDay: r.fee_per_day == null ? undefined : Number(r.fee_per_day),
  };
}

const SERVICE_WITH_PAID = `select s.*, coalesce((
    select sum(p.amount) from payments p
    where p.service_id = s.id and p.status = 'completado'
  ), 0)::int as paid_amount
  from services s`;

export async function getServices(): Promise<Service[]> {
  const rows = await query(`${SERVICE_WITH_PAID} order by s.date, s.time`);
  return rows.map(mapService);
}

export async function getClients(): Promise<Client[]> {
  const rows = await query("select * from clients order by name");
  return rows.map(mapClient);
}

export async function getStudents(): Promise<Student[]> {
  const rows = await query("select * from students order by name");
  return rows.map(mapStudent);
}

export async function getPayments(): Promise<Payment[]> {
  // Pagos normales + pagos de rutas diarias (estos últimos solo lectura).
  // Se combinan en la consulta para NO duplicar registros en la tabla payments.
  const rows = await query(
    `select id, client_name, date, concept, amount, method, status::text as status, period, observation,
            student_id, client_id, service_id, advance, created_at,
            null::uuid as route_id, null::int as days_paid, null::int as fee_per_day, 'payment'::text as source
       from payments
     union all
     select rp.id, dr.name as client_name, rp.payment_date as date,
            'Ruta diaria — ' || rp.days_paid || ' día' || case when rp.days_paid = 1 then '' else 's' end as concept,
            rp.amount, rp.method, 'completado'::text as status,
            to_char(rp.payment_date, 'YYYY-MM') as period, rp.observation,
            null::uuid, null::uuid, null::uuid, false, rp.created_at,
            rp.route_id, rp.days_paid, rp.fee_per_day, 'route_payment'::text as source
       from route_payments rp
       join daily_routes dr on dr.id = rp.route_id
     order by date desc, created_at desc`
  );
  return rows.map(mapPayment);
}

/** Pagos completados de un estudiante dentro de un rango (fechas inclusivas). */
export async function getStudentPaymentsInRange(
  studentId: string,
  from: string,
  to: string
): Promise<Payment[]> {
  const rows = await query(
    `select id, client_name, date, concept, amount, method, status::text as status, period, observation,
            student_id, client_id, service_id, advance,
            null::uuid as route_id, null::int as days_paid, null::int as fee_per_day, 'payment'::text as source
       from payments
      where student_id = $1
        and status = 'completado'
        and date between $2 and $3
      order by date, created_at`,
    [studentId, from, to]
  );
  return rows.map(mapPayment);
}

export interface DashboardData {
  today: string;
  todayServices: Service[];
  /** Servicios completados en la semana actual (lunes a domingo). */
  completedWeek: Service[];
  /** Servicios completados en el mes actual. */
  completedMonth: Service[];
  /** Servicios confirmados próximos dentro del mes actual (desde hoy). */
  upcomingMonth: Service[];
  /** Estudiantes con pago pendiente. */
  pendingStudents: Student[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [todayRows] = await query<{ t: string }>("select to_char(current_date, 'YYYY-MM-DD') as t");
  const today = todayRows.t;

  const [todayServices, completedWeek, completedMonth, upcomingMonth, pendingStudents] = await Promise.all([
    query(`${SERVICE_WITH_PAID} where s.date = $1 order by s.time`, [today]).then((r) => r.map(mapService)),
    query(
      `${SERVICE_WITH_PAID}
       where s.status = 'completado'
         and s.date >= date_trunc('week', current_date)::date
         and s.date < (date_trunc('week', current_date) + interval '7 days')::date
       order by s.date, s.time`
    ).then((r) => r.map(mapService)),
    query(
      `${SERVICE_WITH_PAID}
       where s.status = 'completado'
         and s.date >= date_trunc('month', current_date)::date
         and s.date < (date_trunc('month', current_date) + interval '1 month')::date
       order by s.date, s.time`
    ).then((r) => r.map(mapService)),
    query(
      `${SERVICE_WITH_PAID}
       where s.status = 'confirmado'
         and s.date >= current_date
         and s.date < (date_trunc('month', current_date) + interval '1 month')::date
       order by s.date, s.time`
    ).then((r) => r.map(mapService)),
    query("select * from students where paid = false order by name").then((r) => r.map(mapStudent)),
  ]);

  return { today, todayServices, completedWeek, completedMonth, upcomingMonth, pendingStudents };
}

export async function getRoutes(): Promise<Route[]> {
  const rows = await query("select * from routes order by name");
  return rows.map(mapRoute);
}

export async function getDailyRoutes(): Promise<DailyRoute[]> {
  const rows = await query("select * from daily_routes order by created_at desc");
  return rows.map(mapDailyRoute);
}

export async function getDailyRouteWithExecutions(routeId: string): Promise<{ route: DailyRoute; executions: RouteExecution[] } | null> {
  const routeRows = await query("select * from daily_routes where id = $1", [routeId]);
  if (routeRows.length === 0) return null;
  
  const route = mapDailyRoute(routeRows[0]);
  const execRows = await query(
    "select * from route_executions where route_id = $1 order by execution_date",
    [routeId]
  );
  const executions = execRows.map(mapRouteExecution);
  
  return { route, executions };
}

export async function getRouteExecutionsForDateRange(startDate: string, endDate: string): Promise<RouteExecution[]> {
  const rows = await query(
    "select * from route_executions where execution_date between $1 and $2 order by execution_date",
    [startDate, endDate]
  );
  return rows.map(mapRouteExecution);
}

export async function getRouteSummary(routeId: string): Promise<{ totalCollected: number; totalPending: number; totalSkipped: number; executionCount: number } | null> {
  const rows = await query(
    `select
      coalesce((select sum(amount) from route_payments where route_id = $1), 0)::int as total_collected,
      count(*) filter (where status = 'pending')::int as total_pending,
      count(*) filter (where status = 'skipped')::int as total_skipped,
      count(*)::int as execution_count
     from route_executions where route_id = $1`,
    [routeId]
  );
  if (rows.length === 0) return null;
  return {
    totalCollected: rows[0].total_collected,
    totalPending: rows[0].total_pending,
    totalSkipped: rows[0].total_skipped,
    executionCount: rows[0].execution_count,
  };
}

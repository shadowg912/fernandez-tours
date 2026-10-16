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
    amountCollected: Number(r.amount_collected),
  };
}

function mapPayment(r: Row): Payment {
  return {
    id: String(r.id),
    clientName: String(r.client_name),
    date: toDateString(r.date),
    concept: String(r.concept),
    amount: Number(r.amount),
    method: r.method as Payment["method"],
    status: r.status as Payment["status"],
  };
}

export async function getServices(): Promise<Service[]> {
  const rows = await query("select * from services order by date, time");
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
  const rows = await query("select * from payments order by date desc, created_at desc");
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
    query("select * from services where date = $1 order by time", [today]).then((r) => r.map(mapService)),
    query(
      `select * from services
       where status = 'completado'
         and date >= date_trunc('week', current_date)::date
         and date < (date_trunc('week', current_date) + interval '7 days')::date
       order by date, time`
    ).then((r) => r.map(mapService)),
    query(
      `select * from services
       where status = 'completado'
         and date >= date_trunc('month', current_date)::date
         and date < (date_trunc('month', current_date) + interval '1 month')::date
       order by date, time`
    ).then((r) => r.map(mapService)),
    query(
      `select * from services
       where status = 'confirmado'
         and date >= current_date
         and date < (date_trunc('month', current_date) + interval '1 month')::date
       order by date, time`
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
      coalesce(sum(case when status = 'done' then amount_collected else 0 end), 0)::int as total_collected,
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

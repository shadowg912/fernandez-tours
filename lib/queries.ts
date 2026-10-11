import "server-only";
import { query } from "./db";
import { Client, Payment, Route, Service, ServiceStatus, Student } from "./types";

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
  upcomingCount: number;
  clientsCount: number;
  pendingMoney: number;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [todayRows] = await query<{ t: string }>("select to_char(current_date, 'YYYY-MM-DD') as t");
  const today = todayRows.t;

  const todayServices = (await query("select * from services where date = $1 order by time", [today])).map(mapService);

  const [{ n: upcomingCount }] = await query<{ n: number }>(
    "select count(*)::int as n from services where date > $1 and status in ('confirmado','pendiente')",
    [today]
  );
  const [{ n: clientsCount }] = await query<{ n: number }>("select count(*)::int as n from clients");
  const [{ n: pendingMoney }] = await query<{ n: number }>(
    "select coalesce(sum(price), 0)::int as n from services where status = 'pendiente'"
  );

  return { today, todayServices, upcomingCount, clientsCount, pendingMoney };
}

export async function getRoutes(): Promise<Route[]> {
  const rows = await query("select * from routes order by name");
  return rows.map(mapRoute);
}

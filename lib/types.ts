export type ServiceStatus = "pendiente_confirmacion" | "confirmado" | "completado" | "cancelado";

export interface Service {
  id: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  time: string;
  origin: string;
  destination: string;
  passengers: number;
  price: number;
  status: ServiceStatus;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  serviceType: string;
  lastService: string;
  balance: number;
  email?: string;
  address?: string;
}

export type PayFrequency = "mensual" | "quincenal" | "semanal";

export interface Route {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface Student {
  id: string;
  name: string;
  school?: string;        // opcional: escuela/colegio
  address?: string;       // opcional: dirección de recogida
  entryTime: string;      // HH:MM 24h
  exitTime: string;       // HH:MM 24h
  days: string[];
  monthlyFee: number;
  frequency: PayFrequency;
  paid: boolean;          // derivado de paid_until (cobertura vigente)
  paidUntil?: string;     // fecha hasta la que está cubierto (YYYY-MM-DD)
  guardian?: string;      // opcional: representante
  phone?: string;         // opcional: teléfono del representante
  routeId?: string;       // FK a routes
  route?: Route;          // para joins/populate
}

export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta";
export type PaymentStatus = "completado" | "pendiente";

export interface Payment {
  id: string;
  clientName: string;
  date: string;
  concept: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  period?: string;
  observation?: string;
  studentId?: string;   // vínculo a students (opcional)
  clientId?: string;    // vínculo a clients (opcional)
  advance: boolean;     // pago por adelantado
  /** Origen del registro: pago normal o pago de ruta diaria (solo lectura). */
  source?: "payment" | "route_payment";
  routeId?: string;     // vínculo a daily_routes (pago de ruta)
  daysPaid?: number;    // días pagados (pago de ruta)
}

export type ExecutionStatus = "pending" | "done" | "skipped";

export interface DailyRoute {
  id: string;
  name: string;
  dailyFee: number;
  daysOfWeek: string[];  // ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  generationWindowDays: number;  // default 60
}

export interface RouteExecution {
  id: string;
  routeId: string;
  executionDate: string;
  status: ExecutionStatus;
}

export type DailyRouteDraft = Omit<DailyRoute, "id">;

export interface DailyRouteWithExecutions extends DailyRoute {
  executions: RouteExecution[];
  totalCollected: number;
  totalPending: number;
  totalSkipped: number;
}

/** Un pago de ruta diaria: N días pagados a la tarifa vigente. */
export interface RoutePayment {
  id: string;
  routeId: string;
  daysPaid: number;
  feePerDay: number;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  method: PaymentMethod;
  observation?: string;
}

export interface RoutePaymentDraft {
  routeId: string;
  daysPaid: number;
  paymentDate: string;
  method: PaymentMethod;
  observation?: string;
}

/**
 * Reporte de días de una ruta diaria.
 * pendingDays puede ser negativo cuando hay saldo a favor (pagaron de más).
 */
export interface DailyRouteStats {
  serviceDays: number;   // días hechos (hasta hoy)
  paidDays: number;      // días pagados
  pendingDays: number;   // serviceDays - paidDays
  totalCollected: number;
}

export type StudentDraft = Omit<Student, "id" | "paid" | "paidUntil">;
export type ServiceDraft = Omit<Service, "id"> & { observations?: string };
export type ClientDraft = Omit<Client, "id" | "lastService" | "balance">;
export interface PaymentDraft {
  clientName: string;
  date: string;
  concept: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  period?: string;
  observation?: string;
  studentId?: string;
  clientId?: string;
  advance: boolean;
}

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
  paid: boolean;
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
  amountCollected: number;
}

export type DailyRouteDraft = Omit<DailyRoute, "id">;

export interface DailyRouteWithExecutions extends DailyRoute {
  executions: RouteExecution[];
  totalCollected: number;
  totalPending: number;
  totalSkipped: number;
}

export type StudentDraft = Omit<Student, "id">;
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
}

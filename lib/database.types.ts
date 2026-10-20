import { Client, DailyRoute, ExecutionStatus, Payment, PayFrequency, PaymentMethod, PaymentStatus, Route, RouteExecution, RoutePayment, Service, ServiceStatus, Student } from "./types";

/**
 * Mapa de tablas de Supabase tipado con las interfaces del dominio.
 * Las columnas de cada tabla deben coincidir con estos Row types.
 */
export interface Database {
  public: {
    Tables: {
      clients: Table<Client>;
      daily_routes: Table<DailyRoute>;
      route_executions: Table<RouteExecution>;
      route_payments: Table<RoutePayment>;
      services: Table<Service>;
      students: Table<Student>;
      payments: Table<Payment>;
      routes: Table<Route>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      service_status: ServiceStatus;
      pay_frequency: PayFrequency;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      execution_status: ExecutionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

interface Table<Row extends { id: string }> {
  Row: Row;
  Insert: Omit<Row, "id"> & { id?: string };
  Update: Partial<Omit<Row, "id">>;
  Relationships: [];
}

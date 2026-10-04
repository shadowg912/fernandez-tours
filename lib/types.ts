export type ServiceStatus = "confirmado" | "pendiente" | "completado" | "cancelado";

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

export interface Student {
  id: string;
  name: string;
  school: string;
  address: string;
  schedule: string;
  days: string[];
  monthlyFee: number;
  frequency: PayFrequency;
  paid: boolean;
  guardian: string;
  phone: string;
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

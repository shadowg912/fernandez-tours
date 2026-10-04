"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { ClientDraft, PaymentDraft, ServiceDraft, StudentDraft } from "@/lib/types";

/* ---------- Estudiantes ---------- */
export async function createStudent(d: StudentDraft) {
  await query(
    `insert into students (name, school, address, schedule, days, monthly_fee, frequency, guardian, phone, paid)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [d.name, d.school, d.address, d.schedule, d.days, d.monthlyFee, d.frequency, d.guardian, d.phone, d.paid]
  );
  revalidatePath("/transporte");
}

export async function updateStudent(id: string, d: StudentDraft) {
  await query(
    `update students set name=$1, school=$2, address=$3, schedule=$4, days=$5, monthly_fee=$6,
     frequency=$7, guardian=$8, phone=$9, paid=$10 where id=$11`,
    [d.name, d.school, d.address, d.schedule, d.days, d.monthlyFee, d.frequency, d.guardian, d.phone, d.paid, id]
  );
  revalidatePath("/transporte");
}

export async function deleteStudent(id: string) {
  await query("delete from students where id=$1", [id]);
  revalidatePath("/transporte");
}

export async function markStudentPaid(student: { id: string; name: string; monthlyFee: number }, payment: { date: string; method: string; period?: string; observation?: string }) {
  await query("update students set paid=true where id=$1", [student.id]);
  await query(
    `insert into payments (client_name, date, concept, amount, method, status, period, observation)
     values ($1,$2,$3,$4,$5,'completado',$6,$7)`,
    [
      student.name,
      payment.date,
      `Transporte estudiantil — ${payment.period ?? "periodo actual"}`,
      student.monthlyFee,
      payment.method,
      payment.period ?? null,
      payment.observation ?? null,
    ]
  );
  revalidatePath("/transporte");
  revalidatePath("/pagos");
}

export async function quickPayStudent(id: string) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await query<{ monthly_fee: number; name: string }>("select monthly_fee, name from students where id=$1", [id]);
  if (rows.length === 0) throw new Error("Estudiante no encontrado");
  const student = rows[0];
  
  await query("update students set paid=true where id=$1", [id]);
  await query(
    `insert into payments (client_name, date, concept, amount, method, status)
     values ($1,$2,$3,$4,'efectivo','completado')`,
    [student.name, today, `Transporte estudiantil — pago rápido`, student.monthly_fee]
  );
  revalidatePath("/transporte");
  revalidatePath("/pagos");
}

/* ---------- Servicios ---------- */
export async function createService(d: ServiceDraft) {
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
  await query("update services set status='completado' where id=$1", [id]);
  revalidatePath("/");
  revalidatePath("/servicios");
  revalidatePath("/agenda");
}

/* ---------- Clientes ---------- */
export async function createClient(d: ClientDraft) {
  await query(
    `insert into clients (name, phone, email, address, service_type) values ($1,$2,$3,$4,$5)`,
    [d.name, d.phone, d.email ?? null, d.address ?? null, d.serviceType]
  );
  revalidatePath("/clientes");
}

/* ---------- Pagos ---------- */
export async function createPayment(d: PaymentDraft) {
  await query(
    `insert into payments (client_name, date, concept, amount, method, status, period, observation)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [d.clientName, d.date, d.concept, d.amount, d.method, d.status, d.period ?? null, d.observation ?? null]
  );
  revalidatePath("/pagos");
  revalidatePath("/");
}

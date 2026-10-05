"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { ClientDraft, PaymentDraft, ServiceDraft, StudentDraft } from "@/lib/types";

/* ---------- Estudiantes ---------- */
export async function createStudent(d: StudentDraft) {
  await query(
    `insert into students (name, school, address, entry_time, exit_time, days, monthly_fee, frequency, guardian, phone, paid)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [d.name, d.school, d.address ?? null, d.entryTime, d.exitTime, d.days, d.monthlyFee, d.frequency, d.guardian ?? null, d.phone ?? null, d.paid]
  );
  revalidatePath("/transporte");
}

export async function updateStudent(id: string, d: StudentDraft) {
  await query(
    `update students set name=$1, school=$2, address=$3, entry_time=$4, exit_time=$5, days=$6, monthly_fee=$7,
     frequency=$8, guardian=$9, phone=$10, paid=$11 where id=$12`,
    [d.name, d.school, d.address ?? null, d.entryTime, d.exitTime, d.days, d.monthlyFee, d.frequency, d.guardian ?? null, d.phone ?? null, d.paid, id]
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

"use server";

import { getStudentPaymentsInRange } from "@/lib/queries";
import { assertSession } from "@/lib/auth";
import { Payment } from "@/lib/types";

/** Pagos completados del estudiante en el rango, para armar el recibo. */
export async function loadStudentPayments(
  studentId: string,
  from: string,
  to: string
): Promise<Payment[]> {
  await assertSession();
  return getStudentPaymentsInRange(studentId, from, to);
}

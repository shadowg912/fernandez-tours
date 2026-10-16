import { getClients, getPayments, getStudents } from "@/lib/queries";
import PagosClient from "./PagosClient";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const [payments, students, clients] = await Promise.all([getPayments(), getStudents(), getClients()]);
  return <PagosClient payments={payments} students={students} clients={clients} />;
}

import { getClients, getPayments, getServices, getStudents } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import PagosClient from "./PagosClient";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  await requireUser();
  const [payments, students, clients, services] = await Promise.all([
    getPayments(),
    getStudents(),
    getClients(),
    getServices(),
  ]);
  return <PagosClient payments={payments} students={students} clients={clients} services={services} />;
}

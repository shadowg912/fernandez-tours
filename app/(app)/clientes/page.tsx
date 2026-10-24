import { getClients, getPayments, getServices } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import ClientesClient from "./ClientesClient";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  await requireUser();
  const [clients, services, payments] = await Promise.all([getClients(), getServices(), getPayments()]);
  return <ClientesClient clients={clients} services={services} payments={payments} />;
}

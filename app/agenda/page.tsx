import { getDashboardData, getServices } from "@/lib/queries";
import AgendaClient from "./AgendaClient";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const [services, { today }] = await Promise.all([getServices(), getDashboardData()]);
  return <AgendaClient services={services} today={today} />;
}

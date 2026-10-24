import { getServices } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import ServiciosClient from "./ServiciosClient";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  await requireUser();
  const services = await getServices();
  return <ServiciosClient services={services} />;
}

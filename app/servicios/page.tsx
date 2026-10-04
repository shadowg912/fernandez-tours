import { getServices } from "@/lib/queries";
import ServiciosClient from "./ServiciosClient";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const services = await getServices();
  return <ServiciosClient services={services} />;
}

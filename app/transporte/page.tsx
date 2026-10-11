import { getStudents, getRoutes } from "@/lib/queries";
import TransporteClient from "./TransporteClient";

export const dynamic = "force-dynamic";

export default async function TransportePage() {
  const [students, routes] = await Promise.all([getStudents(), getRoutes()]);
  return <TransporteClient students={students} routes={routes} />;
}

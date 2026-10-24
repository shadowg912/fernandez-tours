import { getStudents, getRoutes } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import TransporteClient from "./TransporteClient";

export const dynamic = "force-dynamic";

export default async function TransportePage() {
  await requireUser();
  const [students, routes] = await Promise.all([getStudents(), getRoutes()]);
  return <TransporteClient students={students} routes={routes} />;
}

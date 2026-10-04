import { getStudents } from "@/lib/queries";
import TransporteClient from "./TransporteClient";

export const dynamic = "force-dynamic";

export default async function TransportePage() {
  const students = await getStudents();
  return <TransporteClient students={students} />;
}

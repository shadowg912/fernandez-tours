import { getDashboardData } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireUser();
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}

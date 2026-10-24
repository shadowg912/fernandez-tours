import { getDailyRoutes } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import RutasClient from "./RutasClient";

export const dynamic = "force-dynamic";

export default async function RutasPage() {
  await requireUser();
  const routes = await getDailyRoutes();
  return <RutasClient initialRoutes={routes} />;
}
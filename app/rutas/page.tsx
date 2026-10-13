import { getDailyRoutes } from "@/lib/queries";
import RutasClient from "./RutasClient";

export const dynamic = "force-dynamic";

export default async function RutasPage() {
  const routes = await getDailyRoutes();
  return <RutasClient initialRoutes={routes} />;
}
import { getServices, getRouteExecutionsForDateRange, getDailyRoutes } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import AgendaClient from "./AgendaClient";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  
  // Calculate date range: 1 year back to 2 years forward
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const startDateStr = startDate.toISOString().slice(0, 10);
  
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 2);
  const endDateStr = endDate.toISOString().slice(0, 10);
  
  const [services, routeExecutions, dailyRoutes] = await Promise.all([
    getServices(),
    getRouteExecutionsForDateRange(startDateStr, endDateStr),
    getDailyRoutes(),
  ]);
  
  return (
    <AgendaClient 
      services={services} 
      routeExecutions={routeExecutions}
      dailyRoutes={dailyRoutes}
      today={today} 
    />
  );
}
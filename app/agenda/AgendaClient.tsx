"use client";

import { useState, useMemo } from "react";
import { DailyRoute, RouteExecution, Service } from "@/lib/types";
import { formatDateLong, formatMoney } from "@/lib/format";
import { Button, EmptyState, StatusBadge, Card, Modal, Toast } from "@/components/ui";
import { IconChevronLeft, IconChevronRight, IconBus, IconRoute } from "@/components/icons";
import { completeService, cancelService, toggleExecutionStatus } from "@/lib/actions";

type ViewMode = "day" | "week" | "month";

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const statusLabels: Record<string, string> = {
  pendiente_confirmacion: "Por confirmar",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
  done: "Hecha",
  skipped: "No hecha",
};

const statusColors: Record<string, string> = {
  pendiente_confirmacion: "bg-yellow/15 text-yellow-700",
  confirmado: "bg-teal/15 text-dark-teal",
  completado: "bg-green/15 text-green",
  cancelado: "bg-red/15 text-red",
  done: "bg-teal/15 text-teal",
  skipped: "bg-red/15 text-red",
};

interface AgendaItem {
  id: string;
  type: "service" | "route";
  date: string;
  time: string;
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  data: Service | RouteExecution;
}

export default function AgendaClient({ 
  services, 
  routeExecutions,
  dailyRoutes,
  today 
}: { 
  services: Service[]; 
  routeExecutions: RouteExecution[];
  dailyRoutes: DailyRoute[];
  today: string;
}) {
  const [mode, setMode] = useState<ViewMode>("day");
  const [date, setDate] = useState(today);
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "services" | "routes">("all");

  // Calculate date range based on mode
  const getRange = (mode: ViewMode, dateStr: string): { start: string; end: string; label: string } => {
    const d = new Date(dateStr + "T12:00:00");
    
    if (mode === "day") {
      return { start: dateStr, end: dateStr, label: formatDateLong(d) };
    }
    
    if (mode === "week") {
      // Monday to Sunday
      const dayOfWeek = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - dayOfWeek + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().slice(0, 10),
        end: sunday.toISOString().slice(0, 10),
        label: `Semana del ${monday.getDate()} ${monthNames[monday.getMonth()]} - ${sunday.getDate()} ${monthNames[sunday.getMonth()]} ${sunday.getFullYear()}`,
      };
    }
    
    // Month
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      start: firstDay.toISOString().slice(0, 10),
      end: lastDay.toISOString().slice(0, 10),
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
    };
  };

  const { start, end, label } = getRange(mode, date);

  // Build combined items list
  const items: AgendaItem[] = useMemo(() => {
    const result: AgendaItem[] = [];
    
    // Add services (exclude pendiente_confirmacion)
    if (filter === "all" || filter === "services") {
      services
        .filter(s => s.date >= start && s.date <= end && s.status !== "pendiente_confirmacion")
        .forEach(s => {
          result.push({
            id: `svc-${s.id}`,
            type: "service",
            date: s.date,
            time: s.time,
            title: s.clientName,
            subtitle: `${s.origin} → ${s.destination}`,
            amount: s.price,
            status: s.status,
            data: s,
          });
        });
    }
    
    // Add route executions
    if (filter === "all" || filter === "routes") {
      routeExecutions
        .filter(e => e.executionDate >= start && e.executionDate <= end)
        .forEach(e => {
          const route = dailyRoutes.find(r => r.id === e.routeId);
          result.push({
            id: `route-${e.id}`,
            type: "route",
            date: e.executionDate,
            time: "",
            title: route?.name ?? "Ruta",
            subtitle: `Tarifa: ${formatMoney(route?.dailyFee ?? 0)}`,
            amount: e.status === "done" ? e.amountCollected : 0,
            status: e.status,
            data: e,
          });
        });
    }
    
    // Sort by date then time
    return result.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
  }, [services, routeExecutions, dailyRoutes, start, end, filter]);

  // Navigation
  const navigate = (direction: "prev" | "next") => {
    const d = new Date(date + "T12:00:00");
    if (mode === "day") {
      d.setDate(d.getDate() + (direction === "next" ? 1 : -1));
    } else if (mode === "week") {
      d.setDate(d.getDate() + (direction === "next" ? 7 : -7));
    } else {
      d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
    }
    setDate(d.toISOString().slice(0, 10));
  };

  // Actions
  const handleServiceAction = (serviceId: string, action: "complete" | "cancel") => {
    if (action === "complete") {
      completeService(serviceId);
      setToast("Servicio completado");
    } else {
      cancelService(serviceId);
      setToast("Servicio cancelado");
    }
    setSelectedItem(null);
  };

  const handleRouteAction = (routeId: string, executionDate: string, newStatus: "done" | "skipped") => {
    toggleExecutionStatus(routeId, executionDate, newStatus);
    setToast(newStatus === "done" ? "Ruta marcada como hecha" : "Ruta marcada como no hecha");
    setSelectedItem(null);
  };

  const selectedService = selectedItem?.type === "service" ? selectedItem.data as Service : null;
  const selectedRoute = selectedItem?.type === "route" ? selectedItem.data as RouteExecution : null;
  const selectedRouteData = selectedRoute ? dailyRoutes.find(r => r.id === selectedRoute.routeId) : null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Agenda</h1>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        {(["day", "week", "month"] as ViewMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              mode === m 
                ? "bg-teal text-white shadow-sm" 
                : "bg-white text-dark/70 border border-dark/10 hover:border-teal"
            }`}
          >
            {m === "day" ? "Día" : m === "week" ? "Semana" : "Mes"}
          </button>
        ))}
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | "services" | "routes")}
          className="rounded-xl border border-dark/15 bg-white px-4 py-2.5 text-sm focus:border-teal"
        >
          <option value="all">Todo</option>
          <option value="services">Servicios</option>
          <option value="routes">Rutas</option>
        </select>
      </div>

      {/* Date navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("prev")}>
            <IconChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold capitalize text-dark-teal">{label}</p>
            <p className="text-xs text-dark/50">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate("next")}>
            <IconChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {/* Items list */}
      {items.length === 0 ? (
        <EmptyState
          title="No hay items programados"
          message="No se encontraron servicios ni rutas para este período."
        />
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const itemDate = new Date(item.date + "T12:00:00");
            const isToday = item.date === today;
            const dayName = itemDate.toLocaleDateString("es-DO", { weekday: "short" });
            const dayNum = itemDate.getDate();
            const monthShort = monthNames[itemDate.getMonth()].slice(0, 3);
            
            // Determine status color for the indicator line
            const isCompleted = item.type === "service" 
              ? item.status === "completado" 
              : item.status === "done";
            const isCancelled = item.type === "service" 
              ? item.status === "cancelado" 
              : item.status === "skipped";
            const isPending = !isCompleted && !isCancelled;
            
            const statusLineColor = isCompleted 
              ? "border-l-4 border-l-green" 
              : isCancelled 
                ? "border-l-4 border-l-gray" 
                : isPending 
                  ? "border-l-4 border-l-red" 
                  : "border-l-4 border-l-orange";

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${statusLineColor} ${
                  item.type === "route" 
                    ? "bg-white rounded-xl shadow-sm" 
                    : "bg-white rounded-xl shadow-sm"
                } ${isToday ? "ring-2 ring-teal/30" : "border border-dark/5"}`}
              >
                <div className="p-4 flex items-center gap-3">
                  {/* Date badge */}
                  <div className="min-w-[60px] text-center">
                    <p className="text-xs text-dark/50 uppercase">{dayName}</p>
                    <p className="text-lg font-bold text-dark">{dayNum}</p>
                    <p className="text-xs text-dark/50">{monthShort}</p>
                    {isToday && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-teal text-white text-[10px] font-bold">
                        HOY
                      </span>
                    )}
                  </div>
                  
                  {/* Type icon */}
                  <div className={`p-2 rounded-lg ${item.type === "route" ? "bg-teal/10 text-teal" : "bg-gold/10 text-gold-deep"}`}>
                    {item.type === "route" ? <IconRoute className="h-5 w-5" /> : <IconBus className="h-5 w-5" />}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.title}</p>
                    <p className="text-sm text-dark/60 truncate">{item.subtitle}</p>
                    {item.time && <p className="text-xs text-dark/50">{item.time}</p>}
                  </div>
                  
                  {/* Status badge (monto eliminado para UI más limpia) */}
                  <div className="shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={selectedItem !== null} onClose={() => setSelectedItem(null)} title="Detalle">
        {selectedService && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gold/10 text-gold-deep">
                <IconBus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-lg">{selectedService.clientName}</p>
                <p className="text-sm text-dark/60">{formatDateLong(new Date(selectedService.date + "T12:00:00"))}</p>
              </div>
            </div>
            
            <div className="rounded-xl bg-white border border-dark/5 p-4 space-y-2 text-sm">
              <p><span className="font-semibold">Hora:</span> {selectedService.time}</p>
              <p><span className="font-semibold">Ruta:</span> {selectedService.origin} → {selectedService.destination}</p>
              <p><span className="font-semibold">Pasajeros:</span> {selectedService.passengers}</p>
              <p><span className="font-semibold">Precio:</span> <span className="text-gold-deep font-bold">{formatMoney(selectedService.price)}</span></p>
              <p><span className="font-semibold">Estado:</span> <StatusBadge status={selectedService.status} /></p>
            </div>
            
            {selectedService.status === "confirmado" && (
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleServiceAction(selectedService.id, "complete")}>
                  ✓ Marcar como hecho
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => handleServiceAction(selectedService.id, "cancel")}>
                  ✗ Cancelar
                </Button>
              </div>
            )}
          </div>
        )}
        
        {selectedRoute && selectedRouteData && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal/10 text-teal">
                <IconRoute className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-lg">{selectedRouteData.name}</p>
                <p className="text-sm text-dark/60">{formatDateLong(new Date(selectedRoute.executionDate + "T12:00:00"))}</p>
              </div>
            </div>
            
            <div className="rounded-xl bg-white border border-dark/5 p-4 space-y-2 text-sm">
              <p><span className="font-semibold">Tarifa:</span> <span className="text-gold-deep font-bold">{formatMoney(selectedRouteData.dailyFee)}</span></p>
              <p><span className="font-semibold">Días:</span> {selectedRouteData.daysOfWeek.join(", ")}</p>
              <p>
                <span className="font-semibold">Estado:</span>{" "}
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedRoute.status]}`}>
                  {statusLabels[selectedRoute.status]}
                </span>
              </p>
              {selectedRoute.status === "done" && (
                <p><span className="font-semibold">Cobrado:</span> <span className="text-gold-deep font-bold">{formatMoney(selectedRoute.amountCollected)}</span></p>
              )}
            </div>
            
            {selectedRoute.status === "pending" && (
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleRouteAction(selectedRoute.routeId, selectedRoute.executionDate, "done")}>
                  ✓ Marcar como hecha
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => handleRouteAction(selectedRoute.routeId, selectedRoute.executionDate, "skipped")}>
                  ✗ No se hizo
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
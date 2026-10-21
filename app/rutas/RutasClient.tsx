"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { DailyRoute, DailyRouteStats, RouteExecution, RoutePayment, RoutePaymentDraft } from "@/lib/types";
import { formatDateShort, formatMoney } from "@/lib/format";
import { DailyRouteCard, SummaryCard } from "@/components/cards";
import { Button, EmptyState, Modal, Toast } from "@/components/ui";
import { DailyRouteForm, ConfirmDialog, RoutePaymentForm } from "@/components/forms";
import { RoutePaymentReceipt, RouteReceiptData } from "@/components/receipts";
import { IconPlus, IconCopy, IconSearch } from "@/components/icons";
import { 
  createDailyRoute, 
  updateDailyRoute, 
  deleteDailyRoute, 
  toggleExecutionStatus, 
  copyDailyRouteToNextMonth, 
  getRouteExecutions,
  getGlobalTodayStats,
  createRoutePayment,
  getRouteStats,
  getRoutePayments,
  getRoutePendingDays
} from "./actions";

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const statusLabels: Record<string, string> = {
  done: "Hecha",
  pending: "Pendiente",
  skipped: "No hecha",
};

const statusColors: Record<string, string> = {
  done: "bg-teal/15 text-teal",
  pending: "bg-orange/15 text-orange",
  skipped: "bg-red/15 text-red",
};

export default function RutasClient({ 
  initialRoutes 
}: { 
  initialRoutes: DailyRoute[]; 
}) {
  const [routes, setRoutes] = useState<DailyRoute[]>(initialRoutes);
  const [selectedRoute, setSelectedRoute] = useState<DailyRoute | null>(null);
  const [executions, setExecutions] = useState<RouteExecution[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<DailyRoute | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<DailyRoute | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [globalTodayStats, setGlobalTodayStats] = useState<{ completed: number; collected: number; pending: number; skipped: number } | null>(null);
  const [routeStats, setRouteStats] = useState<Record<string, DailyRouteStats>>({});
  const [routePayments, setRoutePayments] = useState<RoutePayment[]>([]);
  const [pendingDays, setPendingDays] = useState<string[]>([]);
  const [receipt, setReceipt] = useState<RouteReceiptData | null>(null);
  const [showAll, setShowAll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sincronizar con props si cambian
  if (routes !== initialRoutes) setRoutes(initialRoutes);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Cargar stats globales de hoy y resumen por ruta al montar
  useEffect(() => {
    getGlobalTodayStats().then(setGlobalTodayStats);
    getRouteStats().then(setRouteStats);
  }, []);

  const refreshStats = () => getRouteStats().then(setRouteStats);

  const run = (fn: () => Promise<void>, message: string) => {
    startTransition(async () => {
      await fn();
      await refreshStats();
      setToast(message);
    });
  };

  const loadExecutions = async (routeId: string) => {
    const data = await getRouteExecutions(routeId);
    if (data) {
      setExecutions(data);
    }
  };

  const loadRoutePayments = async (routeId: string) => {
    const [payments, pend] = await Promise.all([
      getRoutePayments(routeId),
      getRoutePendingDays(routeId),
    ]);
    setRoutePayments(payments);
    setPendingDays(pend);
  };

  const openRoute = (route: DailyRoute) => {
    setSelectedRoute(route);
    setRoutePayments([]);
    setPendingDays([]);
    loadExecutions(route.id);
    loadRoutePayments(route.id);
  };

  const handleCreate = (draft: { name: string; dailyFee: number; daysOfWeek: string[]; generationWindowDays: number }) =>
    run(async () => {
      await createDailyRoute(draft);
      setFormOpen(false);
    }, "Ruta creada");

  const handleUpdate = (draft: { name: string; dailyFee: number; daysOfWeek: string[]; generationWindowDays: number }) => {
    if (!editingRoute) return;
    run(async () => {
      await updateDailyRoute(editingRoute.id, draft);
      setEditingRoute(null);
      if (selectedRoute?.id === editingRoute.id) {
        const data = await getRouteExecutions(editingRoute.id);
        if (data) setSelectedRoute({ ...selectedRoute });
      }
    }, "Ruta actualizada");
  };

  const handleRegenerate = () => {
    if (!selectedRoute) return;
    run(async () => {
      await updateDailyRoute(selectedRoute.id, { generationWindowDays: selectedRoute.generationWindowDays });
      loadExecutions(selectedRoute.id);
    }, "Ejecuciones regeneradas");
  };

  const handleDelete = () => {
    if (!deletingRoute) return;
    run(async () => {
      await deleteDailyRoute(deletingRoute.id);
      setDeletingRoute(null);
      if (selectedRoute?.id === deletingRoute.id) {
        setSelectedRoute(null);
      }
    }, "Ruta eliminada");
  };

  const handleCopyToNextMonth = (route?: DailyRoute) => {
    const target = route ?? selectedRoute;
    if (!target) return;
    run(async () => {
      await copyDailyRouteToNextMonth(target.id);
    }, "Ruta copiada al mes siguiente");
  };

  const handleRegisterPayment = (draft: RoutePaymentDraft) =>
    run(async () => {
      await createRoutePayment(draft);
      setPaymentFormOpen(false);
      if (selectedRoute?.id === draft.routeId) {
        await loadRoutePayments(draft.routeId);
      }
    }, "Pago de ruta registrado");

  const handleTodayAction = (status: "done" | "skipped") => {
    if (!selectedRoute) return;
    const today = new Date().toISOString().slice(0, 10);
    run(async () => {
      await toggleExecutionStatus(selectedRoute.id, today, status);
      await Promise.all([loadExecutions(selectedRoute.id), loadRoutePayments(selectedRoute.id)]);
    }, status === "done" ? "Ruta marcada como hecha" : "Ruta marcada como no hecha");
  };

  const handleStatusChange = (executionDate: string, newStatus: RouteExecution["status"]) => {
    if (!selectedRoute) return;
    run(async () => {
      await toggleExecutionStatus(selectedRoute.id, executionDate, newStatus);
      await Promise.all([loadExecutions(selectedRoute.id), loadRoutePayments(selectedRoute.id)]);
    }, "Estado actualizado");
  };

  // Group executions by month (ascending order)
  const monthGroups = useMemo(() => {
    if (!selectedRoute) return [];
    
    let filtered = [...executions];
    
    // Filter by showAll (window vs all)
    if (!showAll) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + (selectedRoute.generationWindowDays ?? 60));
      filtered = filtered.filter(e => {
        const d = new Date(e.executionDate);
        return d >= today && d <= endDate;
      });
    }
    
    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.executionDate.includes(q) ||
        statusLabels[e.status]?.toLowerCase().includes(q)
      );
    }
    
    // Sort ascending by date
    filtered.sort((a, b) => a.executionDate.localeCompare(b.executionDate));
    
    // Group by month
    const groups: Record<string, RouteExecution[]> = {};
    filtered.forEach(e => {
      const monthKey = e.executionDate.slice(0, 7);
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(e);
    });
    
    // Convert to array and sort ascending
    return Object.entries(groups)
      .map(([month, items]) => ({ month, items }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [executions, selectedRoute, showAll, searchQuery]);

  const getMonthLabel = (monthKey: string) => {
    const [y, m] = monthKey.split("-").map(Number);
    return `${monthNames[m - 1]} ${y}`;
  };

  const totalPendingDays = routes.reduce(
    (sum, r) => sum + Math.max(0, routeStats[r.id]?.pendingDays ?? 0),
    0
  );
  const totalPendingAmount = routes.reduce((sum, r) => {
    const pending = Math.max(0, routeStats[r.id]?.pendingDays ?? 0);
    return sum + pending * r.dailyFee;
  }, 0);
  const totalCollected = routes.reduce(
    (sum, r) => sum + (routeStats[r.id]?.totalCollected ?? 0),
    0
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Rutas diarias</h1>
          <p className="text-sm text-dark/60">Gestión de cobro por día operativo</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="gold" onClick={() => setPaymentFormOpen(true)}>
            <span className="text-base leading-none">RD$</span>
            <span className="hidden sm:inline">Registrar pago de ruta</span>
            <span className="sm:hidden">Pago de ruta</span>
          </Button>
          <Button onClick={() => { setEditingRoute(null); setFormOpen(true); }}>
            <IconPlus className="h-5 w-5" /> <span className="hidden sm:inline">Nueva ruta</span><span className="sm:hidden">Nueva</span>
          </Button>
        </div>
      </div>

      {/* Resumen global de HOY */}
      {globalTodayStats && (
        <section className="mb-5">
          <h2 className="mb-3 text-lg font-bold">Resumen de hoy</h2>
          <div className="flex flex-wrap gap-3">
            <SummaryCard value={String(globalTodayStats.completed)} label="Completadas hoy" />
            <SummaryCard value={formatMoney(globalTodayStats.collected)} label="Cobrado hoy" accent />
            <SummaryCard value={String(globalTodayStats.pending)} label="Pendientes hoy" />
            <SummaryCard value={String(globalTodayStats.skipped)} label="No hechas hoy" />
          </div>
        </section>
      )}

      {/* Reporte de días pendientes de pago */}
      {routes.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-3 text-lg font-bold">Días pendientes de pago</h2>
          <div className="flex flex-wrap gap-3">
            <SummaryCard
              value={String(totalPendingDays)}
              label="Días por pagar"
              accent={totalPendingDays > 0}
              hint="Suma de todas las rutas"
            />
            <SummaryCard
              value={formatMoney(totalPendingAmount)}
              label="Monto pendiente"
              hint="A la tarifa actual de cada ruta"
            />
            <SummaryCard value={formatMoney(totalCollected)} label="Total cobrado" hint="Pagos registrados" />
          </div>
        </section>
      )}

      {/* Lista de rutas */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Rutas registradas</h2>
        {routes.length === 0 ? (
          <EmptyState
            title="No hay rutas"
            message="Crea tu primera ruta diaria con el botón de arriba."
          />
        ) : (
          <div className="space-y-3">
            {routes.map((route) => (
              <DailyRouteCard
                key={route.id}
                route={route}
                stats={routeStats[route.id] ?? null}
                onClick={() => openRoute(route)}
                onEdit={() => setEditingRoute(route)}
                onDelete={() => setDeletingRoute(route)}
                onCopyToNextMonth={() => handleCopyToNextMonth(route)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Detalle de ruta seleccionada */}
      {selectedRoute && (
        <Modal open={true} onClose={() => setSelectedRoute(null)} title="Detalle de ruta">
          <div className="space-y-4">
            {/* Acciones de hoy */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => handleTodayAction("done")}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Se hizo hoy
              </Button>
              <Button variant="secondary" onClick={() => handleTodayAction("skipped")}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                No se hizo
              </Button>
              <Button variant="secondary" onClick={() => setEditingRoute(selectedRoute)}>
                Editar
              </Button>
              <Button variant="secondary" onClick={handleRegenerate}>
                <IconCopy className="h-4 w-4" /> Regenerar
              </Button>
              <Button variant="secondary" onClick={() => handleCopyToNextMonth(selectedRoute)}>
                <IconCopy className="h-4 w-4" /> Copiar mes
              </Button>
            </div>

            {/* Reporte de días y pagos de esta ruta */}
            <div className="rounded-xl border border-dark/10 bg-white p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-dark-teal">
                  {routeStats[selectedRoute.id]?.serviceDays ?? 0} días hechos
                </span>
                <span className="inline-flex items-center rounded-full bg-dark/8 px-2.5 py-1 text-xs font-semibold text-dark/70">
                  {routeStats[selectedRoute.id]?.paidDays ?? 0} días pagados
                </span>
                {(routeStats[selectedRoute.id]?.pendingDays ?? 0) > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-orange/15 px-2.5 py-1 text-xs font-semibold text-orange">
                    {routeStats[selectedRoute.id]?.pendingDays} pendientes de pago
                  </span>
                ) : (routeStats[selectedRoute.id]?.pendingDays ?? 0) < 0 ? (
                  <span className="inline-flex items-center rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-deep">
                    {Math.abs(routeStats[selectedRoute.id]?.pendingDays ?? 0)} días prepagados
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green/15 px-2.5 py-1 text-xs font-semibold text-green">
                    Al día
                  </span>
                )}
              </div>

              {pendingDays.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-dark/80">
                    Días pendientes de pago{" "}
                    <span className="font-normal text-dark/50">({pendingDays.length})</span>
                  </p>
                  <p className="text-xs text-dark/50">Se pagan primero las fechas más antiguas.</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pendingDays.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center rounded-lg bg-orange/10 px-2 py-1 text-xs font-medium text-orange"
                      >
                        {formatDateShort(d)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {routePayments.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-dark/80">Pagos registrados</p>
                  <div className="mt-2 divide-y divide-dark/5">
                    {routePayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {p.daysPaid} día{p.daysPaid === 1 ? "" : "s"} · {formatMoney(p.feePerDay)}/día
                          </p>
                          <p className="text-xs text-dark/50">
                            {formatDateShort(p.paymentDate)} ·{" "}
                            {p.method === "efectivo" ? "Efectivo" : p.method === "transferencia" ? "Transferencia" : "Tarjeta"}
                            {p.observation ? ` · ${p.observation}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReceipt({
                            id: p.id,
                            routeName: selectedRoute.name,
                            daysPaid: p.daysPaid,
                            feePerDay: p.feePerDay,
                            amount: p.amount,
                            paymentDate: p.paymentDate,
                            method: p.method,
                            ...(p.observation ? { observation: p.observation } : {}),
                          })}
                          className="shrink-0 rounded-lg border border-dark/15 bg-white px-3 py-2 text-xs font-semibold text-dark transition-colors hover:border-teal hover:text-dark-teal"
                        >
                          Ver recibo
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Búsqueda */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
                <input
                  type="text"
                  placeholder="Buscar por fecha..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-dark/15 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-teal"
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="h-4 w-4 accent-teal"
                />
                Mostrar todas
              </label>
            </div>

            {/* Lista de fechas por mes - scroll continuo sin paginación */}
            <div className="space-y-4">
              {monthGroups.length === 0 ? (
                <EmptyState
                  title="No hay fechas"
                  message="No se encontraron fechas con los filtros seleccionados."
                />
              ) : (
                monthGroups.map((group) => (
                  <div key={group.month} className="rounded-xl border border-dark/10 bg-white overflow-hidden">
                    <div className="px-4 py-3 bg-dark/5 border-b border-dark/10">
                      <h3 className="font-bold text-dark-teal">
                        {getMonthLabel(group.month)}
                        <span className="ml-2 text-sm font-normal text-dark/50">
                          ({group.items.length} fecha{group.items.length !== 1 ? "s" : ""})
                        </span>
                      </h3>
                    </div>
                    <div className="divide-y divide-dark/5">
                      {group.items.map((execution) => {
                        const date = new Date(execution.executionDate + "T12:00:00");
                        const isToday = new Date().toISOString().slice(0, 10) === execution.executionDate;
                        const dayName = date.toLocaleDateString("es-DO", { weekday: "short" });
                        const dayNum = date.getDate();
                        const monthIdx = date.getMonth();
                        const monthShort = monthIdx >= 0 && monthIdx < 12 ? monthNames[monthIdx].slice(0, 3) : "";
                        
                        return (
                          <div key={execution.id} className={`flex items-center gap-3 px-4 py-3 ${isToday ? "bg-teal/5" : ""}`}>
                            {/* Fecha */}
                            <div className="min-w-[100px]">
                              <p className="font-semibold text-dark capitalize">
                                {dayName} {dayNum} {monthShort}
                              </p>
                              {isToday && (
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-teal text-white text-[10px] font-bold">
                                  HOY
                                </span>
                              )}
                            </div>
                            
                            {/* Estado */}
                            <div className="flex-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[execution.status]}`}>
                                {statusLabels[execution.status]}
                              </span>
                            </div>
                            
                            {/* Acciones */}
                            <div className="flex gap-1.5">
                              {execution.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(execution.executionDate, "done")}
                                    className="px-3 py-1.5 text-xs font-medium bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors"
                                  >
                                    ✓ Hecha
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(execution.executionDate, "skipped")}
                                    className="px-3 py-1.5 text-xs font-medium bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors"
                                  >
                                    ✗ No
                                  </button>
                                </>
                              )}
                              {execution.status === "done" && (
                                <span className="text-xs text-dark/50">✓ Completada</span>
                              )}
                              {execution.status === "skipped" && (
                                <span className="text-xs text-dark/50">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Formularios */}
      <DailyRouteForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleCreate} />
      <DailyRouteForm open={editingRoute !== null} onClose={() => setEditingRoute(null)} onSaved={handleUpdate} initial={editingRoute} />
      <RoutePaymentForm
        open={paymentFormOpen}
        onClose={() => setPaymentFormOpen(false)}
        onSaved={handleRegisterPayment}
        routes={routes}
      />

      <ConfirmDialog
        open={deletingRoute !== null}
        onClose={() => setDeletingRoute(null)}
        onConfirm={handleDelete}
        loading={pending}
        title="Eliminar ruta"
        message={`¿Eliminar la ruta "${deletingRoute?.name}"? Se borrarán todas sus ejecuciones.`}
      />

      <RoutePaymentReceipt data={receipt} onClose={() => setReceipt(null)} />

      <Toast message={toast} />
    </div>
  );
}
"use client";

import { useEffect, useState, useTransition } from "react";
import { Route, Student, StudentDraft } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { createRoute, updateRoute, createStudent, deleteStudent, markStudentPaid, updateStudent, quickPayStudent } from "@/lib/actions";
import { StudentCard, SummaryCard } from "@/components/cards";
import { Avatar, Button, Chip, EmptyState, Modal, Toast } from "@/components/ui";
import { ConfirmDialog, PaymentForm, RouteForm, StudentForm } from "@/components/forms";
import { IconCheck, IconPhone, IconPlus, IconRoute } from "@/components/icons";

type Filter = "todos" | "pagado" | "pendiente" | "mensual" | "quincenal" | "semanal";

const filters: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pagado", label: "Pagados" },
  { value: "pendiente", label: "Pendientes" },
  { value: "mensual", label: "Mensual" },
  { value: "quincenal", label: "Quincenal" },
  { value: "semanal", label: "Semanal" },
];

const frequencyLabel = { mensual: "Mensual", quincenal: "Quincenal", semanal: "Semanal" } as const;

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function TransporteClient({ 
  students: initialStudents, 
  routes: initialRoutes 
}: { 
  students: Student[]; 
  routes: Route[];
}) {
  const [filter, setFilter] = useState<Filter>("pendiente");
  const [selectedRouteId, setSelectedRouteId] = useState<string>(""); // "" = todas
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [routeFormOpen, setRouteFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [payStudent, setPayStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [students, setStudents] = useState(initialStudents);
  const [routes, setRoutes] = useState(initialRoutes);

  // Sincronizar con props si cambian (evita setState directo en effect warning)
  if (students !== initialStudents) setStudents(initialStudents);
  if (routes !== initialRoutes) setRoutes(initialRoutes);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const pendingStudents = students.filter((s) => !s.paid);
  const total = students.reduce((sum, s) => sum + s.monthlyFee, 0);
  const collected = students.filter((s) => s.paid).reduce((sum, s) => sum + s.monthlyFee, 0);

  const filtered = students.filter((s) => {
    // Filtro por ruta
    if (selectedRouteId && s.routeId !== selectedRouteId) return false;
    // Filtro por estado/frecuencia
    if (filter === "todos") return true;
    if (filter === "pagado") return s.paid;
    if (filter === "pendiente") return !s.paid;
    return s.frequency === filter;
  });

  const selected = students.find((s) => s.id === selectedId) ?? null;
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  const run = (fn: () => Promise<void>, message: string) => {
    startTransition(async () => {
      await fn();
      setToast(message);
    });
  };

  const onCreate = (draft: StudentDraft) =>
    run(async () => {
      await createStudent(draft);
      setFormOpen(false);
    }, "Estudiante agregado");

  const onUpdate = (draft: StudentDraft) => {
    if (!editing) return;
    run(async () => {
      await updateStudent(editing.id, draft);
      setEditing(null);
    }, "Cambios guardados");
  };

  const onDelete = () => {
    if (!deleting) return;
    run(async () => {
      await deleteStudent(deleting.id);
      setDeleting(null);
      setSelectedId(null);
    }, "Estudiante eliminado");
  };

  const onQuickPay = (student: Student) =>
    run(async () => {
      await quickPayStudent(student.id);
    }, `Pago rápido registrado para ${student.name}`);

  const onCreateRoute = (draft: { name: string; description?: string; color: string }) =>
    run(async () => {
      await createRoute(draft);
      setRouteFormOpen(false);
      setEditingRoute(null);
    }, "Ruta creada");

  const onUpdateRoute = (draft: { name: string; description?: string; color: string }) => {
    if (!editingRoute) return;
    run(async () => {
      await updateRoute(editingRoute.id, draft);
      setEditingRoute(null);
    }, "Ruta actualizada");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Transporte estudiantil</h1>
          <p className="text-sm text-dark/60">Gestionado en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setRouteFormOpen(true)}>
            <IconRoute className="h-5 w-5" /> <span className="hidden sm:inline">Nueva ruta</span><span className="sm:hidden">Ruta</span>
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <IconPlus className="h-5 w-5" /> <span className="hidden sm:inline">Nuevo estudiante</span><span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      <section className="flex flex-wrap gap-3">
        <SummaryCard value={String(students.length)} label="Estudiantes" />
        <SummaryCard value={formatMoney(collected)} label="Cobrado" />
        <SummaryCard value={formatMoney(total - collected)} label="Pendiente" accent />
      </section>

      {/* Selector de ruta + Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Dropdown de ruta - full width en móvil, auto en desktop */}
        <div className="w-full sm:w-auto">
          <label className="sr-only">Seleccionar ruta</label>
          <div className="relative">
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="appearance-none w-full rounded-xl border border-dark/15 bg-white px-4 py-3 pr-10 text-base sm:text-sm focus:border-teal focus:ring-2 focus:ring-teal/20 cursor-pointer transition-all hover:border-teal/50 min-h-[48px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='1.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px',
              }}
            >
              <option value="">Todas las rutas</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros - scroll horizontal en móvil, inline en desktop */}
        <div className="w-full sm:w-auto flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all min-h-[44px] ${
                filter === f.value 
                  ? "bg-teal text-white shadow-sm" 
                  : "bg-white text-dark/70 border border-dark/10 hover:border-teal hover:bg-teal/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {pendingStudents.length > 0 && (filter === "todos" || filter === "pendiente") && selectedRouteId === "" && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Pagos pendientes</h2>
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {pendingStudents.map((s) => (
              <StudentCard 
                key={s.id} 
                student={s} 
                onClick={() => setSelectedId(s.id)}
                onQuickPay={() => onQuickPay(s)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">
          {selectedRouteId ? selectedRoute?.name : filter === "todos" ? "Todos los estudiantes" : filters.find((f) => f.value === filter)?.label}
        </h2>
        {filtered.length === 0 ? (
          <EmptyState
            title="No hay estudiantes"
            message={
              selectedRouteId
                ? `No hay estudiantes en la ruta "${selectedRoute?.name}".`
                : filter === "todos"
                ? "Agrega tu primer estudiante con el botón de arriba."
                : "Ningún estudiante coincide con este filtro."
            }
          />
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3 md:space-y-0">
            {filtered.map((s) => (
              <StudentCard 
                key={s.id} 
                student={s} 
                onClick={() => setSelectedId(s.id)}
                onQuickPay={() => onQuickPay(s)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Crear estudiante */}
      <StudentForm 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        onSaved={onCreate} 
        routes={routes}
      />

      {/* Editar estudiante */}
      <StudentForm 
        open={editing !== null} 
        onClose={() => setEditing(null)} 
        onSaved={onUpdate} 
        initial={editing}
        routes={routes}
      />

      {/* Eliminar estudiante */}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        loading={pending}
        title="Eliminar estudiante"
        message={`¿Eliminar a ${deleting?.name ?? ""}? Esta acción no se puede deshacer.`}
      />

      {/* Pagar */}
      <PaymentForm
        open={payStudent !== null}
        onClose={() => setPayStudent(null)}
        studentName={payStudent?.name}
        defaultAmount={payStudent?.monthlyFee}
        onSaved={(p) => {
          if (!payStudent) return;
          run(async () => {
            await markStudentPaid(
              { id: payStudent.id, name: payStudent.name, monthlyFee: p.amount || payStudent.monthlyFee },
              { date: p.date, method: p.method, period: p.period, observation: p.observation }
            );
            setPayStudent(null);
            setSelectedId(null);
          }, `Pago registrado para ${payStudent.name}`);
        }}
      />

      {/* Crear/Editar ruta */}
      <RouteForm
        open={routeFormOpen || editingRoute !== null}
        onClose={() => { setRouteFormOpen(false); setEditingRoute(null); }}
        onSaved={editingRoute ? onUpdateRoute : onCreateRoute}
        initial={editingRoute}
      />

      {/* Detalle estudiante */}
      <Modal open={selected !== null} onClose={() => setSelectedId(null)} title="Detalle del estudiante">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} size="lg" />
              <div>
                <p className="text-lg font-bold leading-tight">{selected.name}</p>
                {selected.school && <p className="text-sm text-dark/60">{selected.school}</p>}
                {selected.route && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium" style={{ color: selected.route.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selected.route.color }}></span>
                    {selected.route.name}
                  </span>
                )}
                {selected.paid ? <Chip tone="teal">Pagado</Chip> : <Chip tone="danger">Pendiente</Chip>}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-dark/5 p-4 text-sm space-y-1.5">
              <p><span className="font-semibold">Dirección:</span> {selected.address || "—"}</p>
              <p><span className="font-semibold">Entrada:</span> {formatTime12h(selected.entryTime)}</p>
              <p><span className="font-semibold">Salida:</span> {formatTime12h(selected.exitTime)}</p>
              <p><span className="font-semibold">Días:</span> {selected.days.join(" • ") || "—"}</p>
              <p><span className="font-semibold">Frecuencia:</span> {frequencyLabel[selected.frequency]}</p>
              <p>
                <span className="font-semibold">Tarifa:</span>{" "}
                <span className="text-gold-deep font-bold">{formatMoney(selected.monthlyFee)}</span>
              </p>
              <p><span className="font-semibold">Representante:</span> {selected.guardian || "—"}</p>
              <p className="flex items-center gap-1.5">
                <IconPhone className="h-4 w-4 text-dark/40" /> {selected.phone || "—"}
              </p>
            </div>

            {!selected.paid && (
              <Button className="w-full" onClick={() => { setSelectedId(null); setPayStudent(selected); }}>
                <IconCheck className="h-5 w-5" /> Registrar pago
              </Button>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setSelectedId(null); setEditing(selected); }}>
                Editar
              </Button>
              <button
                onClick={() => setDeleting(selected)}
                className="flex-1 rounded-xl border border-orange/40 bg-orange/10 px-4 py-3 text-sm font-bold text-orange transition-all hover:bg-orange/20 active:scale-[.98]"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
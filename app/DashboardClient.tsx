"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { DashboardData } from "@/lib/queries";
import { completeService } from "@/lib/actions";
import { Service } from "@/lib/types";
import { formatDateLong, formatDateShort, formatMoney } from "@/lib/format";
import { SummaryCard, ServiceCard } from "@/components/cards";
import { Avatar, Button, Card, EmptyState, Modal, StatusBadge, Toast } from "@/components/ui";
import { IconBell, IconCalendar, IconChevronRight, IconCheck, IconUsers } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";

type DetailView = "today" | "completed" | "upcoming" | "students";

const detailTitles: Record<DetailView, string> = {
  today: "Servicios de hoy",
  completed: "Servicios realizados",
  upcoming: "Próximos servicios",
  students: "Estudiantes con pago pendiente",
};

/* Fila compacta de servicio para los modales de detalle */
function ServiceRow({ service, onClick }: { service: Service; onClick?: () => void }) {
  const inner = (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{service.clientName}</p>
        <p className="truncate text-xs text-dark/60">
          {service.origin} → {service.destination}
        </p>
        <p className="text-xs text-dark/50">
          {formatDateShort(service.date)} · {service.time}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-gold-deep">{formatMoney(service.price)}</p>
        <div className="mt-1">
          <StatusBadge status={service.status} />
        </div>
      </div>
    </div>
  );

  const base = "w-full rounded-xl border border-dark/5 bg-white p-3 text-left transition-colors";
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} hover:border-teal/40 hover:shadow-sm`}>
        {inner}
      </button>
    );
  }
  return <div className={base}>{inner}</div>;
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [selected, setSelected] = useState<Service | null>(null);
  const [detail, setDetail] = useState<DetailView | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const complete = (id: string) => {
    startTransition(async () => {
      await completeService(id);
      setSelected(null);
      setToast("Servicio marcado como completado");
    });
  };

  const weekTotal = data.completedWeek.reduce((sum, s) => sum + s.price, 0);
  const monthTotal = data.completedMonth.reduce((sum, s) => sum + s.price, 0);
  const studentsPendingAmount = data.pendingStudents.reduce((sum, s) => sum + s.monthlyFee, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between rounded-3xl bg-dark px-5 py-6 text-cream">
        <div>
          <p className="text-sm text-cream/70">Buenos días 👋</p>
          <h1 className="text-xl font-bold text-light-gold">Fernández Tours</h1>
          <p className="mt-1 text-xs capitalize text-cream/70">{formatDateLong(new Date(data.today + "T12:00:00"))}</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle className="bg-white/10 text-cream hover:bg-white/20" />
          <button aria-label="Notificaciones" className="relative rounded-full bg-white/10 p-2.5 hover:bg-white/20 transition-colors">
            <IconBell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange" />
          </button>
          <Avatar name="Alison Fernández" />
        </div>
      </header>

      {/* Accesos rápidos */}
      <section className="grid grid-cols-2 gap-3">
        <Link href="/agenda">
          <Card className="group flex items-center gap-3 p-4 hover:border-teal/40 hover:shadow-md transition-all">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal/10 text-dark-teal transition-colors group-hover:bg-teal group-hover:text-white">
              <IconCalendar className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">Agenda</p>
              <p className="text-xs text-dark/50 truncate">Servicios del día</p>
            </div>
            <IconChevronRight className="h-5 w-5 shrink-0 text-dark/30 transition-transform group-hover:translate-x-0.5 group-hover:text-teal" />
          </Card>
        </Link>
        <Link href="/transporte">
          <Card className="group flex items-center gap-3 p-4 hover:border-gold/50 hover:shadow-md transition-all">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-white">
              <IconUsers className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">Estudiantes</p>
              <p className="text-xs text-dark/50 truncate">Transporte escolar</p>
            </div>
            <IconChevronRight className="h-5 w-5 shrink-0 text-dark/30 transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
          </Card>
        </Link>
      </section>

      {/* Resumen: cada tarjeta abre su detalle */}
      <section className="flex flex-wrap gap-3">
        <SummaryCard
          value={String(data.todayServices.length)}
          label="Servicios hoy"
          hint="Toque para más detalles"
          onClick={() => setDetail("today")}
        />
        <SummaryCard
          value={String(data.completedMonth.length)}
          label="Servicios realizados"
          hint="Toque para más detalles"
          onClick={() => setDetail("completed")}
        />
        <SummaryCard
          value={String(data.upcomingMonth.length)}
          label="Próximos servicios"
          hint="Toque para más detalles"
          onClick={() => setDetail("upcoming")}
        />
        <SummaryCard
          value={String(data.pendingStudents.length)}
          label="Estudiantes por pagar"
          accent
          hint="Toque para más detalles"
          onClick={() => setDetail("students")}
        />
      </section>

      {/* Servicios de hoy */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Servicios de hoy</h2>
          <Link href="/servicios" className="flex items-center gap-1 text-sm font-semibold text-dark-teal hover:text-teal">
            Ver todos <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {data.todayServices.length === 0 ? (
          <EmptyState title="No tienes servicios programados para este día." />
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {data.todayServices.map((s) => (
              <ServiceCard key={s.id} service={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        )}
      </section>

      {/* Modal de detalle de reporte */}
      <Modal open={detail !== null && selected === null} onClose={() => setDetail(null)} title={detail ? detailTitles[detail] : ""}>
        {detail === "today" &&
          (data.todayServices.length === 0 ? (
            <EmptyState title="No tienes servicios programados para hoy." />
          ) : (
            <div className="space-y-2">
              {data.todayServices.map((s) => (
                <ServiceRow key={s.id} service={s} onClick={() => setSelected(s)} />
              ))}
            </div>
          ))}

        {detail === "completed" &&
          (data.completedMonth.length === 0 ? (
            <EmptyState title="Aún no hay servicios completados este mes." />
          ) : (
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">Esta semana</h3>
                  <span className="text-sm text-dark/60">
                    {data.completedWeek.length} · {formatMoney(weekTotal)}
                  </span>
                </div>
                {data.completedWeek.length === 0 ? (
                  <p className="text-sm text-dark/50">Sin servicios completados esta semana.</p>
                ) : (
                  <div className="space-y-2">
                    {data.completedWeek.map((s) => (
                      <ServiceRow key={s.id} service={s} />
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-dark/10 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">Este mes</h3>
                  <span className="text-sm text-dark/60">
                    {data.completedMonth.length} · {formatMoney(monthTotal)}
                  </span>
                </div>
                <div className="space-y-2">
                  {data.completedMonth.map((s) => (
                    <ServiceRow key={s.id} service={s} />
                  ))}
                </div>
              </div>
            </div>
          ))}

        {detail === "upcoming" &&
          (data.upcomingMonth.length === 0 ? (
            <EmptyState title="No hay servicios confirmados próximos este mes." />
          ) : (
            <div className="space-y-2">
              {data.upcomingMonth.map((s) => (
                <ServiceRow key={s.id} service={s} onClick={() => setSelected(s)} />
              ))}
            </div>
          ))}

        {detail === "students" &&
          (data.pendingStudents.length === 0 ? (
            <EmptyState title="Todos los estudiantes están al día." />
          ) : (
            <div className="space-y-2">
              {data.pendingStudents.map((st) => (
                <div key={st.id} className="w-full rounded-xl border border-dark/5 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{st.name}</p>
                      <p className="truncate text-xs text-dark/50">{st.school ?? st.address ?? "—"}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-orange">{formatMoney(st.monthlyFee)}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-orange/10 px-3 py-2 text-sm">
                <span className="font-semibold text-dark/70">Total pendiente</span>
                <span className="font-bold text-orange">{formatMoney(studentsPendingAmount)}</span>
              </div>
            </div>
          ))}
      </Modal>

      {/* Detalle del servicio */}
      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Detalle del servicio">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-dark-teal">{selected.time}</p>
              <StatusBadge status={selected.status} />
            </div>
            <div className="rounded-2xl bg-white p-4 space-y-2 text-sm border border-dark/5">
              <p><span className="font-semibold">Cliente:</span> {selected.clientName}</p>
              <p><span className="font-semibold">Fecha:</span> {formatDateShort(selected.date)}</p>
              <p><span className="font-semibold">Ruta:</span> {selected.origin} → {selected.destination}</p>
              <p><span className="font-semibold">Pasajeros:</span> {selected.passengers}</p>
              <p><span className="font-semibold">Precio:</span> <span className="text-gold-deep font-bold">{formatMoney(selected.price)}</span></p>
            </div>
            {selected.status !== "completado" && selected.status !== "cancelado" && (
              <Button className="w-full" onClick={() => complete(selected.id)} disabled={pending}>
                <IconCheck className="h-5 w-5" /> {pending ? "Guardando…" : "Marcar como completado"}
              </Button>
            )}
            <Button variant="ghost" className="w-full" onClick={() => setSelected(null)}>
              Cerrar
            </Button>
          </div>
        )}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}

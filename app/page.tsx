"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { services as initialServices } from "@/lib/data";
import { Service } from "@/lib/types";
import { formatDateLong, formatMoney } from "@/lib/format";
import { SummaryCard, ServiceCard } from "@/components/cards";
import { Avatar, Button, Card, Modal, SkeletonCard, StatusBadge, Toast } from "@/components/ui";
import { IconBell, IconCalendar, IconChevronRight, IconCheck, IconUsers } from "@/components/icons";

const TODAY = "2026-09-24";

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Service | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const todayServices = services.filter((s) => s.date === TODAY);
  const upcoming = services.filter((s) => s.date > TODAY).length;
  const pendingMoney = services
    .filter((s) => s.status === "pendiente")
    .reduce((sum, s) => sum + s.price, 0);

  const completeService = (id: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: "completado" } : s)));
    setSelected(null);
    setToast("Servicio marcado como completado");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between rounded-3xl bg-dark px-5 py-6 text-cream">
        <div>
          <p className="text-sm text-cream/70">Buenos días 👋</p>
          <h1 className="text-xl font-bold text-light-gold">Fernández Tours</h1>
          <p className="mt-1 text-xs capitalize text-cream/70">{formatDateLong(new Date(TODAY + "T12:00:00"))}</p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Resumen */}
      <section className="flex flex-wrap gap-3">
        <SummaryCard value={String(todayServices.length)} label="Servicios hoy" />
        <SummaryCard value={String(upcoming)} label="Próximos servicios" />
        <SummaryCard value="42" label="Clientes" />
        <SummaryCard value={formatMoney(pendingMoney)} label="Pendiente" accent />
      </section>

      {/* Servicios de hoy */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Servicios de hoy</h2>
          <Link href="/servicios" className="flex items-center gap-1 text-sm font-semibold text-dark-teal hover:text-teal">
            Ver todos <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {todayServices.map((s) => (
              <ServiceCard key={s.id} service={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        )}
      </section>

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
              <p><span className="font-semibold">Ruta:</span> {selected.origin} → {selected.destination}</p>
              <p><span className="font-semibold">Pasajeros:</span> {selected.passengers}</p>
              <p><span className="font-semibold">Precio:</span> <span className="text-gold-deep font-bold">{formatMoney(selected.price)}</span></p>
            </div>
            {selected.status !== "completado" && selected.status !== "cancelado" && (
              <Button className="w-full" onClick={() => completeService(selected.id)}>
                <IconCheck className="h-5 w-5" /> Marcar como completado
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

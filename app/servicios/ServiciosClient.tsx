"use client";

import { useEffect, useState, useTransition } from "react";
import { Service, ServiceStatus } from "@/lib/types";
import { createService } from "@/lib/actions";
import { ServiceCard } from "@/components/cards";
import { Button, EmptyState, Modal, StatusBadge, Toast } from "@/components/ui";
import { ServiceForm } from "@/components/forms";
import { formatDateLong, formatMoney } from "@/lib/format";
import { IconPlus } from "@/components/icons";

type Filter = "todos" | ServiceStatus;

const filters: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "confirmado", label: "Confirmados" },
  { value: "pendiente", label: "Pendientes" },
  { value: "completado", label: "Completados" },
  { value: "cancelado", label: "Cancelados" },
];

export default function ServiciosClient({ services }: { services: Service[] }) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [date, setDate] = useState("");
  const [showAllDates, setShowAllDates] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const list = services
    .filter((s) => (filter === "todos" ? true : s.status === filter))
    .filter((s) => (showAllDates ? true : s.date === date));

  const selectedService = services.find((s) => s.id === selected) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <Button onClick={() => setFormOpen(true)}>
          <IconPlus className="h-5 w-5" /> Nuevo servicio
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.value ? "bg-teal text-white" : "bg-white text-dark/70 border border-dark/10 hover:border-teal"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Fecha */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={showAllDates}
            onChange={(e) => setShowAllDates(e.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          Todas las fechas
        </label>
        {!showAllDates && (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-dark/15 bg-white px-3 py-2 text-sm focus:border-teal"
          />
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No hay servicios"
          message={showAllDates ? "No hay servicios con este filtro." : "No tienes servicios programados para este día."}
        />
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3 md:space-y-0">
          {list.map((s) => (
            <ServiceCard key={s.id} service={s} onClick={() => setSelected(s.id)} />
          ))}
        </div>
      )}

      <ServiceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(draft) => {
          startTransition(async () => {
            await createService(draft);
            setFormOpen(false);
            setToast("Servicio creado");
          });
        }}
      />

      <Modal open={selectedService !== null} onClose={() => setSelected(null)} title="Detalle del servicio">
        {selectedService && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-dark-teal">{selectedService.time}</p>
              <StatusBadge status={selectedService.status} />
            </div>
            <div className="rounded-2xl bg-white p-4 space-y-2 text-sm border border-dark/5">
              <p><span className="font-semibold">Cliente:</span> {selectedService.clientName}</p>
              <p className="capitalize"><span className="font-semibold">Fecha:</span> {formatDateLong(new Date(selectedService.date + "T12:00:00"))}</p>
              <p><span className="font-semibold">Ruta:</span> {selectedService.origin} → {selectedService.destination}</p>
              <p><span className="font-semibold">Pasajeros:</span> {selectedService.passengers}</p>
              <p><span className="font-semibold">Precio:</span> <span className="text-gold-deep font-bold">{formatMoney(selectedService.price)}</span></p>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setSelected(null)}>Cerrar</Button>
          </div>
        )}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}

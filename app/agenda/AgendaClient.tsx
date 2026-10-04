"use client";

import { useState } from "react";
import { Service } from "@/lib/types";
import { formatDateLong, formatMoney } from "@/lib/format";
import { EmptyState, StatusBadge, Card } from "@/components/ui";

export default function AgendaClient({ services, today }: { services: Service[]; today: string }) {
  const [date, setDate] = useState(today);

  const dayServices = services
    .filter((s) => s.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Agenda</h1>

      <Card className="p-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-dark/80">Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-dark/15 bg-white px-4 py-3 text-sm focus:border-teal"
          />
        </label>
        <p className="mt-3 text-center text-sm font-semibold capitalize text-dark-teal">
          {formatDateLong(new Date(date + "T12:00:00"))}
        </p>
        <p className="text-center text-xs text-dark/50">
          {dayServices.length} servicio{dayServices.length !== 1 ? "s" : ""} programado{dayServices.length !== 1 ? "s" : ""}
        </p>
      </Card>

      {dayServices.length === 0 ? (
        <EmptyState
          title="No tienes servicios programados para este día."
          message="Selecciona otra fecha o crea un nuevo servicio."
        />
      ) : (
        <div className="relative space-y-3 border-l-2 border-beige pl-4 ml-2">
          {dayServices.map((s) => (
            <div key={s.id} className="relative">
              <span className="absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-teal bg-cream" />
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-dark-teal">{s.time}</p>
                    <p className="font-semibold truncate">{s.clientName}</p>
                    <p className="text-sm text-dark/60 truncate">{s.origin} → {s.destination}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gold-deep">{formatMoney(s.price)}</p>
                    <div className="mt-1"><StatusBadge status={s.status} /></div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

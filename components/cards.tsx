"use client";

import { Client, Payment, Service, Student } from "@/lib/types";
import { formatDateShort } from "@/lib/format";
import { Avatar, Card, Chip, Money, StatusBadge } from "./ui";
import { IconPhone } from "./icons";

/* ---------- SummaryCard ---------- */
export function SummaryCard({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div
      className={`flex-1 basis-auto min-w-[8.5rem] rounded-2xl shadow-sm p-4 border ${
        accent ? "bg-gold/5 border-gold" : "bg-white border-dark/5"
      }`}
    >
      <p
        className={`whitespace-nowrap font-bold leading-tight tabular-nums text-xl md:text-2xl ${
          accent ? "text-gold-deep" : "text-dark-teal"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs md:text-sm leading-snug text-dark/60">{label}</p>
    </div>
  );
}

/* ---------- ServiceCard ---------- */
export function ServiceCard({ service, onClick }: { service: Service; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="p-4 hover:border-teal/40 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-dark-teal">{service.time}</p>
            <p className="mt-0.5 font-semibold truncate">{service.clientName}</p>
            <p className="text-sm text-dark/60 truncate">
              {service.origin} → {service.destination}
            </p>
            <p className="mt-1 text-xs text-dark/50">
              {formatDateShort(service.date)} · {service.passengers} pasajero{service.passengers !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <Money amount={service.price} className="text-gold-deep" />
            <div className="mt-2">
              <StatusBadge status={service.status} />
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}

/* ---------- ClientCard ---------- */
export function ClientCard({ client, onClick }: { client: Client; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="p-4 hover:border-teal/40 hover:shadow-md transition-all">
        <div className="flex items-center gap-3">
          <Avatar name={client.name} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{client.name}</p>
            <p className="text-sm text-dark/60 flex items-center gap-1">
              <IconPhone className="w-3.5 h-3.5" /> {client.phone}
            </p>
            <p className="mt-0.5 text-xs text-dark/50">{client.serviceType}</p>
          </div>
          <div className="text-right shrink-0">
            {client.balance > 0 ? (
              <>
                <p className="text-[11px] text-dark/50">Saldo pendiente</p>
                <Money amount={client.balance} className="text-orange" />
              </>
            ) : (
              <Chip tone="teal">Al día</Chip>
            )}
          </div>
        </div>
      </Card>
    </button>
  );
}

/* ---------- StudentCard ---------- */

import { formatMoney } from "@/lib/format";

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

const frequencyLabel = { mensual: "Mensual", quincenal: "Quincenal", semanal: "Semanal" } as const;

export function StudentCard({ 
  student, 
  onClick, 
  onQuickPay 
}: { 
  student: Student; 
  onClick?: () => void;
  onQuickPay?: () => void;
}) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <Card className="p-0 overflow-hidden hover:border-teal/40 hover:shadow-md transition-all">
        <div className="grid grid-cols-[3fr_2fr] min-h-[128px]">
          {/* Izquierda: info estudiante (3/5) */}
          <div className="p-4 flex flex-col justify-between min-w-0">
            <div className="min-w-0">
              <p className="font-semibold truncate">{student.name}</p>
              {student.school && (
                <p className="mt-1 text-sm text-dark/60 truncate">{student.school}</p>
              )}
              <p className="mt-1 text-xs text-dark/50 truncate">
                {formatTime12h(student.entryTime)} – {formatTime12h(student.exitTime)}
              </p>
              {/* Pago y periodicidad */}
              <div className="mt-2 flex items-center gap-3 text-xs text-dark/60">
                <span className="flex items-center gap-1 font-medium text-dark-teal">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatMoney(student.monthlyFee)}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-dark/5">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {frequencyLabel[student.frequency]}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center">
              {student.paid ? <Chip tone="teal">Pagado</Chip> : <Chip tone="danger">Pendiente</Chip>}
            </div>
          </div>

          {/* Derecha: botón Pago (2/5) - solo si no pagado */}
          {!student.paid && onQuickPay && (
            <div className="flex items-center justify-center p-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onQuickPay();
                }}
                className="w-full h-full max-w-[120px] rounded-xl bg-green-600 text-white font-bold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white hover:bg-green-700 active:bg-green-800 flex items-center justify-center gap-2 px-4"
                title="Registrar pago (efectivo, hoy)"
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                </svg>
                <span className="whitespace-nowrap">Pago</span>
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------- PaymentCard ---------- */
export function PaymentCard({ payment }: { payment: Payment }) {
  const methodLabel = { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta: "Tarjeta" }[payment.method];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{payment.clientName}</p>
          <p className="text-sm text-dark/60 truncate">{payment.concept}</p>
          <p className="mt-0.5 text-xs text-dark/50">
            {formatDateShort(payment.date)} · {methodLabel}
          </p>
        </div>
        <div className="text-right shrink-0">
          <Money amount={payment.amount} className="text-dark-teal" />
          <div className="mt-1">
            {payment.status === "completado" ? <Chip tone="teal">Completado</Chip> : <Chip tone="danger">Pendiente</Chip>}
          </div>
        </div>
      </div>
    </Card>
  );
}

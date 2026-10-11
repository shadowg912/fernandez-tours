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

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

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
      <Card className="p-4 hover:border-teal/40 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate">{student.name}</p>
            {student.school && (
              <p className="text-sm text-dark/60 truncate">{student.school}</p>
            )}
            <p className="text-xs text-dark/50 truncate">
              {formatTime12h(student.entryTime)} – {formatTime12h(student.exitTime)}
            </p>
          </div>
          {student.paid ? <Chip tone="teal">Pagado</Chip> : <Chip tone="danger">Pendiente</Chip>}
        </div>
        {!student.paid && onQuickPay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onQuickPay();
            }}
            className="mt-3 w-full rounded-xl px-4 py-6 text-base font-bold text-white shadow-sm transition-all active:scale-[.98] focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "#16a34a",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(22, 163, 74, 0.35)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#15803d";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(22, 163, 74, 0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#16a34a";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(22, 163, 74, 0.35)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = "#166534";
            }}
            title="Registrar pago (efectivo, hoy)"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
              </svg>
              <span>Pago</span>
            </div>
          </button>
        )}
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

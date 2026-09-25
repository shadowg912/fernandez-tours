"use client";

import { Client, PayFrequency, Payment, Service, Student } from "@/lib/types";
import { formatDateShort } from "@/lib/format";
import { Avatar, Card, Chip, Money, StatusBadge } from "./ui";
import { IconMoney, IconPhone } from "./icons";

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
const frequencyLabel: Record<PayFrequency, string> = {
  mensual: "Mensual",
  quincenal: "Quincenal",
  semanal: "Semanal",
};

const frequencySuffix: Record<PayFrequency, string> = {
  mensual: "mes",
  quincenal: "quincena",
  semanal: "semana",
};

export function StudentCard({ student, onPay, onClick }: { student: Student; onPay?: () => void; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <Card className="p-4 hover:border-teal/40 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{student.name}</p>
          <p className="text-sm text-dark/60 truncate">{student.school}</p>
          <p className="text-xs text-dark/50 truncate">{student.address}</p>
        </div>
        {student.paid ? <Chip tone="teal">Pagado</Chip> : <Chip tone="danger">Pendiente</Chip>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {student.days.map((d) => (
          <span key={d} className="rounded-md bg-beige/40 px-2 py-0.5 text-[11px] font-medium text-dark/70">
            {d}
          </span>
        ))}
        <Chip tone="gold">{frequencyLabel[student.frequency]}</Chip>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm">
          <Money amount={student.monthlyFee} className="text-gold-deep" />{" "}
          <span className="text-dark/50 text-xs">/ {frequencySuffix[student.frequency]}</span>
        </p>
        {!student.paid && onPay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPay();
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-teal px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-dark-teal active:scale-[.97]"
          >
            <IconMoney className="h-4 w-4" />
            Registrar pago
          </button>
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

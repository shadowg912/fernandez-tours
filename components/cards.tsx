"use client";

import { Client, DailyRoute, Payment, RouteExecution, Service, Student } from "@/lib/types";
import { formatDateShort, formatMoney } from "@/lib/format";
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
export function ServiceCard({ 
  service, 
  onClick, 
  onConfirm,
  onComplete, 
  onCancel 
}: { 
  service: Service; 
  onClick?: () => void;
  onConfirm?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}) {
  const canConfirm = service.status === "pendiente_confirmacion";
  const canComplete = service.status === "confirmado";
  const canCancel = service.status === "confirmado" || service.status === "pendiente_confirmacion";
  
  return (
    <div className="w-full" onClick={onClick}>
      <Card className="p-4 hover:border-teal/40 hover:shadow-md transition-all cursor-pointer">
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
            <div className="mt-2 flex flex-col items-end gap-1.5">
              <StatusBadge status={service.status} />
              {(canConfirm || canComplete || canCancel) && (
                <div className="w-full flex flex-col gap-2">
                  {canConfirm && onConfirm && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green text-white px-4 py-3 text-sm font-semibold hover:bg-green/90 active:bg-green active:scale-[.98] transition-colors"
                      title="Confirmar servicio"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmar
                    </button>
                  )}
                  {canComplete && onComplete && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onComplete(); }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal text-white px-4 py-3 text-sm font-semibold hover:bg-teal/90 active:bg-teal active:scale-[.98] transition-colors"
                      title="Marcar como completado"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Completado
                    </button>
                  )}
                  {canCancel && onCancel && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onCancel(); }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-orange text-white px-4 py-3 text-sm font-semibold hover:bg-orange/90 active:bg-orange active:scale-[.98] transition-colors"
                      title="Marcar como cancelado"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelado
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
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

/* ---------- DailyRouteCard ---------- */
const executionStatusLabel: Record<RouteExecution["status"], string> = {
  pending: "Pendiente",
  done: "Hecha",
  skipped: "No hecha",
};

const executionStatusColor: Record<RouteExecution["status"], string> = {
  pending: "bg-orange/15 text-orange",
  done: "bg-teal/15 text-teal",
  skipped: "bg-dark/10 text-dark/50",
};

export function DailyRouteCard({ 
  route, 
  onClick, 
  onEdit, 
  onDelete, 
  onCopyToNextMonth,
  summary 
}: { 
  route: DailyRoute; 
  onClick?: () => void; 
  onEdit?: () => void; 
  onDelete?: () => void;
  onCopyToNextMonth?: () => void;
  summary?: { totalCollected: number; executionCount: number } | null;
}) {
  const daysLabel = route.daysOfWeek.map(d => {
    const labels: Record<string, string> = { Mon: "Lun", Tue: "Mar", Wed: "Mié", Thu: "Jue", Fri: "Vie", Sat: "Sáb", Sun: "Dom" };
    return labels[d] || d;
  }).join(" · ");

  return (
    <div className="cursor-pointer" onClick={onClick}>
      <Card className="p-4 hover:border-teal/40 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{route.name}</p>
            <p className="mt-1 text-sm text-dark/60">
              {daysLabel}  •  Ventana: {route.generationWindowDays} días
            </p>
            <p className="mt-1 text-xs text-dark/50">Tarifa: {formatMoney(route.dailyFee)}/día</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <p className="text-lg font-bold text-dark-teal">{summary ? formatMoney(summary.totalCollected) : "RD$ 0"}</p>
              <p className="text-xs text-dark/50">Total cobrado</p>
            </div>
            <div className="flex gap-1.5">
              {onEdit && (
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-lg text-dark/50 hover:bg-teal/10 hover:text-teal transition-colors" title="Editar">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </button>
              )}
              {onCopyToNextMonth && (
                <button onClick={(e) => { e.stopPropagation(); onCopyToNextMonth(); }} className="p-2 rounded-lg text-dark/50 hover:bg-blue/10 hover:text-blue transition-colors" title="Copiar al mes siguiente">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 00-1.5.126m0 13.5c0 .621.504 1.125 1.125 1.125h9.75a1.125 1.125 0 001.125-1.125V12.341"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12.75a3 3 0 11-6 0 3 3 0 016 0zm3 0a3 3 0 11-6 0 3 3 0 016 0zm3 0a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              )}
              {onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-lg text-dark/50 hover:bg-orange/10 hover:text-orange transition-colors" title="Eliminar">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------- RouteExecutionDay ---------- */
export function RouteExecutionDay({ 
  execution, 
  dailyFee, 
  onStatusChange 
}: { 
  execution: RouteExecution; 
  dailyFee: number; 
  onStatusChange: (date: string, newStatus: RouteExecution["status"]) => void;
}) {
  const isToday = execution.executionDate === new Date().toISOString().slice(0, 10);
  const date = new Date(execution.executionDate + "T00:00:00");
  const dayNum = date.getDate();
  const dayName = date.toLocaleDateString("es-DO", { weekday: "short" });

  return (
    <button
      type="button"
      onClick={() => onStatusChange(execution.executionDate, execution.status === "done" ? "pending" : "done")}
      className={`relative w-full aspect-square rounded-xl border-2 transition-all ${
        execution.status === "done" 
          ? "border-teal bg-teal/5" 
          : execution.status === "skipped" 
            ? "border-orange bg-orange/5" 
            : "border-dark/10 bg-white hover:border-teal/30"
      } ${isToday ? "ring-2 ring-teal" : ""}`}
      title={`${executionStatusLabel[execution.status]} • Click para cambiar`}
    >
      <div className="p-2 flex flex-col items-center justify-center h-full">
        <span className="text-lg font-bold text-dark">{dayNum}</span>
        <span className="text-xs text-dark/50 capitalize">{dayName}</span>
        <span className={`mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${executionStatusColor[execution.status]}`}>
          {executionStatusLabel[execution.status]}
        </span>
        <span className="mt-1 text-xs font-medium text-gold-deep">
          {execution.status === "done" ? formatMoney(dailyFee) : "RD$ 0"}
        </span>
      </div>
      {isToday && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal" title="Hoy" />
      )}
    </button>
  );
}

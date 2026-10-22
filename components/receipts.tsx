"use client";

import { useEffect } from "react";
import { PayFrequency, PaymentMethod, PaymentStatus } from "@/lib/types";
import { formatDateWithYear, formatMoney, formatMonthYear } from "@/lib/format";
import { Button } from "./ui";

export interface RouteReceiptData {
  id: string;
  routeName: string;
  daysPaid: number;
  feePerDay: number;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  observation?: string;
}

const methodLabel: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-dark/50">{label}</span>
      <span className="text-right font-medium text-dark">{value}</span>
    </div>
  );
}

export function RoutePaymentReceipt({
  data,
  onClose,
}: {
  data: RouteReceiptData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!data) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [data, onClose]);

  if (!data) return null;

  const receiptNo = `REC-${data.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-sm">
        <div className="mx-auto w-full rounded-2xl border border-dark/10 bg-white p-5 text-dark shadow-xl">
          {/* Encabezado */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">
                Fernández Tours
              </p>
              <p className="mt-1 text-base font-bold leading-tight text-dark-teal">
                Recibo de pago de ruta
              </p>
              <p className="mt-0.5 text-xs text-dark/50">{receiptNo}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Fernández Tours"
              className="h-14 w-14 shrink-0 object-contain"
            />
          </div>

          <div className="my-4 border-t border-dashed border-dark/15" />

          <div className="space-y-1.5 text-sm">
            <ReceiptRow label="Emitido" value={formatMonthYear(data.paymentDate)} />
            <ReceiptRow label="Fecha de pago" value={formatDateWithYear(data.paymentDate)} />
            <ReceiptRow label="Ruta" value={data.routeName} />
          </div>

          <div className="my-4 border-t border-dashed border-dark/15" />

          <div className="space-y-1.5 text-sm">
            <ReceiptRow label="Días pagados" value={String(data.daysPaid)} />
            <ReceiptRow label="Tarifa por día" value={formatMoney(data.feePerDay)} />
            <ReceiptRow label="Método" value={methodLabel[data.method] ?? data.method} />
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-teal/10 px-3 py-2.5">
            <span className="text-sm font-semibold text-dark/70">Total</span>
            <span className="text-xl font-bold tabular-nums text-dark-teal">{formatMoney(data.amount)}</span>
          </div>

          {data.observation && (
            <p className="mt-3 text-xs text-dark/60">
              <span className="font-semibold">Observación:</span> {data.observation}
            </p>
          )}

          <p className="mt-4 text-[11px] leading-snug text-dark/45">
            Los pagos se aplican a las fechas más antiguas primero. Gracias por su pago.
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <a
            href={`/api/recibos/ruta/${data.id}`}
            download
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-dark-teal active:scale-[.98]"
          >
            Descargar PDF
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Recibo de estudiante ---------- */

export interface StudentReceiptPayment {
  id: string;
  date: string;
  concept: string;
  amount: number;
  method: PaymentMethod;
  period?: string;
}

export interface StudentReceiptData {
  studentId: string;
  studentName: string;
  school?: string;
  routeName?: string;
  frequency: PayFrequency;
  monthlyFee: number;
  from: string;
  to: string;
  payments: StudentReceiptPayment[];
}

const frequencyLabel: Record<PayFrequency, string> = {
  mensual: "Mensual",
  quincenal: "Quincenal",
  semanal: "Semanal",
};

export function StudentPaymentReceipt({
  data,
  onClose,
}: {
  data: StudentReceiptData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!data) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [data, onClose]);

  if (!data) return null;

  const receiptNo = `REC-E-${data.studentId.replace(/-/g, "").slice(0, 8).toUpperCase()}-${data.from.replace(/-/g, "")}`;
  const total = data.payments.reduce((sum, p) => sum + p.amount, 0);
  const emitted = data.payments.reduce(
    (latest, p) => (p.date > latest ? p.date : latest),
    data.payments[0]?.date ?? data.to
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-sm">
        <div className="mx-auto max-h-[calc(100vh-8rem)] w-full overflow-y-auto rounded-2xl border border-dark/10 bg-white p-5 text-dark shadow-xl">
          {/* Encabezado */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">
                Fernández Tours
              </p>
              <p className="mt-1 text-base font-bold leading-tight text-dark-teal">
                Recibo de transporte estudiantil
              </p>
              <p className="mt-0.5 text-xs text-dark/50">{receiptNo}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Fernández Tours"
              className="h-14 w-14 shrink-0 object-contain"
            />
          </div>

          <div className="my-4 border-t border-dashed border-dark/15" />

          <div className="space-y-1.5 text-sm">
            <ReceiptRow label="Emitido" value={formatMonthYear(emitted)} />
            <ReceiptRow label="Estudiante" value={data.studentName} />
            {data.school && <ReceiptRow label="Colegio" value={data.school} />}
            {data.routeName && <ReceiptRow label="Ruta" value={data.routeName} />}
          </div>

          <div className="my-4 border-t border-dashed border-dark/15" />

          <div className="space-y-1.5 text-sm">
            <ReceiptRow label="Frecuencia" value={frequencyLabel[data.frequency] ?? data.frequency} />
            <ReceiptRow label="Tarifa" value={formatMoney(data.monthlyFee)} />
            <ReceiptRow
              label="Periodo"
              value={`${formatDateWithYear(data.from)} – ${formatDateWithYear(data.to)}`}
            />
          </div>

          <div className="my-4 border-t border-dashed border-dark/15" />

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark/45">
            Pagos registrados
          </p>

          <div className="mt-2 space-y-3">
            {data.payments.map((p, index) => (
              <div key={p.id}>
                {index > 0 && <div className="mb-2 border-t border-dashed border-dark/10" />}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-dark/50">
                      {formatDateWithYear(p.date)} · {methodLabel[p.method] ?? p.method}
                      {p.period ? ` · ${p.period}` : ""}
                    </p>
                    <p className="text-sm font-medium text-dark">{p.concept}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums">{formatMoney(p.amount)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-teal/10 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-dark/70">Total pagado</span>
              <span className="text-xl font-bold tabular-nums text-dark-teal">{formatMoney(total)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-dark/50">Pagos</span>
              <span className="font-medium text-dark">{data.payments.length}</span>
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-snug text-dark/45">
            Incluye solo los pagos completados dentro del periodo seleccionado. Gracias por su pago.
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <a
            href={`/api/recibos/estudiante/${data.studentId}?from=${data.from}&to=${data.to}`}
            download
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-dark-teal active:scale-[.98]"
          >
            Descargar PDF
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Recibo de servicio ---------- */

export interface ServiceReceiptPayment {
  id: string;
  date: string;
  concept: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  advance: boolean;
}

export interface ServiceReceiptData {
  serviceId: string;
  clientName: string;
  serviceDate: string;
  time: string;
  origin: string;
  destination: string;
  passengers: number;
  price: number;
  payments: ServiceReceiptPayment[];
}

export function ServicePaymentReceipt({
  data,
  onClose,
}: {
  data: ServiceReceiptData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!data) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [data, onClose]);

  if (!data) return null;

  const receiptNo = `REC-S-${data.serviceId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const paid = data.payments
    .filter((p) => p.status === "completado")
    .reduce((sum, p) => sum + p.amount, 0);
  const pending = Math.max(0, data.price - paid);
  const emitted = data.payments.length
    ? data.payments.reduce((latest, p) => (p.date > latest ? p.date : latest), data.payments[0].date)
    : data.serviceDate;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-sm">
        <div className="mx-auto max-h-[calc(100vh-8rem)] w-full overflow-y-auto rounded-2xl border border-dark/10 bg-white p-5 text-dark shadow-xl">
          {/* Encabezado */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">
                Fernández Tours
              </p>
              <p className="mt-1 text-base font-bold leading-tight text-dark-teal">
                Recibo de pago de servicio
              </p>
              <p className="mt-0.5 text-xs text-dark/50">{receiptNo}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Fernández Tours"
              className="h-14 w-14 shrink-0 object-contain"
            />
          </div>

          <div className="my-4 border-t border-dashed border-dark/15" />

          <div className="space-y-1.5 text-sm">
            <ReceiptRow label="Emitido" value={formatMonthYear(emitted)} />
            <ReceiptRow label="Cliente" value={data.clientName} />
            <ReceiptRow label="Fecha del servicio" value={formatDateWithYear(data.serviceDate)} />
            <ReceiptRow label="Hora" value={data.time} />
            <ReceiptRow label="Ruta" value={`${data.origin} → ${data.destination}`} />
            <ReceiptRow label="Pasajeros" value={String(data.passengers)} />
          </div>

          <div className="my-4 border-t border-dashed border-dark/15" />

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark/45">
            Pagos registrados
          </p>

          <div className="mt-2 space-y-3">
            {data.payments.map((p, index) => (
              <div key={p.id}>
                {index > 0 && <div className="mb-2 border-t border-dashed border-dark/10" />}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-dark/50">
                      {formatDateWithYear(p.date)} · {methodLabel[p.method] ?? p.method}
                    </p>
                    <p className="text-sm font-medium text-dark">{p.concept}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.advance && (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold-deep">
                          Adelantado
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          p.status === "completado"
                            ? "bg-green/10 text-green"
                            : "bg-orange/10 text-orange"
                        }`}
                      >
                        {p.status === "completado" ? "Pagado" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums">{formatMoney(p.amount)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-teal/10 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-dark/70">Total pagado</span>
              <span className="text-xl font-bold tabular-nums text-dark-teal">{formatMoney(paid)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-dark/50">Precio del servicio</span>
              <span className="font-medium text-dark">{formatMoney(data.price)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 text-xs">
              <span className="text-dark/50">Pendiente</span>
              <span className={`font-semibold ${pending > 0 ? "text-orange" : "text-green"}`}>
                {formatMoney(pending)}
              </span>
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-snug text-dark/45">
            Este recibo agrupa todos los pagos registrados para el servicio. Gracias por su pago.
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <a
            href={`/api/recibos/servicio/${data.serviceId}`}
            download
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-dark-teal active:scale-[.98]"
          >
            Descargar PDF
          </a>
        </div>
      </div>
    </div>
  );
}

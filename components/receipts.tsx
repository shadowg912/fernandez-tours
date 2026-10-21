"use client";

import { useEffect } from "react";
import { PaymentMethod } from "@/lib/types";
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

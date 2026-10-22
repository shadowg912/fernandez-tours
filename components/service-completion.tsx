"use client";

import { Service } from "@/lib/types";
import { formatDateShort, formatMoney } from "@/lib/format";
import { Button, Modal } from "./ui";

/**
 * Confirmación al completar un servicio.
 *
 * Si queda saldo, ofrece registrarlo como pago final (pago 2) vinculado al
 * mismo servicio. El monto, método y fecha se resuelven automáticamente para
 * que la confirmación sea simple.
 */
export function ServiceCompletionDialog({
  service,
  onClose,
  onConfirm,
  loading = false,
}: {
  service: Service | null;
  onClose: () => void;
  onConfirm: (pay: boolean) => void | Promise<void>;
  loading?: boolean;
}) {
  if (!service) return null;

  const paid = service.paidAmount ?? 0;
  const pending = Math.max(0, service.price - paid);
  const isPaid = pending <= 0;

  return (
    <Modal open onClose={onClose} title="Completar servicio">
      <div className="space-y-4">
        <div className="rounded-2xl border border-dark/5 bg-white p-4 space-y-2 text-sm">
          <p>
            <span className="font-semibold">Cliente:</span> {service.clientName}
          </p>
          <p>
            <span className="font-semibold">Fecha:</span> {formatDateShort(service.date)}
          </p>
          <p>
            <span className="font-semibold">Ruta:</span> {service.origin} → {service.destination}
          </p>
          <div className="mt-3 space-y-1 border-t border-dark/10 pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-dark/60">Precio</span>
              <span className="font-semibold">{formatMoney(service.price)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-dark/60">Pagado</span>
              <span className="font-semibold text-green">{formatMoney(paid)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-dark/60">Falta por pagar</span>
              <span className={`font-bold ${pending > 0 ? "text-orange" : "text-green"}`}>
                {formatMoney(pending)}
              </span>
            </div>
          </div>
        </div>

        {isPaid ? (
          <p className="rounded-xl bg-green/10 px-3 py-2 text-sm text-green">
            Este servicio ya está pagado. Solo falta marcarlo como completado.
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-dark">¿Se completó el pago de este servicio?</p>
            <p className="text-xs leading-relaxed text-dark/60">
              Si confirmas, se registrará el saldo pendiente de {formatMoney(pending)} como pago final,
              con fecha de hoy. Quedará vinculado al mismo servicio.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isPaid ? (
            <Button className="w-full" onClick={() => onConfirm(false)} disabled={loading}>
              {loading ? "Guardando…" : "Completar servicio"}
            </Button>
          ) : (
            <>
              <Button className="w-full" onClick={() => onConfirm(true)} disabled={loading}>
                {loading ? "Guardando…" : "Sí, registrar pago y completar"}
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => onConfirm(false)} disabled={loading}>
                No, solo completar
              </Button>
            </>
          )}
          <Button variant="ghost" className="w-full" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

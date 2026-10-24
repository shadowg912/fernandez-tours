"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Client, Payment, PaymentDraft, Service, Student } from "@/lib/types";
import { createPayment, deletePayment, markPaymentPaid, updatePayment } from "@/lib/actions";
import { periodRange } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { PaymentCard, SummaryCard } from "@/components/cards";
import { Button, Toast } from "@/components/ui";
import { ConfirmDialog, PaymentForm, PaymentFormResult } from "@/components/forms";
import { RoutePaymentReceipt, RouteReceiptData, ServicePaymentReceipt, ServiceReceiptData } from "@/components/receipts";
import { IconPlus, IconSearch } from "@/components/icons";

type StatusFilter = "todos" | "completado" | "pendiente";
type PeriodFilter = "mensual" | "trimestral" | "todos";

function draftFromResult(p: PaymentFormResult): PaymentDraft {
  return {
    clientName: p.clientName,
    concept: p.concept,
    date: p.date,
    method: p.method,
    amount: p.amount,
    status: p.status,
    advance: p.advance,
    ...(p.period ? { period: p.period } : {}),
    ...(p.observation ? { observation: p.observation } : {}),
    ...(p.studentId ? { studentId: p.studentId } : {}),
    ...(p.clientId ? { clientId: p.clientId } : {}),
    ...(p.serviceId ? { serviceId: p.serviceId } : {}),
  };
}

export default function PagosClient({
  payments,
  students,
  clients,
  services,
}: {
  payments: Payment[];
  students: Student[];
  clients: Client[];
  services: Service[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [receipt, setReceipt] = useState<RouteReceiptData | null>(null);
  const [serviceReceipt, setServiceReceipt] = useState<ServiceReceiptData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("mensual");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const range = period === "todos" ? null : periodRange(period);
    return payments.filter((p) => {
      if (statusFilter !== "todos" && p.status !== statusFilter) return false;
      if (q && !p.clientName.toLowerCase().includes(q) && !p.concept.toLowerCase().includes(q)) return false;
      if (range && (p.date < range.from || p.date > range.to)) return false;
      return true;
    });
  }, [payments, query, statusFilter, period]);

  const collected = list.filter((p) => p.status === "completado").reduce((s, p) => s + p.amount, 0);
  const pendingAmount = list.filter((p) => p.status === "pendiente").reduce((s, p) => s + p.amount, 0);
  const pendingCount = list.filter((p) => p.status === "pendiente").length;

  const run = (fn: () => Promise<void>, message: string) => {
    startTransition(async () => {
      await fn();
      setToast(message);
    });
  };

  const onSaved = (p: PaymentFormResult) => {
    const draft = draftFromResult(p);
    if (editing) {
      run(async () => {
        await updatePayment(editing.id, draft);
        setEditing(null);
        setFormOpen(false);
      }, "Pago actualizado");
    } else {
      run(async () => {
        await createPayment(draft);
        setFormOpen(false);
      }, "Pago registrado");
    }
  };

  const onDelete = () => {
    if (!deleting) return;
    run(async () => {
      await deletePayment(deleting.id);
      setDeleting(null);
    }, "Pago eliminado");
  };

  const onMarkPaid = (p: Payment) => run(async () => { await markPaymentPaid(p.id); }, "Pago marcado como completado");

  const openServiceReceipt = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    const linkedPayments = payments
      .filter((p) => p.serviceId === serviceId)
      .reverse();
    if (!linkedPayments.some((p) => p.status === "completado")) return;

    setServiceReceipt({
      serviceId: service.id,
      clientName: service.clientName,
      serviceDate: service.date,
      time: service.time,
      origin: service.origin,
      destination: service.destination,
      passengers: service.passengers,
      price: service.price,
      payments: linkedPayments.map((p) => ({
        id: p.id,
        date: p.date,
        concept: p.concept,
        amount: p.amount,
        method: p.method,
        status: p.status,
        advance: p.advance,
      })),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Pagos</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <IconPlus className="h-5 w-5" /> Registrar pago
        </Button>
      </div>

      <section className="flex flex-wrap gap-3">
        <SummaryCard value={formatMoney(collected)} label="Cobrado" />
        <SummaryCard value={formatMoney(pendingAmount)} label="Pendiente" accent />
        <SummaryCard value={String(list.length)} label="Pagos" />
        <SummaryCard value={String(pendingCount)} label="Deudas" />
      </section>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <IconSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o concepto…"
            className="w-full rounded-xl border border-dark/15 bg-white py-3 pl-12 pr-4 text-sm focus:border-teal"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark/45">Periodo</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["mensual", "trimestral", "todos"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  period === p
                    ? "bg-teal text-white shadow-sm"
                    : "bg-white text-dark/70 border border-dark/10 hover:border-teal"
                }`}
              >
                {p === "mensual" ? "Mensual" : p === "trimestral" ? "Trimestral" : "Todos"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark/45">Estado</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["todos", "completado", "pendiente"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  statusFilter === f
                    ? "bg-teal text-white shadow-sm"
                    : "bg-white text-dark/70 border border-dark/10 hover:border-teal"
                }`}
              >
                {f === "todos" ? "Todos" : f === "completado" ? "Completados" : "Pendientes"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dark/5 bg-white p-6 text-center text-sm text-dark/60">
          No hay pagos con estos filtros.
        </p>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3 md:space-y-0">
          {list.map((p) => {
            // Los pagos de ruta son solo lectura: se editan desde /rutas.
            const isRoutePayment = p.source === "route_payment" || Boolean(p.routeId);
            const serviceId = p.serviceId;
            const canViewServiceReceipt = serviceId
              ? payments.some((x) => x.serviceId === serviceId && x.status === "completado")
              : false;
            return (
              <PaymentCard
                key={`${p.source ?? "payment"}-${p.id}`}
                payment={p}
                onEdit={isRoutePayment ? undefined : () => { setEditing(p); setFormOpen(true); }}
                onDelete={isRoutePayment ? undefined : () => setDeleting(p)}
                onMarkPaid={isRoutePayment ? undefined : () => onMarkPaid(p)}
                onViewReceipt={
                  isRoutePayment
                    ? () => setReceipt({
                        id: p.id,
                        routeName: p.clientName,
                        daysPaid: p.daysPaid ?? 0,
                        feePerDay: p.feePerDay ?? (p.daysPaid ? Math.round(p.amount / p.daysPaid) : 0),
                        amount: p.amount,
                        paymentDate: p.date,
                        method: p.method,
                        ...(p.observation ? { observation: p.observation } : {}),
                      })
                    : serviceId && canViewServiceReceipt
                      ? () => openServiceReceipt(serviceId)
                      : undefined
                }
              />
            );
          })}
        </div>
      )}

      <PaymentForm
        open={formOpen || editing !== null}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={onSaved}
        initial={editing ?? undefined}
        students={students}
        clients={clients}
        services={services}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        loading={pending}
        title="Eliminar pago"
        message={`¿Eliminar el pago de ${deleting?.clientName ?? ""}? Esta acción no se puede deshacer.`}
      />

      <RoutePaymentReceipt data={receipt} onClose={() => setReceipt(null)} />
      <ServicePaymentReceipt data={serviceReceipt} onClose={() => setServiceReceipt(null)} />

      <Toast message={toast} />
    </div>
  );
}

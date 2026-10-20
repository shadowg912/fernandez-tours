"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Client, Payment, PaymentDraft, Student } from "@/lib/types";
import { createPayment, deletePayment, markPaymentPaid, updatePayment } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { PaymentCard, SummaryCard } from "@/components/cards";
import { Button, Toast } from "@/components/ui";
import { ConfirmDialog, PaymentForm, PaymentFormResult } from "@/components/forms";
import { IconPlus, IconSearch } from "@/components/icons";

type StatusFilter = "todos" | "completado" | "pendiente";

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
  };
}

export default function PagosClient({
  payments,
  students,
  clients,
}: {
  payments: Payment[];
  students: Student[];
  clients: Client[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== "todos" && p.status !== statusFilter) return false;
      if (q && !p.clientName.toLowerCase().includes(q) && !p.concept.toLowerCase().includes(q)) return false;
      if (from && p.date < from) return false;
      if (to && p.date > to) return false;
      if (!from && !to && month && !p.date.startsWith(month)) return false;
      return true;
    });
  }, [payments, query, statusFilter, from, to, month]);

  const collected = list.filter((p) => p.status === "completado").reduce((s, p) => s + p.amount, 0);
  const pendingAmount = list.filter((p) => p.status === "pendiente").reduce((s, p) => s + p.amount, 0);
  const pendingCount = list.filter((p) => p.status === "pendiente").length;
  const hasDateFilter = Boolean(month || from || to);

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

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setFrom("");
              setTo("");
            }}
            className="rounded-xl border border-dark/15 bg-white px-4 py-3 text-sm focus:border-teal"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setMonth("");
              }}
              className="rounded-xl border border-dark/15 bg-white px-3 py-3 text-sm focus:border-teal"
            />
            <span className="text-dark/40">—</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setMonth("");
              }}
              className="rounded-xl border border-dark/15 bg-white px-3 py-3 text-sm focus:border-teal"
            />
          </div>
          {hasDateFilter && (
            <button
              type="button"
              onClick={() => {
                setMonth("");
                setFrom("");
                setTo("");
              }}
              className="rounded-xl border border-dark/15 bg-white px-4 py-3 text-sm text-dark/70 transition-colors hover:border-teal"
            >
              Limpiar fechas
            </button>
          )}
        </div>

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

      {list.length === 0 ? (
        <p className="rounded-xl border border-dark/5 bg-white p-6 text-center text-sm text-dark/60">
          No hay pagos con estos filtros.
        </p>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3 md:space-y-0">
          {list.map((p) => {
            // Los pagos de ruta son solo lectura: se editan desde /rutas.
            const isRoutePayment = p.source === "route_payment" || Boolean(p.routeId);
            return (
              <PaymentCard
                key={`${p.source ?? "payment"}-${p.id}`}
                payment={p}
                onEdit={isRoutePayment ? undefined : () => { setEditing(p); setFormOpen(true); }}
                onDelete={isRoutePayment ? undefined : () => setDeleting(p)}
                onMarkPaid={isRoutePayment ? undefined : () => onMarkPaid(p)}
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
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        loading={pending}
        title="Eliminar pago"
        message={`¿Eliminar el pago de ${deleting?.clientName ?? ""}? Esta acción no se puede deshacer.`}
      />

      <Toast message={toast} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { payments } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { PaymentCard, SummaryCard } from "@/components/cards";
import { Button, Toast } from "@/components/ui";
import { PaymentForm } from "@/components/forms";
import { IconPlus } from "@/components/icons";

export default function PagosPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"todos" | "pendientes">("todos");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const collected = payments.filter((p) => p.status === "completado").reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === "pendiente").reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === "pendiente").length;

  const list = payments.filter((p) => (tab === "todos" ? true : p.status === "pendiente"));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Pagos</h1>
        <Button onClick={() => setFormOpen(true)}>
          <IconPlus className="h-5 w-5" /> Registrar pago
        </Button>
      </div>

      <section className="flex flex-wrap gap-3">
        <SummaryCard value={formatMoney(collected)} label="Cobrado este mes" accent />
        <SummaryCard value={formatMoney(pending)} label="Pendiente" />
        <SummaryCard value={String(payments.length)} label="Pagos registrados" />
        <SummaryCard value={String(pendingCount)} label="Deudas" />
      </section>

      <div className="flex gap-2">
        {(["todos", "pendientes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-teal text-white" : "bg-white text-dark/70 border border-dark/10 hover:border-teal"
            }`}
          >
            {t === "todos" ? "Todos" : "Pendientes"}
          </button>
        ))}
      </div>

      <div className="space-y-3 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3 md:space-y-0">
        {list.map((p) => (
          <PaymentCard key={p.id} payment={p} />
        ))}
      </div>

      <PaymentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          setToast("Pago registrado (demo)");
        }}
      />

      <Toast message={toast} />
    </div>
  );
}

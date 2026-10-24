"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Client, Payment, Service } from "@/lib/types";
import { createClient } from "@/lib/actions";
import { ClientCard, PaymentCard, ServiceCard } from "@/components/cards";
import { Avatar, Button, Chip, Modal, Toast } from "@/components/ui";
import { ClientForm } from "@/components/forms";
import { formatMoney } from "@/lib/format";
import { IconPhone, IconPlus, IconSearch } from "@/components/icons";

export default function ClientesClient({
  clients,
  services,
  payments,
}: {
  clients: Client[];
  services: Service[];
  payments: Payment[];
}) {
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const list = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.replace(/-/g, "").includes(query.replace(/-/g, ""))
      ),
    [clients, query]
  );

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={() => setFormOpen(true)}>
          <IconPlus className="h-5 w-5" /> Nuevo cliente
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <IconSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o teléfono…"
          className="w-full rounded-xl border border-dark/15 bg-white py-3 pl-12 pr-4 text-sm focus:border-teal"
        />
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl bg-white border border-dark/5 p-6 text-center text-sm text-dark/60">
          {query ? `No se encontraron clientes para “${query}”.` : "Aún no hay clientes registrados."}
        </p>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {list.map((c) => (
            <ClientCard key={c.id} client={c} onClick={() => setSelectedId(c.id)} />
          ))}
        </div>
      )}

      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(draft) => {
          startTransition(async () => {
            await createClient(draft);
            setFormOpen(false);
            setToast("Cliente guardado");
          });
        }}
      />

      {/* Detalle del cliente */}
      <Modal open={selected !== null} onClose={() => setSelectedId(null)} title="Detalle del cliente">
        {selected && <ClientDetail client={selected} services={services} payments={payments} />}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}

function ClientDetail({ client, services, payments }: { client: Client; services: Service[]; payments: Payment[] }) {
  const clientServices = services.filter((s) => s.clientName === client.name).slice(0, 3);
  const clientPayments = payments.filter((p) => p.clientName === client.name).slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={client.name} size="lg" />
        <div>
          <p className="text-lg font-bold">{client.name}</p>
          <p className="text-sm text-dark/60 flex items-center gap-1">
            <IconPhone className="h-4 w-4" /> {client.phone}
          </p>
          {client.balance > 0 ? (
            <Chip tone="danger">Debe {formatMoney(client.balance)}</Chip>
          ) : (
            <Chip tone="teal">Al día</Chip>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-dark/5 p-4 text-sm space-y-1.5">
        <p><span className="font-semibold">Tipo:</span> {client.serviceType}</p>
        {client.lastService && <p><span className="font-semibold">Último servicio:</span> {client.lastService}</p>}
        {client.email && <p><span className="font-semibold">Correo:</span> {client.email}</p>}
        {client.address && <p><span className="font-semibold">Dirección:</span> {client.address}</p>}
      </div>

      <div>
        <p className="mb-2 text-sm font-bold">Servicios recientes</p>
        {clientServices.length === 0 ? (
          <p className="text-sm text-dark/50">Sin servicios registrados.</p>
        ) : (
          <div className="space-y-2">
            {clientServices.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-bold">Pagos recientes</p>
        {clientPayments.length === 0 ? (
          <p className="text-sm text-dark/50">Sin pagos registrados.</p>
        ) : (
          <div className="space-y-2">
            {clientPayments.map((p) => <PaymentCard key={p.id} payment={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

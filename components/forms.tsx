"use client";

import { FormEvent, useState } from "react";
import { PayFrequency, PaymentMethod, ServiceStatus, Student, StudentDraft } from "@/lib/types";
import { Button, Field, Input, Modal, Select, Textarea } from "./ui";

function FormActions({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return (
    <div className="mt-5 flex gap-3">
      <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={loading}>
        Cancelar
      </Button>
      <Button type="submit" className="flex-1" disabled={loading}>
        {loading ? "Guardando…" : label}
      </Button>
    </div>
  );
}

function useSubmit(onDone: () => void | Promise<void>) {
  const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onDone();
    } finally {
      setLoading(false);
    }
  };
  return { submit, loading };
}

export function ServiceForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (draft: {
    clientName: string;
    date: string;
    time: string;
    origin: string;
    destination: string;
    passengers: number;
    price: number;
    status: ServiceStatus;
    observations?: string;
  }) => void | Promise<void>;
}) {
  const { submit, loading } = useSubmit(async () => {
    await onSaved(readForm<ServiceStatus>("service-form"));
  });

  return (
    <Modal open={open} onClose={onClose} title="Nuevo servicio">
      <form id="service-form" onSubmit={submit} className="space-y-4">
        <Field label="Cliente">
          <Input name="clientName" placeholder="Nombre del cliente" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <Input name="date" type="date" required />
          </Field>
          <Field label="Hora">
            <Input name="time" type="time" defaultValue="08:00" required />
          </Field>
        </div>
        <Field label="Lugar de recogida">
          <Input name="origin" placeholder="Ej. Santiago, Calle del Sol" required />
        </Field>
        <Field label="Destino">
          <Input name="destination" placeholder="Ej. La Vega" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pasajeros">
            <Input name="passengers" type="number" min={1} defaultValue={1} required />
          </Field>
          <Field label="Precio (RD$)">
            <Input name="price" type="number" min={0} placeholder="2500" required />
          </Field>
        </div>
        <Field label="Estado">
          <Select name="status" defaultValue="confirmado">
            <option value="confirmado">Confirmado</option>
            <option value="pendiente">Pendiente</option>
          </Select>
        </Field>
        <Field label="Observaciones">
          <Textarea name="observations" placeholder="Notas adicionales (opcional)" />
        </Field>
        <FormActions onCancel={onClose} loading={loading} label="Guardar servicio" />
      </form>
    </Modal>
  );
}

function readForm<T extends string>(formId: string): {
  clientName: string;
  date: string;
  time: string;
  origin: string;
  destination: string;
  passengers: number;
  price: number;
  status: T;
  observations?: string;
} {
  const form = document.getElementById(formId) as HTMLFormElement;
  const fd = new FormData(form);
  const obs = String(fd.get("observations") ?? "").trim();
  return {
    clientName: String(fd.get("clientName") ?? "").trim(),
    date: String(fd.get("date") ?? ""),
    time: formatTime(String(fd.get("time") ?? "")),
    origin: String(fd.get("origin") ?? "").trim(),
    destination: String(fd.get("destination") ?? "").trim(),
    passengers: Number(fd.get("passengers")) || 1,
    price: Number(fd.get("price")) || 0,
    status: (String(fd.get("status") ?? "pendiente") as T),
    ...(obs ? { observations: obs } : {}),
  };
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

export function ClientForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (draft: { name: string; phone: string; email?: string; address?: string; serviceType: string }) => void | Promise<void>;
}) {
  const { submit, loading } = useSubmit(async () => {
    const form = document.getElementById("client-form") as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    const address = String(fd.get("address") ?? "").trim();
    const typeMap: Record<string, string> = {
      regular: "Transporte regular",
      excursiones: "Excursiones",
      corporativo: "Corporativo",
      estudiantil: "Estudiantil",
    };
    await onSaved({
      name: String(fd.get("name") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      ...(email ? { email } : {}),
      ...(address ? { address } : {}),
      serviceType: typeMap[String(fd.get("type"))] ?? "Transporte regular",
    });
  });

  return (
    <Modal open={open} onClose={onClose} title="Nuevo cliente">
      <form id="client-form" onSubmit={submit} className="space-y-4">
        <Field label="Nombre completo">
          <Input name="name" placeholder="Ej. Juan Pérez" required />
        </Field>
        <Field label="Teléfono">
          <Input name="phone" type="tel" placeholder="809-555-0000" required />
        </Field>
        <Field label="Correo electrónico">
          <Input name="email" type="email" placeholder="opcional@example.com" />
        </Field>
        <Field label="Dirección">
          <Input name="address" placeholder="Sector, ciudad" />
        </Field>
        <Field label="Tipo de servicio">
          <Select name="type" defaultValue="regular">
            <option value="regular">Transporte regular</option>
            <option value="excursiones">Excursiones</option>
            <option value="corporativo">Corporativo</option>
            <option value="estudiantil">Estudiantil</option>
          </Select>
        </Field>
        <FormActions onCancel={onClose} loading={loading} label="Guardar cliente" />
      </form>
    </Modal>
  );
}

export interface PaymentFormResult {
  date: string;
  method: PaymentMethod;
  period?: string;
  observation?: string;
  amount: number;
  clientName?: string;
  concept?: string;
}

export function PaymentForm({
  open,
  onClose,
  onSaved,
  studentName,
  defaultAmount,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (result: PaymentFormResult) => void | Promise<void>;
  studentName?: string;
  defaultAmount?: number;
}) {
  const { submit, loading } = useSubmit(async () => {
    const form = document.getElementById("payment-form") as HTMLFormElement;
    const fd = new FormData(form);
    const period = String(fd.get("period") ?? "").trim();
    const observation = String(fd.get("observation") ?? "").trim();
    await onSaved({
      clientName: String(fd.get("clientName") ?? "").trim(),
      date: String(fd.get("date") ?? ""),
      method: String(fd.get("method") ?? "efectivo") as PaymentMethod,
      ...(period ? { period } : {}),
      ...(observation ? { observation } : {}),
      amount: Number(fd.get("amount")) || 0,
      concept: String(fd.get("concept") ?? "").trim() || undefined,
    });
  });

  return (
    <Modal open={open} onClose={onClose} title="Registrar pago">
      <form id="payment-form" onSubmit={submit} className="space-y-4">
        <Field label={studentName ? "Estudiante" : "Cliente"}>
          <Input name="clientName" defaultValue={studentName ?? ""} placeholder="Nombre" required readOnly={!!studentName} />
        </Field>
        {!studentName && (
          <Field label="Concepto">
            <Input name="concept" placeholder="Ej. Servicio Santiago → La Vega" required />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Periodo">
            <Select name="period" defaultValue="2026-09">
              <option value="2026-09">Septiembre 2026</option>
              <option value="2026-10">Octubre 2026</option>
            </Select>
          </Field>
          <Field label="Monto (RD$)">
            <Input name="amount" type="number" min={0} defaultValue={defaultAmount} placeholder="0" required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <Input name="date" type="date" required />
          </Field>
          <Field label="Método de pago">
            <Select name="method" defaultValue="efectivo">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </Select>
          </Field>
        </div>
        <Field label="Observación">
          <Textarea name="observation" placeholder="Notas (opcional)" />
        </Field>
        <FormActions onCancel={onClose} loading={loading} label="Registrar pago" />
      </form>
    </Modal>
  );
}

/* ---------- CRUD Estudiantes ---------- */
const allDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function StudentForm({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (draft: StudentDraft) => void | Promise<void>;
  initial?: Student | null;
}) {
  if (!open) return null;
  // key fuerza remount: el estado se inicializa desde `initial` sin efectos
  return <StudentFormInner key={initial?.id ?? "new"} onClose={onClose} onSaved={onSaved} initial={initial ?? null} />;
}

function StudentFormInner({
  onClose,
  onSaved,
  initial,
}: {
  onClose: () => void;
  onSaved: (draft: StudentDraft) => void | Promise<void>;
  initial: Student | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [school, setSchool] = useState(initial?.school ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [schedule, setSchedule] = useState(initial?.schedule ?? "");
  const [days, setDays] = useState<string[]>(initial?.days ?? []);
  const [frequency, setFrequency] = useState<PayFrequency>(initial?.frequency ?? "mensual");
  const [monthlyFee, setMonthlyFee] = useState(initial ? String(initial.monthlyFee) : "");
  const [guardian, setGuardian] = useState(initial?.guardian ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [loading, setLoading] = useState(false);

  const toggleDay = (d: string) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSaved({
        name: name.trim(),
        school: school.trim(),
        address: address.trim(),
        schedule: schedule.trim(),
        days,
        frequency,
        monthlyFee: Number(monthlyFee) || 0,
        guardian: guardian.trim(),
        phone: phone.trim(),
        paid: initial?.paid ?? false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={initial ? "Editar estudiante" : "Nuevo estudiante"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre del estudiante">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Carlos Martínez Jr." required />
        </Field>
        <Field label="Escuela / Colegio">
          <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Ej. Colegio San José" required />
        </Field>
        <Field label="Dirección de recogida">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Sector, ciudad" required />
        </Field>
        <Field label="Horario">
          <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Ej. 6:45 AM - 2:30 PM" required />
        </Field>
        <Field label="Días de transporte">
          <div className="flex flex-wrap gap-2">
            {allDays.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  days.includes(d) ? "bg-teal text-white" : "bg-white text-dark/70 border border-dark/15"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Frecuencia de pago">
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value as PayFrequency)}>
              <option value="mensual">Mensual</option>
              <option value="quincenal">Quincenal</option>
              <option value="semanal">Semanal</option>
            </Select>
          </Field>
          <Field label="Tarifa (RD$)">
            <Input type="number" min={0} value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} placeholder="4500" required />
          </Field>
        </div>
        <Field label="Representante">
          <Input value={guardian} onChange={(e) => setGuardian(e.target.value)} placeholder="Padre / madre / encargado" required />
        </Field>
        <Field label="Teléfono del representante">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="809-555-0000" required />
        </Field>
        <FormActions onCancel={onClose} loading={loading} label={initial ? "Guardar cambios" : "Agregar estudiante"} />
      </form>
    </Modal>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Eliminar",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-dark/70">{message}</p>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 rounded-xl bg-orange px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[.98] disabled:opacity-50"
        >
          {loading ? "Eliminando…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

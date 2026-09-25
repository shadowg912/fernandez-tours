"use client";

import { FormEvent, useState } from "react";
import { PayFrequency, Student } from "@/lib/types";
import { Button, Field, Input, Modal, Select, Textarea } from "./ui";

function FormActions({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return (
    <div className="mt-5 flex gap-3">
      <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" className="flex-1" disabled={loading}>
        {loading ? "Guardando…" : label}
      </Button>
    </div>
  );
}

function useFakeSubmit(onDone: () => void) {
  const [loading, setLoading] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onDone();
    }, 700);
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
  onSaved: () => void;
}) {
  const { submit, loading } = useFakeSubmit(onSaved);
  return (
    <Modal open={open} onClose={onClose} title="Nuevo servicio">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Cliente">
          <Input placeholder="Nombre del cliente" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <Input type="date" defaultValue="2026-09-24" required />
          </Field>
          <Field label="Hora">
            <Input type="time" defaultValue="08:00" required />
          </Field>
        </div>
        <Field label="Lugar de recogida">
          <Input placeholder="Ej. Santiago, Calle del Sol" required />
        </Field>
        <Field label="Destino">
          <Input placeholder="Ej. La Vega" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pasajeros">
            <Input type="number" min={1} defaultValue={1} required />
          </Field>
          <Field label="Precio (RD$)">
            <Input type="number" min={0} placeholder="2500" required />
          </Field>
        </div>
        <Field label="Estado">
          <Select defaultValue="confirmado">
            <option value="confirmado">Confirmado</option>
            <option value="pendiente">Pendiente</option>
          </Select>
        </Field>
        <Field label="Observaciones">
          <Textarea placeholder="Notas adicionales (opcional)" />
        </Field>
        <FormActions onCancel={onClose} loading={loading} label="Guardar servicio" />
      </form>
    </Modal>
  );
}

export function ClientForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { submit, loading } = useFakeSubmit(onSaved);
  return (
    <Modal open={open} onClose={onClose} title="Nuevo cliente">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre completo">
          <Input placeholder="Ej. Juan Pérez" required />
        </Field>
        <Field label="Teléfono">
          <Input type="tel" placeholder="809-555-0000" required />
        </Field>
        <Field label="Correo electrónico">
          <Input type="email" placeholder="opcional@example.com" />
        </Field>
        <Field label="Dirección">
          <Input placeholder="Sector, ciudad" />
        </Field>
        <Field label="Tipo de servicio">
          <Select defaultValue="regular">
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

export function PaymentForm({
  open,
  onClose,
  onSaved,
  studentName,
  defaultAmount,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  studentName?: string;
  defaultAmount?: number;
}) {
  const { submit, loading } = useFakeSubmit(onSaved);
  return (
    <Modal open={open} onClose={onClose} title="Registrar pago">
      <form onSubmit={submit} className="space-y-4">
        <Field label={studentName ? "Estudiante" : "Cliente"}>
          <Input defaultValue={studentName ?? ""} placeholder="Nombre" required readOnly={!!studentName} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Periodo">
            <Select defaultValue="2026-09">
              <option value="2026-09">Septiembre 2026</option>
              <option value="2026-10">Octubre 2026</option>
            </Select>
          </Field>
          <Field label="Monto (RD$)">
            <Input type="number" min={0} defaultValue={defaultAmount} placeholder="0" required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <Input type="date" defaultValue="2026-09-24" required />
          </Field>
          <Field label="Método de pago">
            <Select defaultValue="efectivo">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </Select>
          </Field>
        </div>
        <Field label="Observación">
          <Textarea placeholder="Notas (opcional)" />
        </Field>
        <FormActions onCancel={onClose} loading={loading} label="Registrar pago" />
      </form>
    </Modal>
  );
}

/* ---------- CRUD Estudiantes ---------- */
const allDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export type StudentDraft = Omit<Student, "id">;

export function StudentForm({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (draft: StudentDraft) => void;
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
  onSaved: (draft: StudentDraft) => void;
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

  const toggleDay = (d: string) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSaved({
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
        <FormActions onCancel={onClose} loading={false} label={initial ? "Guardar cambios" : "Agregar estudiante"} />
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
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-dark/70">{message}</p>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-orange px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[.98]"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

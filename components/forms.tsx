"use client";

import { FormEvent, useState } from "react";
import { Client, DailyRoute, DailyRouteDraft, PayFrequency, Payment, PaymentMethod, PaymentStatus, Route, RoutePaymentDraft, Service, ServiceStatus, Student, StudentDraft } from "@/lib/types";
import { Button, ErrorBanner, Field, Input, Modal, SearchSelect, Select, Textarea } from "./ui";
import { useMoneyInput } from "@/lib/hooks/useMoneyInput";
import { formatDateShort, formatMoney } from "@/lib/format";

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

  const priceInput = useMoneyInput();

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
            <Input
              name="price"
              type="number"
              min={0}
              placeholder="2500"
              required
              value={priceInput.value}
              onChange={priceInput.onChange}
              onBlur={priceInput.onBlur}
            />
          </Field>
        </div>
        <Field label="Estado">
          <Select name="status" defaultValue="confirmado">
            <option value="confirmado">Confirmado</option>
            <option value="pendiente_confirmacion">Por confirmar</option>
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
    status: (String(fd.get("status") ?? "pendiente_confirmacion") as T),
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
  clientName: string;
  concept: string;
  date: string;
  method: PaymentMethod;
  period?: string;
  observation?: string;
  amount: number;
  status: PaymentStatus;
  advance: boolean;
  studentId?: string;
  clientId?: string;
  serviceId?: string;
}

export function PaymentForm({
  open,
  onClose,
  onSaved,
  studentName,
  defaultAmount,
  initial,
  students = [],
  clients = [],
  services = [],
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (result: PaymentFormResult) => void | Promise<void>;
  studentName?: string;
  defaultAmount?: number;
  initial?: Payment;
  students?: Student[];
  clients?: Client[];
  services?: Service[];
}) {
  if (!open) return null;
  return (
    <PaymentFormBody
      onClose={onClose}
      onSaved={onSaved}
      studentName={studentName}
      defaultAmount={defaultAmount}
      initial={initial}
      students={students}
      clients={clients}
      services={services}
    />
  );
}

function PaymentFormBody({
  onClose,
  onSaved,
  studentName,
  defaultAmount,
  initial,
  students,
  clients,
  services,
}: {
  onClose: () => void;
  onSaved: (result: PaymentFormResult) => void | Promise<void>;
  studentName?: string;
  defaultAmount?: number;
  initial?: Payment;
  students: Student[];
  clients: Client[];
  services: Service[];
}) {
  const isStudentMode = !!studentName;

  const [recipient, setRecipient] = useState<"servicio" | "estudiante" | "cliente" | "otro">(
    initial?.serviceId
      ? "servicio"
      : initial?.studentId
        ? "estudiante"
        : initial?.clientId
          ? "cliente"
          : isStudentMode
            ? "estudiante"
            : "servicio"
  );
  const [studentId, setStudentId] = useState(initial?.studentId ?? "");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [serviceId, setServiceId] = useState(initial?.serviceId ?? "");
  const [advance, setAdvance] = useState(initial?.advance ?? false);
  const [status, setStatus] = useState<PaymentStatus>(initial?.status ?? "completado");
  const [error, setError] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === serviceId);
  const servicePaid = selectedService?.paidAmount ?? 0;
  const servicePending = selectedService ? Math.max(0, selectedService.price - servicePaid) : 0;
  const editingOwnService = Boolean(initial?.serviceId && initial.serviceId === serviceId);

  const conceptDefault = selectedService
    ? editingOwnService
      ? initial?.concept ?? ""
      : `Servicio: ${selectedService.origin} → ${selectedService.destination}`
    : initial?.concept ?? "";

  const amountDefault = selectedService
    ? editingOwnService
      ? String(initial?.amount ?? "")
      : String(servicePending)
    : initial
      ? String(initial.amount)
      : defaultAmount
        ? String(defaultAmount)
        : "";

  const periodDefault = selectedService
    ? editingOwnService
      ? initial?.period ?? selectedService.date.slice(0, 7)
      : selectedService.date.slice(0, 7)
    : initial?.period ?? new Date().toISOString().slice(0, 7);

  const handleServiceChange = (id: string) => {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (id && svc && initial?.serviceId !== id) {
      setAdvance(svc.status !== "completado");
    }
    if (!id) setAdvance(initial?.advance ?? false);
  };

  const { submit, loading } = useSubmit(async () => {
    const form = document.getElementById("payment-form") as HTMLFormElement;
    const fd = new FormData(form);

    let resolvedName = "";
    let resolvedStudentId: string | undefined;
    let resolvedClientId: string | undefined;
    let resolvedServiceId: string | undefined;

    if (isStudentMode) {
      resolvedName = studentName ?? "";
    } else if (recipient === "servicio") {
      const svc = services.find((s) => s.id === serviceId);
      if (!svc) return setError("Selecciona un servicio.");
      resolvedName = svc.clientName;
      resolvedServiceId = svc.id;
    } else if (recipient === "estudiante") {
      const st = students.find((s) => s.id === studentId);
      if (!st) return setError("Selecciona un estudiante.");
      resolvedName = st.name;
      resolvedStudentId = st.id;
    } else if (recipient === "cliente") {
      const cl = clients.find((c) => c.id === clientId);
      if (!cl) return setError("Selecciona un cliente.");
      resolvedName = cl.name;
      resolvedClientId = cl.id;
    } else {
      resolvedName = String(fd.get("otherName") ?? "").trim();
      if (!resolvedName) return setError("Escribe el nombre de la persona.");
    }

    const concept =
      String(fd.get("concept") ?? "").trim() ||
      (recipient === "servicio" && selectedService
        ? `Servicio: ${selectedService.origin} → ${selectedService.destination}`
        : recipient === "estudiante" || isStudentMode
          ? "Transporte estudiantil"
          : "Pago");
    const period = String(fd.get("period") ?? "").trim();
    const observation = String(fd.get("observation") ?? "").trim();

    setError(null);
    await onSaved({
      clientName: resolvedName,
      concept,
      date: String(fd.get("date") ?? ""),
      method: String(fd.get("method") ?? "efectivo") as PaymentMethod,
      amount: Number(fd.get("amount")) || 0,
      status,
      advance,
      studentId: resolvedStudentId,
      clientId: resolvedClientId,
      serviceId: resolvedServiceId,
      ...(period ? { period } : {}),
      ...(observation ? { observation } : {}),
    });
  });

  const studentOptions = students.map((s) => ({ value: s.id, label: s.school ? `${s.name} · ${s.school}` : s.name }));
  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));
  const serviceOptions = [...services]
    .filter((s) => s.status !== "cancelado" || s.id === initial?.serviceId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => ({
      value: s.id,
      label: `${formatDateShort(s.date)} · ${s.clientName} · ${s.origin} → ${s.destination}`,
    }));

  const recipientOptions: { value: typeof recipient; label: string }[] = [
    { value: "servicio", label: "Servicio" },
    { value: "estudiante", label: "Estudiante" },
    { value: "otro", label: "Otro" },
  ];
  if (initial?.clientId || recipient === "cliente") {
    recipientOptions.push({ value: "cliente", label: "Cliente" });
  }

  return (
    <Modal open onClose={onClose} title={initial ? "Editar pago" : "Registrar pago"}>
      <form id="payment-form" onSubmit={submit} className="space-y-4">
        {isStudentMode ? (
          <Field label="Estudiante">
            <Input value={studentName ?? ""} readOnly />
          </Field>
        ) : (
          <>
            <Field label="Destinatario">
              <div className="flex flex-wrap gap-2">
                {recipientOptions.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRecipient(r.value)}
                    className={`min-w-[88px] flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      recipient === r.value
                        ? "bg-teal text-white shadow-sm"
                        : "bg-white text-dark/70 border border-dark/10 hover:border-teal"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </Field>

            {recipient === "servicio" && (
              <>
                <Field label="Servicio">
                  <SearchSelect
                    options={serviceOptions}
                    value={serviceId}
                    onChange={handleServiceChange}
                    placeholder={services.length ? "Buscar servicio…" : "No hay servicios registrados"}
                    disabled={services.length === 0}
                  />
                </Field>

                {selectedService && (
                  <div className="rounded-xl border border-teal/20 bg-teal/5 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-dark/60">Precio</span>
                      <span className="font-semibold">{formatMoney(selectedService.price)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-dark/60">Pagado</span>
                      <span className="font-semibold text-green">{formatMoney(servicePaid)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-dark/60">Pendiente</span>
                      <span className={`font-bold ${servicePending > 0 ? "text-orange" : "text-green"}`}>
                        {formatMoney(servicePending)}
                      </span>
                    </div>
                    {servicePending <= 0 && !editingOwnService && (
                      <p className="mt-2 text-xs text-green">Este servicio ya está pagado.</p>
                    )}
                  </div>
                )}
              </>
            )}
            {recipient === "estudiante" && (
              <Field label="Estudiante">
                <SearchSelect options={studentOptions} value={studentId} onChange={setStudentId} placeholder="Buscar estudiante…" />
              </Field>
            )}
            {recipient === "cliente" && (
              <Field label="Cliente">
                <SearchSelect options={clientOptions} value={clientId} onChange={setClientId} placeholder="Buscar cliente…" />
              </Field>
            )}
            {recipient === "otro" && (
              <Field label="Nombre">
                <Input
                  name="otherName"
                  defaultValue={initial && !initial.studentId && !initial.clientId && !initial.serviceId ? initial.clientName : ""}
                  placeholder="Nombre de la persona"
                />
              </Field>
            )}
          </>
        )}

        <Field label="Concepto">
          <Input
            key={`concept-${serviceId}`}
            name="concept"
            defaultValue={conceptDefault}
            placeholder="Ej. Mensualidad de octubre / Servicio Santiago → La Vega"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Periodo">
            <Input key={`period-${serviceId}`} name="period" type="month" defaultValue={periodDefault} />
          </Field>
          <Field label="Monto (RD$)">
            <Input
              key={`amount-${serviceId}`}
              name="amount"
              type="number"
              min={0}
              placeholder="0"
              required
              defaultValue={amountDefault}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <Input name="date" type="date" required defaultValue={initial?.date ?? new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Método de pago">
            <Select name="method" defaultValue={initial?.method ?? "efectivo"}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Estado">
            <Select value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)}>
              <option value="completado">Completado</option>
              <option value="pendiente">Pendiente</option>
            </Select>
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm font-medium text-dark/80">
              <input
                type="checkbox"
                checked={advance}
                onChange={(e) => setAdvance(e.target.checked)}
                className="h-5 w-5 rounded border-dark/20 accent-teal"
              />
              Pago por adelantado
            </label>
          </div>
        </div>

        <Field label="Observación">
          <Textarea name="observation" defaultValue={initial?.observation ?? ""} placeholder="Notas (opcional)" />
        </Field>

        {error && <ErrorBanner message={error} />}

        <FormActions onCancel={onClose} loading={loading} label={initial ? "Guardar cambios" : "Registrar pago"} />
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
  routes = [],
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (draft: StudentDraft) => void | Promise<void>;
  initial?: Student | null;
  routes?: Route[];
}) {
  if (!open) return null;
  return <StudentFormInner key={initial?.id ?? "new"} onClose={onClose} onSaved={onSaved} initial={initial ?? null} routes={routes} />;
}

function StudentFormInner({
  onClose,
  onSaved,
  initial,
  routes = [],
}: {
  onClose: () => void;
  onSaved: (draft: StudentDraft) => void | Promise<void>;
  initial: Student | null;
  routes?: Route[];
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [school, setSchool] = useState(initial?.school ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [entryTime, setEntryTime] = useState(initial?.entryTime ?? "07:00");
  const [exitTime, setExitTime] = useState(initial?.exitTime ?? "14:00");
  const [days, setDays] = useState<string[]>(initial?.days ?? []);
  const [frequency, setFrequency] = useState<PayFrequency>(initial?.frequency ?? "mensual");
  const [monthlyFee, setMonthlyFee] = useState(initial ? String(initial.monthlyFee) : "");
  const [guardian, setGuardian] = useState(initial?.guardian ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [routeId, setRouteId] = useState(initial?.routeId ?? "");
  const [loading, setLoading] = useState(false);

  const toggleDay = (d: string) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    
    const missing: string[] = [];
    if (!name.trim()) missing.push("Nombre del estudiante");
    if (!monthlyFee || Number(monthlyFee) <= 0) missing.push("Tarifa (RD$)");
    if (days.length === 0) missing.push("Días de transporte");
    
    if (missing.length > 0) {
      alert(`Faltan campos obligatorios:\n• ${missing.join("\n• ")}`);
      return;
    }
    
    setLoading(true);
    try {
      await onSaved({
        name: name.trim(),
        school: school.trim() || undefined,
        address: address.trim() || undefined,
        entryTime,
        exitTime,
        days,
        frequency,
        monthlyFee: Number(monthlyFee) || 0,
        guardian: guardian.trim() || undefined,
        phone: phone.trim() || undefined,
        routeId: routeId || undefined,
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
        <Field label="Escuela / Colegio (opcional)">
          <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Ej. Colegio San José" />
        </Field>
        <Field label="Dirección de recogida">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Sector, ciudad (opcional)" />
        </Field>
        <Field label="Ruta">
          <Select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            <option value="">— Sin ruta —</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora de entrada">
            <Input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} required />
          </Field>
          <Field label="Hora de salida">
            <Input type="time" value={exitTime} onChange={(e) => setExitTime(e.target.value)} required />
          </Field>
        </div>
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
            <Input
              type="number"
              min={0}
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              placeholder="4500"
              required
            />
          </Field>
        </div>
        <Field label="Representante">
          <Input value={guardian} onChange={(e) => setGuardian(e.target.value)} placeholder="Padre / madre / encargado (opcional)" />
        </Field>
        <Field label="Teléfono del representante">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="809-555-0000 (opcional)" />
        </Field>
        <FormActions onCancel={onClose} loading={loading} label={initial ? "Guardar cambios" : "Agregar estudiante"} />
      </form>
    </Modal>
  );
}

/* ---------- Rutas (estudiantes) ---------- */
const routeColors = [
  { value: "#16a34a", label: "Verde" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#2563eb", label: "Azul" },
  { value: "#9333ea", label: "Púrpura" },
  { value: "#db2777", label: "Rosa" },
  { value: "#ea580c", label: "Naranja" },
  { value: "#ca8a04", label: "Amarillo" },
];

export function RouteForm({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (draft: { name: string; description?: string; color: string }) => void | Promise<void>;
  initial?: Route | null;
}) {
  if (!open) return null;
  return <RouteFormInner key={initial?.id ?? "new"} onClose={onClose} onSaved={onSaved} initial={initial ?? null} />;
}

function RouteFormInner({
  onClose,
  onSaved,
  initial,
}: {
  onClose: () => void;
  onSaved: (draft: { name: string; description?: string; color: string }) => void | Promise<void>;
  initial: Route | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? "#16a34a");

  const { submit, loading: submitLoading } = useSubmit(async () => {
    if (!name.trim()) {
      alert("El nombre de la ruta es obligatorio");
      return;
    }
    try {
      await onSaved({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
    } catch {
      // Error handled by useSubmit
    }
  });

  return (
    <Modal open={true} onClose={onClose} title={initial ? "Editar ruta" : "Nueva ruta"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre de la ruta">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. IPISA-IPIDBOSCO" required />
        </Field>
        <Field label="Descripción (opcional)">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles de la ruta" />
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {routeColors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-10 h-10 rounded-xl border-3 transition-all ${
                  color === c.value ? "border-white ring-2 ring-offset-2 ring-teal scale-105" : "border-dark/10 hover:border-teal"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </Field>
        <FormActions onCancel={onClose} loading={submitLoading} label={initial ? "Guardar cambios" : "Crear ruta"} />
      </form>
    </Modal>
  );
}

/* ---------- CRUD Rutas Diarias ---------- */
const weekDays = [
  { value: "Mon", label: "Lun" },
  { value: "Tue", label: "Mar" },
  { value: "Wed", label: "Mié" },
  { value: "Thu", label: "Jue" },
  { value: "Fri", label: "Vie" },
  { value: "Sat", label: "Sáb" },
  { value: "Sun", label: "Dom" },
];

export function DailyRouteForm({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (draft: DailyRouteDraft) => void | Promise<void>;
  initial?: DailyRoute | null;
}) {
  if (!open) return null;
  return <DailyRouteFormInner key={initial?.id ?? "new"} onClose={onClose} onSaved={onSaved} initial={initial ?? null} />;
}

function DailyRouteFormInner({
  onClose,
  onSaved,
  initial,
}: {
  onClose: () => void;
  onSaved: (draft: DailyRouteDraft) => void | Promise<void>;
  initial: DailyRoute | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [dailyFee, setDailyFee] = useState(initial ? String(initial.dailyFee) : "");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(initial?.daysOfWeek ?? []);
  const [generationWindowDays, setGenerationWindowDays] = useState(initial ? String(initial.generationWindowDays) : "60");

  const toggleDay = (d: string) =>
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const { submit, loading: submitLoading } = useSubmit(async () => {
    if (!name.trim()) {
      alert("El nombre de la ruta es obligatorio");
      return;
    }
    if (!dailyFee || Number(dailyFee) <= 0) {
      alert("La tarifa diaria es obligatoria");
      return;
    }
    if (daysOfWeek.length === 0) {
      alert("Selecciona al menos un día de la semana");
      return;
    }
    if (!generationWindowDays || Number(generationWindowDays) <= 0) {
      alert("La ventana de generación (días) es obligatoria");
      return;
    }
    try {
      await onSaved({
        name: name.trim(),
        dailyFee: Number(dailyFee),
        daysOfWeek,
        generationWindowDays: Number(generationWindowDays),
      });
    } catch {
      // Error handled by useSubmit
    }
  });

  return (
    <Modal open={true} onClose={onClose} title={initial ? "Editar ruta diaria" : "Nueva ruta diaria"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre de la ruta">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Ruta Norte" required />
        </Field>
        <Field label="Tarifa diaria (RD$)">
          <Input
            type="number"
            min={0}
            value={dailyFee}
            onChange={(e) => setDailyFee(e.target.value)}
            placeholder="2500"
            required
          />
        </Field>
        <Field label="Días de la semana">
          <div className="flex flex-wrap gap-2">
            {weekDays.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  daysOfWeek.includes(d.value) ? "bg-teal text-white" : "bg-white text-dark/70 border border-dark/15"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Ventana de generación (días)">
          <Input
            type="number"
            min={1}
            value={generationWindowDays}
            onChange={(e) => setGenerationWindowDays(e.target.value)}
            placeholder="60"
            required
          />
        </Field>
        <FormActions onCancel={onClose} loading={submitLoading} label={initial ? "Guardar cambios" : "Crear ruta"} />
      </form>
    </Modal>
  );
}

export function RoutePaymentForm({
  open,
  onClose,
  onSaved,
  routes,
  initialRouteId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (draft: RoutePaymentDraft) => void | Promise<void>;
  routes: DailyRoute[];
  initialRouteId?: string;
}) {
  if (!open) return null;
  return (
    <RoutePaymentFormInner
      key={initialRouteId ?? "new"}
      onClose={onClose}
      onSaved={onSaved}
      routes={routes}
      initialRouteId={initialRouteId}
    />
  );
}

function RoutePaymentFormInner({
  onClose,
  onSaved,
  routes,
  initialRouteId,
}: {
  onClose: () => void;
  onSaved: (draft: RoutePaymentDraft) => void | Promise<void>;
  routes: DailyRoute[];
  initialRouteId?: string;
}) {
  const [routeId, setRouteId] = useState(initialRouteId ?? "");
  const [days, setDays] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [observation, setObservation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const route = routes.find((r) => r.id === routeId);
  const fee = route?.dailyFee ?? 0;
  const daysNum = Math.floor(Number(days) || 0);
  const total = fee * daysNum;

  const { submit, loading } = useSubmit(async () => {
    if (!routeId) return setError("Selecciona una ruta.");
    if (daysNum <= 0) return setError("Indica al menos 1 día a pagar.");
    setError(null);
    const obs = observation.trim();
    await onSaved({
      routeId,
      daysPaid: daysNum,
      paymentDate,
      method,
      ...(obs ? { observation: obs } : {}),
    });
  });

  return (
    <Modal open onClose={onClose} title="Registrar pago de ruta">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ruta a cobrar">
          <Select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            <option value="">— Selecciona una ruta —</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tarifa por día">
            <Input value={route ? formatMoney(fee) : "—"} readOnly tabIndex={-1} />
          </Field>
          <Field label="Días a pagar">
            <Input
              type="number"
              min={1}
              step={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="Ej. 21"
              required
            />
          </Field>
        </div>

        <div className="rounded-xl border border-dark/10 bg-white px-4 py-3">
          <p className="text-sm text-dark/60">Total a pagar</p>
          <p className="text-2xl font-bold tabular-nums text-dark-teal">{formatMoney(total)}</p>
          <p className="mt-0.5 text-xs text-dark/50">
            {daysNum > 0 ? `${daysNum} día${daysNum === 1 ? "" : "s"} × ${formatMoney(fee)}` : "Ingresa los días a pagar"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha de pago">
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
          </Field>
          <Field label="Método de pago">
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </Select>
          </Field>
        </div>

        <Field label="Observación">
          <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Notas (opcional)" />
        </Field>

        {error && <ErrorBanner message={error} />}

        <FormActions onCancel={onClose} loading={loading} label="Registrar pago" />
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
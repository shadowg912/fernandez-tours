"use client";

import { useEffect, useState } from "react";
import { students as initialStudents } from "@/lib/data";
import { Student } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { StudentCard, SummaryCard } from "@/components/cards";
import { Avatar, Button, Chip, EmptyState, Modal, Toast } from "@/components/ui";
import { ConfirmDialog, PaymentForm, StudentDraft, StudentForm } from "@/components/forms";
import { IconCheck, IconPhone, IconPlus } from "@/components/icons";

type Filter = "todos" | "pagado" | "pendiente" | "mensual" | "quincenal" | "semanal";

const filters: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pagado", label: "Pagados" },
  { value: "pendiente", label: "Pendientes" },
  { value: "mensual", label: "Mensual" },
  { value: "quincenal", label: "Quincenal" },
  { value: "semanal", label: "Semanal" },
];

const frequencyLabel = { mensual: "Mensual", quincenal: "Quincenal", semanal: "Semanal" } as const;

export default function TransportePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filter, setFilter] = useState<Filter>("todos");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [payStudent, setPayStudent] = useState<Student | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setStudents(initialStudents), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const pending = students.filter((s) => !s.paid);
  const monthlyTotal = students.reduce((sum, s) => sum + s.monthlyFee, 0);
  const collected = students.filter((s) => s.paid).reduce((sum, s) => sum + s.monthlyFee, 0);

  const filtered = students.filter((s) => {
    if (filter === "todos") return true;
    if (filter === "pagado") return s.paid;
    if (filter === "pendiente") return !s.paid;
    return s.frequency === filter;
  });

  const selected = students.find((s) => s.id === selectedId) ?? null;

  /* ---- CRUD ---- */
  const createStudent = (draft: StudentDraft) => {
    const id = `st-${Date.now()}`;
    setStudents((prev) => [{ ...draft, id }, ...prev]);
    setFormOpen(false);
    setToast("Estudiante agregado");
  };

  const updateStudent = (draft: StudentDraft) => {
    if (!editing) return;
    setStudents((prev) => prev.map((s) => (s.id === editing.id ? { ...draft, id: editing.id } : s)));
    setEditing(null);
    setToast("Cambios guardados");
  };

  const deleteStudent = () => {
    if (!deleting) return;
    setStudents((prev) => prev.filter((s) => s.id !== deleting.id));
    setDeleting(null);
    setSelectedId(null);
    setToast("Estudiante eliminado");
  };

  const markPaid = (student: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, paid: true } : s)));
    setPayStudent(null);
    setSelectedId(null);
    setToast(`Pago registrado para ${student.name}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Transporte estudiantil</h1>
          <p className="text-sm text-dark/60">Septiembre 2026</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <IconPlus className="h-5 w-5" /> <span className="hidden sm:inline">Nuevo estudiante</span><span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      <section className="flex flex-wrap gap-3">
        <SummaryCard value={String(students.length)} label="Estudiantes" />
        <SummaryCard value={formatMoney(collected)} label="Cobrado" />
        <SummaryCard value={formatMoney(monthlyTotal - collected)} label="Pendiente" accent />
      </section>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.value ? "bg-teal text-white" : "bg-white text-dark/70 border border-dark/10 hover:border-teal"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {pending.length > 0 && filter === "todos" && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Pagos pendientes</h2>
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {pending.map((s) => (
              <StudentCard key={s.id} student={s} onPay={() => setPayStudent(s)} onClick={() => setSelectedId(s.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">
          {filter === "todos" ? "Todos los estudiantes" : filters.find((f) => f.value === filter)?.label}
        </h2>
        {filtered.length === 0 ? (
          <EmptyState
            title="No hay estudiantes"
            message={filter === "todos" ? "Agrega tu primer estudiante con el botón de arriba." : "Ningún estudiante coincide con este filtro."}
          />
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3 md:space-y-0">
            {filtered.map((s) => (
              <StudentCard key={s.id} student={s} onPay={() => setPayStudent(s)} onClick={() => setSelectedId(s.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Crear */}
      <StudentForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={createStudent} />

      {/* Editar */}
      <StudentForm open={editing !== null} onClose={() => setEditing(null)} onSaved={updateStudent} initial={editing} />

      {/* Eliminar */}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={deleteStudent}
        title="Eliminar estudiante"
        message={`¿Eliminar a ${deleting?.name ?? ""}? Esta acción no se puede deshacer.`}
      />

      {/* Pagar */}
      <PaymentForm
        open={payStudent !== null}
        onClose={() => setPayStudent(null)}
        studentName={payStudent?.name}
        defaultAmount={payStudent?.monthlyFee}
        onSaved={() => payStudent && markPaid(payStudent)}
      />

      {/* Detalle */}
      <Modal open={selected !== null} onClose={() => setSelectedId(null)} title="Detalle del estudiante">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} size="lg" />
              <div>
                <p className="text-lg font-bold leading-tight">{selected.name}</p>
                <p className="text-sm text-dark/60">{selected.school}</p>
                {selected.paid ? <Chip tone="teal">Pagado</Chip> : <Chip tone="danger">Pendiente</Chip>}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-dark/5 p-4 text-sm space-y-1.5">
              <p><span className="font-semibold">Dirección:</span> {selected.address}</p>
              <p><span className="font-semibold">Horario:</span> {selected.schedule}</p>
              <p><span className="font-semibold">Días:</span> {selected.days.join(" • ")}</p>
              <p><span className="font-semibold">Frecuencia:</span> {frequencyLabel[selected.frequency]}</p>
              <p>
                <span className="font-semibold">Tarifa:</span>{" "}
                <span className="text-gold-deep font-bold">{formatMoney(selected.monthlyFee)}</span>
              </p>
              <p className="flex items-center gap-1">
                <span className="font-semibold">Representante:</span> {selected.guardian}
              </p>
              <p className="flex items-center gap-1.5">
                <IconPhone className="h-4 w-4 text-dark/40" /> {selected.phone}
              </p>
            </div>

            {!selected.paid && (
              <Button className="w-full" onClick={() => setPayStudent(selected)}>
                <IconCheck className="h-5 w-5" /> Registrar pago
              </Button>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setEditing(selected)}>
                Editar
              </Button>
              <button
                onClick={() => setDeleting(selected)}
                className="flex-1 rounded-xl border border-orange/40 bg-orange/10 px-4 py-3 text-sm font-bold text-orange transition-all hover:bg-orange/20 active:scale-[.98]"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Route, Student } from "@/lib/types";
import { periodRange } from "@/lib/dates";
import { formatDateWithYear } from "@/lib/format";
import { loadStudentPayments } from "@/app/(app)/transporte/actions";
import { Button, ErrorBanner, Field, Input, Modal, Select } from "./ui";
import { StudentReceiptData } from "./receipts";

type RangeKind = "mensual" | "trimestral" | "personalizado";

const rangeOptions: { value: RangeKind; label: string }[] = [
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "personalizado", label: "Personalizado" },
];

export function StudentReceiptDialog({
  students,
  routes,
  onClose,
  onGenerated,
}: {
  students: Student[];
  routes: Route[];
  onClose: () => void;
  onGenerated: (data: StudentReceiptData) => void;
}) {
  const monthly = useMemo(() => periodRange("mensual"), []);
  const quarterlyFrom = useMemo(() => periodRange("trimestral").from, []);
  const hasUnassigned = useMemo(() => students.some((s) => !s.routeId), [students]);

  const [routeKey, setRouteKey] = useState("");
  const [studentId, setStudentId] = useState("");
  const [kind, setKind] = useState<RangeKind>("mensual");
  const [customFrom, setCustomFrom] = useState(monthly.from);
  const [customTo, setCustomTo] = useState(monthly.to);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeStudents = useMemo(() => {
    if (!routeKey) return [];
    if (routeKey === "none") return students.filter((s) => !s.routeId);
    return students.filter((s) => s.routeId === routeKey);
  }, [students, routeKey]);

  const selectedStudent = routeStudents.find((s) => s.id === studentId) ?? null;

  const range =
    kind === "mensual"
      ? monthly
      : kind === "trimestral"
        ? { from: quarterlyFrom, to: monthly.to }
        : { from: customFrom, to: customTo };
  const validRange = Boolean(range.from && range.to && range.from <= range.to);

  const handleRouteChange = (value: string) => {
    setRouteKey(value);
    setStudentId("");
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedStudent) {
      setError("Selecciona un estudiante.");
      return;
    }
    if (!validRange) return;

    setLoading(true);
    setError(null);
    try {
      const payments = await loadStudentPayments(selectedStudent.id, range.from, range.to);
      if (payments.length === 0) {
        setError("No hay pagos completados en ese periodo.");
        return;
      }

      const routeName = routes.find((r) => r.id === selectedStudent.routeId)?.name;
      onGenerated({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        school: selectedStudent.school,
        routeName,
        frequency: selectedStudent.frequency,
        monthlyFee: selectedStudent.monthlyFee,
        from: range.from,
        to: range.to,
        payments: payments.map((p) => ({
          id: p.id,
          date: p.date,
          concept: p.concept,
          amount: p.amount,
          method: p.method,
          period: p.period,
        })),
      });
    } catch {
      setError("No se pudieron cargar los pagos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Recibo de estudiante">
      <div className="space-y-4">
        <p className="text-sm text-dark/60">
          Elige la ruta, el estudiante y el periodo. El recibo incluye solo los pagos completados del rango.
        </p>

        <Field label="Ruta">
          <Select value={routeKey} onChange={(e) => handleRouteChange(e.target.value)}>
            <option value="">Selecciona una ruta</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
            {hasUnassigned && <option value="none">Sin ruta</option>}
          </Select>
        </Field>

        <Field label="Estudiante">
          <Select
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              setError(null);
            }}
            disabled={!routeKey || routeStudents.length === 0}
          >
            <option value="">
              {!routeKey
                ? "Primero selecciona una ruta"
                : routeStudents.length === 0
                  ? "No hay estudiantes en esta ruta"
                  : "Selecciona un estudiante"}
            </option>
            {routeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.school ? `${s.name} · ${s.school}` : s.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Periodo">
          <div className="flex gap-2">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setKind(option.value);
                  setError(null);
                }}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  kind === option.value
                    ? "bg-teal text-white shadow-sm"
                    : "border border-dark/10 bg-white text-dark/70 hover:border-teal"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        {kind === "personalizado" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setError(null);
                }}
              />
            </Field>
            <Field label="Hasta">
              <Input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setError(null);
                }}
              />
            </Field>
          </div>
        )}

        <div className="rounded-xl border border-teal/20 bg-teal/5 px-3 py-2.5 text-sm">
          <span className="text-dark/60">Del </span>
          <span className="font-semibold text-dark">{formatDateWithYear(range.from || monthly.from)}</span>
          <span className="text-dark/60"> al </span>
          <span className="font-semibold text-dark">{formatDateWithYear(range.to || monthly.to)}</span>
        </div>

        {!validRange && (
          <p className="text-xs font-medium text-orange">
            {!range.from || !range.to
              ? "Completa las fechas del periodo."
              : "La fecha «desde» no puede ser mayor que la fecha «hasta»."}
          </p>
        )}

        {error && <ErrorBanner message={error} />}

        <Button
          type="button"
          className="w-full"
          onClick={handleGenerate}
          disabled={!selectedStudent || loading}
        >
          {loading ? "Buscando pagos…" : "Generar recibo"}
        </Button>
      </div>
    </Modal>
  );
}

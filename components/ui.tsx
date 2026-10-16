"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect, useId, useRef, useState } from "react";
import { ServiceStatus } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { IconX } from "./icons";

/* ---------- Badge ---------- */
const statusStyles: Record<ServiceStatus, string> = {
  pendiente_confirmacion: "bg-yellow/15 text-yellow-700",
  confirmado: "bg-teal/15 text-dark-teal",
  completado: "bg-green/15 text-green",
  cancelado: "bg-dark/10 text-dark/60",
};

export function StatusBadge({ status }: { status: ServiceStatus }) {
  const labels: Record<ServiceStatus, string> = {
    pendiente_confirmacion: "Por confirmar",
    confirmado: "Confirmado",
    completado: "Completado",
    cancelado: "Cancelado",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusStyles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function Chip({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "gold" | "teal" | "danger" }) {
  const tones = {
    default: "bg-dark/8 text-dark/70",
    gold: "bg-gold/15 text-gold-deep",
    teal: "bg-teal/15 text-dark-teal",
    danger: "bg-orange/15 text-orange",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ---------- Card ---------- */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-dark/5 ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Button ---------- */
type ButtonVariant = "primary" | "secondary" | "ghost" | "gold";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-teal text-white hover:bg-dark-teal active:scale-[.98]",
    gold: "bg-gold text-white hover:bg-light-gold hover:text-dark active:scale-[.98]",
    secondary: "bg-white text-dark border border-dark/15 hover:border-teal hover:text-dark-teal active:scale-[.98]",
    ghost: "text-dark-teal hover:bg-teal/10 active:scale-[.98]",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

/* ---------- Form fields ---------- */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-dark/80">{label}</span>
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-dark/15 bg-white px-4 py-3 text-sm text-dark placeholder:text-dark/40 focus:border-teal";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputBase} {...props} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputBase} appearance-none`} {...props}>
      {children}
    </select>
  );
}

/* ---------- SearchSelect (select con búsqueda) ---------- */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Escribir para buscar…",
  disabled = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        value={open ? query : selected?.label ?? ""}
        placeholder={selected ? selected.label : placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        className={`${inputBase} pr-9`}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-dark/40">▾</span>
      {open && (
        <ul id={listId} className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-dark/10 bg-white py-1 shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-4 py-2 text-sm text-dark/50">Sin resultados</li>
          ) : (
            filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-teal/10 ${
                    o.value === value ? "bg-teal/5 font-semibold text-dark-teal" : ""
                  }`}
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} className={`${inputBase} resize-none`} {...props} />;
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-cream rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[88vh] flex flex-col animate-[slideUp_.25s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark/10">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 rounded-full hover:bg-dark/10 transition-colors">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ---------- Estados ---------- */
export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-beige/30 text-gold text-xl">
        ◌
      </div>
      <p className="font-semibold">{title}</p>
      {message && <p className="mt-1 text-sm text-dark/60">{message}</p>}
    </Card>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-medium text-orange">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-green/30 bg-green/10 px-4 py-3 text-sm font-medium text-green">
      {message}
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-24 md:bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="bg-dark text-cream rounded-full px-5 py-3 text-sm font-medium shadow-lg">
        {message}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="h-3 w-24 rounded bg-dark/10" />
      <div className="mt-3 h-4 w-40 rounded bg-dark/10" />
      <div className="mt-2 h-3 w-32 rounded bg-dark/10" />
      <div className="mt-4 flex justify-between">
        <div className="h-3 w-16 rounded bg-dark/10" />
        <div className="h-5 w-20 rounded-full bg-dark/10" />
      </div>
    </Card>
  );
}

export function Money({ amount, className = "" }: { amount: number; className?: string }) {
  const text = formatMoney(amount);
  const size = text.length > 9 ? "text-sm" : text.length > 8 ? "text-[15px]" : "text-base";
  return (
    <span className={`font-bold tabular-nums whitespace-nowrap ${size} ${className}`}>{text}</span>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const sizes = { sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg" };
  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-teal to-dark-teal text-white font-bold ${sizes[size]}`}>
      {initials}
    </div>
  );
}

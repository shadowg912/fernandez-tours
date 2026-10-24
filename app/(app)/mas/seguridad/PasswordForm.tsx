"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changePassword } from "@/lib/auth-actions";
import { Button } from "@/components/ui";
import { IconEye, IconEyeOff } from "@/components/icons";

function PasswordInput({
  id,
  name,
  label,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
}) {
  const [show, setShow] = useState(false);

  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-dark/80">{label}</span>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl border border-dark/15 bg-white px-4 py-3 pr-12 text-sm text-dark placeholder:text-dark/40 focus:border-teal"
        />
        <button
          type="button"
          onClick={() => setShow((value) => !value)}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={show}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-dark/40 transition-colors hover:bg-dark/5 hover:text-dark/70"
        >
          {show ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
        </button>
      </div>
    </label>
  );
}

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <PasswordInput
        id="currentPassword"
        name="currentPassword"
        label="Contraseña actual"
        autoComplete="current-password"
      />
      <PasswordInput
        id="newPassword"
        name="newPassword"
        label="Nueva contraseña"
        autoComplete="new-password"
      />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar nueva contraseña"
        autoComplete="new-password"
      />

      {state?.error ? (
        <p role="alert" className="rounded-xl bg-orange/10 px-4 py-3 text-sm font-medium text-orange">
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <p role="status" className="rounded-xl bg-green/10 px-4 py-3 text-sm font-medium text-green">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}

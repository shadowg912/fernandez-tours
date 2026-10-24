"use client";

import { useActionState, useState } from "react";
import { login } from "@/lib/auth-actions";
import { Button } from "@/components/ui";
import { IconEye, IconEyeOff, IconLock } from "@/components/icons";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-dark/80">
          Contraseña
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dark/35">
            <IconLock className="h-5 w-5" />
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            placeholder="Ingresa tu contraseña"
            aria-invalid={state?.error ? true : undefined}
            aria-describedby={state?.error ? "login-error" : undefined}
            className="w-full rounded-xl border border-dark/15 bg-white py-3.5 pl-12 pr-12 text-sm text-dark placeholder:text-dark/40 focus:border-teal"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-dark/40 transition-colors hover:bg-dark/5 hover:text-dark/70"
          >
            {showPassword ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {state?.error ? (
        <p
          id="login-error"
          role="alert"
          className="rounded-xl bg-orange/10 px-4 py-3 text-sm font-medium text-orange"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full py-3.5">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}

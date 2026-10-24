import { redirect } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { IconBus } from "@/components/icons";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <main className="relative min-h-screen bg-cream lg:grid lg:grid-cols-[1.05fr_1fr]">
      <ThemeToggle className="absolute right-4 top-4 z-10 text-dark/60 hover:bg-dark/5 lg:right-8 lg:top-8" />

      {/* Panel de marca */}
      <section className="relative hidden overflow-hidden bg-dark px-12 py-14 text-cream lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-light-gold/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-teal/10"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-light-gold/40 bg-light-gold/10 text-light-gold">
            <IconBus className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight text-light-gold">Fernández Tours</p>
            <p className="text-xs text-cream/50">Gestión de transporte</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-cream">
            La operación diaria,
            <br />
            <span className="text-light-gold">en un solo lugar.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/60">
            Rutas, servicios, estudiantes y pagos. Un espacio reservado para el equipo de
            Fernández Tours.
          </p>

          <div className="relative mt-12 h-36" aria-hidden="true">
            <svg viewBox="0 0 360 140" className="h-full w-full" fill="none">
              <path
                d="M8 120C60 120 70 40 140 40s100 60 160 20 40-40 52-40"
                stroke="rgba(244,197,102,0.32)"
                strokeWidth="1.5"
                strokeDasharray="4 7"
                strokeLinecap="round"
              />
              <circle cx="8" cy="120" r="4" fill="#f4c566" />
              <circle cx="140" cy="40" r="4" fill="#289c9e" />
              <circle cx="300" cy="60" r="4" fill="#f4c566" />
            </svg>
          </div>
        </div>

        <p className="relative text-xs text-cream/40">Santiago, República Dominicana</p>
      </section>

      {/* Formulario */}
      <section className="flex min-h-screen items-center justify-center px-5 py-14 sm:px-8 lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-dark text-light-gold">
              <IconBus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold tracking-tight">Fernández Tours</p>
              <p className="text-xs text-dark/50">Gestión de transporte</p>
            </div>
          </div>

          <div className="h-px w-12 bg-gold" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-dark">Bienvenida</h2>
          <p className="mt-2 text-sm leading-relaxed text-dark/60">
            Ingresa tu contraseña para entrar al panel.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-8 text-xs leading-relaxed text-dark/40">
            La sesión se mantiene activa por 72 horas sin actividad. Si usas un dispositivo
            compartido, cierra sesión al terminar.
          </p>
        </div>
      </section>
    </main>
  );
}

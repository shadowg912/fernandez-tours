import Link from "next/link";
import { Card } from "@/components/ui";
import { IconChevronLeft } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import PasswordForm from "./PasswordForm";

export const dynamic = "force-dynamic";

export default async function SeguridadPage() {
  const user = await requireUser();

  return (
    <div className="space-y-5">
      <Link
        href="/mas"
        className="inline-flex items-center gap-1 text-sm font-medium text-dark/60 transition-colors hover:text-dark"
      >
        <IconChevronLeft className="h-4 w-4" />
        Volver a Más
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Seguridad</h1>
        <p className="mt-1 text-sm text-dark/60">Contraseña de acceso al panel.</p>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="font-semibold">Cambiar contraseña</h2>
        <p className="mt-1 text-xs leading-relaxed text-dark/50">
          Mínimo 8 caracteres. Al cambiarla se cerrarán las sesiones abiertas en otros
          dispositivos.
        </p>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </Card>

      <Card className="p-5 text-sm text-dark/60">
        <p className="font-semibold text-dark">Sesión actual</p>
        <p className="mt-1 text-xs leading-relaxed">
          Iniciaste sesión como @{user.username}. La sesión se mantiene activa mientras uses la
          app y se cierra tras 72 horas sin actividad.
        </p>
      </Card>
    </div>
  );
}

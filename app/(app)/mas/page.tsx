import Link from "next/link";
import { Avatar, Card } from "@/components/ui";
import {
  IconBus,
  IconCalendar,
  IconChevronRight,
  IconLogOut,
  IconShield,
  IconUsers,
} from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";

const links = [
  { href: "/transporte", label: "Transporte estudiantil", desc: "Rutas y mensualidades escolares", icon: IconUsers },
  { href: "/agenda", label: "Agenda", desc: "Servicios por día", icon: IconCalendar },
  { href: "/servicios", label: "Todos los servicios", desc: "Historial y reservaciones", icon: IconBus },
];

export default async function MasPage() {
  const user = await requireUser();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Más</h1>

      <Card className="flex items-center gap-4 p-4">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-bold">{user.name}</p>
          <p className="text-sm text-dark/60">Administrador</p>
          <p className="text-xs text-dark/50">@{user.username} · Fernández Tours</p>
        </div>
      </Card>

      {!user.passwordChangedAt ? (
        <Link href="/mas/seguridad" className="block">
          <Card className="flex items-start gap-3 border-orange/20 bg-orange/5 p-4 transition-colors hover:border-orange/40">
            <IconShield className="mt-0.5 h-5 w-5 shrink-0 text-orange" />
            <div>
              <p className="text-sm font-semibold text-dark">Estás usando la contraseña inicial</p>
              <p className="mt-0.5 text-xs leading-relaxed text-dark/60">
                Cámbiala para proteger el panel. Toca aquí para hacerlo.
              </p>
            </div>
          </Card>
        </Link>
      ) : null}

      <div className="space-y-3">
        {links.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="flex items-center gap-4 p-4 hover:border-teal/40 hover:shadow-md transition-all">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-dark-teal">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-dark/50">{desc}</p>
              </div>
              <IconChevronRight className="h-5 w-5 text-dark/40" />
            </Card>
          </Link>
        ))}

        <Link href="/mas/seguridad">
          <Card className="flex items-center gap-4 p-4 hover:border-teal/40 hover:shadow-md transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-dark-teal">
              <IconShield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Seguridad</p>
              <p className="text-xs text-dark/50">Contraseña y sesión</p>
            </div>
            <IconChevronRight className="h-5 w-5 text-dark/40" />
          </Card>
        </Link>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dark/10 bg-white px-4 py-3.5 text-sm font-semibold text-dark/70 transition-colors hover:border-orange/30 hover:text-orange"
        >
          <IconLogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </form>

      <p className="text-center text-xs text-dark/40">
        Sesión protegida · se cierra tras 72 h sin actividad
      </p>
    </div>
  );
}

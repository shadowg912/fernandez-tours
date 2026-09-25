import Link from "next/link";
import { Avatar, Card } from "@/components/ui";
import { IconBus, IconCalendar, IconChevronRight, IconUsers } from "@/components/icons";

const links = [
  { href: "/transporte", label: "Transporte estudiantil", desc: "Rutas y mensualidades escolares", icon: IconUsers },
  { href: "/agenda", label: "Agenda", desc: "Servicios por día", icon: IconCalendar },
  { href: "/servicios", label: "Todos los servicios", desc: "Historial y reservaciones", icon: IconBus },
];

export default function MasPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Más</h1>

      <Card className="flex items-center gap-4 p-4">
        <Avatar name="Alison Fernández" size="lg" />
        <div>
          <p className="font-bold">Alison Fernández</p>
          <p className="text-sm text-dark/60">Administrador</p>
          <p className="text-xs text-dark/50">Fernández Tours · Santiago, RD</p>
        </div>
      </Card>

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
      </div>

      <Card className="p-4 text-sm text-dark/60">
        <p className="font-semibold text-dark">Configuración</p>
        <p className="mt-1 text-xs">
          Esta es una demo visual. Las opciones de configuración (perfil, tarifas, notificaciones) se habilitarán en la versión final.
        </p>
      </Card>
    </div>
  );
}

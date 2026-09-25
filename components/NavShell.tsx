"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { IconBus, IconCalendar, IconHome, IconMenu, IconMoney, IconUsers } from "./icons";

const navItems = [
  { href: "/", label: "Inicio", icon: IconHome },
  { href: "/servicios", label: "Servicios", icon: IconBus },
  { href: "/clientes", label: "Clientes", icon: IconUsers },
  { href: "/transporte", label: "Estudiantes", icon: IconUsers },
  { href: "/pagos", label: "Pagos", icon: IconMoney },
  { href: "/agenda", label: "Agenda", icon: IconCalendar },
  { href: "/mas", label: "Más", icon: IconMenu },
];

const bottomItems = [
  { href: "/", label: "Inicio", icon: IconHome },
  { href: "/servicios", label: "Servicios", icon: IconBus },
  { href: "/clientes", label: "Clientes", icon: IconUsers },
  { href: "/pagos", label: "Pagos", icon: IconMoney },
  { href: "/mas", label: "Más", icon: IconMenu },
];

export default function NavShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-dark text-cream">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="text-lg font-bold text-light-gold">Fernández Tours</p>
          <p className="text-xs text-cream/60 mt-1">Gestión de transporte</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-teal text-white"
                  : "text-cream/70 hover:bg-white/10 hover:text-cream"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-white/10 text-xs text-cream/50">
          Demo visual · Datos de prueba
        </div>
      </aside>

      {/* Contenido */}
      <main className="md:pl-64 pb-24 md:pb-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 md:py-8">{children}</div>
      </main>

      {/* Bottom nav móvil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-dark border-t border-white/10 safe-area-inset-bottom">
        <div className="grid grid-cols-5">
          {bottomItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-light-gold" : "text-cream/60"
                }`}
              >
                <Icon className="w-6 h-6" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

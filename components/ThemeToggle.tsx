"use client";

import { useCallback, useSyncExternalStore } from "react";
import { IconMoon, IconSun } from "./icons";

/* Botón para alternar el modo oscuro. El tema elegido se guarda en
   localStorage y se aplica con la clase "dark" en <html>. */

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* localStorage no disponible */
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
      aria-pressed={dark}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className={`inline-flex items-center justify-center rounded-full p-2.5 transition-colors ${className}`}
    >
      {dark ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
    </button>
  );
}

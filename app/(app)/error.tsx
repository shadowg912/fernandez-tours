"use client";

import { ErrorBanner, Button } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4 py-10">
      <ErrorBanner message="No se pudo conectar con la base de datos. Verifica que el servidor esté disponible e inténtalo de nuevo." />
      <p className="text-xs text-dark/40">{error.message}</p>
      <Button variant="secondary" onClick={reset}>Reintentar</Button>
    </div>
  );
}

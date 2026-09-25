import type { Metadata } from "next";
import "./globals.css";
import NavShell from "@/components/NavShell";

export const metadata: Metadata = {
  title: "Fernández Tours",
  description: "Sistema de gestión de transporte y tours",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-cream text-dark font-sans">
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}

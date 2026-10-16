import type { Metadata } from "next";
import "./globals.css";
import NavShell from "@/components/NavShell";

export const metadata: Metadata = {
  title: "Fernández Tours",
  description: "Sistema de gestión de transporte y tours",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-cream text-dark font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}

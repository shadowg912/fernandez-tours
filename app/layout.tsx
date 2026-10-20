import type { Metadata } from "next";
import "./globals.css";
import NavShell from "@/components/NavShell";

export const metadata: Metadata = {
  title: "Fernández Tours",
  description: "Sistema de gestión de transporte y tours",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-cream text-dark font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}

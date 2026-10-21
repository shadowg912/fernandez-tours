import type { Metadata } from "next";
import "./globals.css";
import NavShell from "@/components/NavShell";

export const metadata: Metadata = {
  title: "Fernández Tours",
  description: "Sistema de gestión de transporte y tours",
  icons: {
    icon: [
      { url: "/favicon48x48.ico", type: "image/x-icon", sizes: "48x48 32x32" },
      { url: "/favicon96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [{ url: "/favicon180x180.png", sizes: "180x180", type: "image/png" }],
  },
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

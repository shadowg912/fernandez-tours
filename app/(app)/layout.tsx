import type { ReactNode } from "react";
import NavShell from "@/components/NavShell";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <NavShell>{children}</NavShell>;
}

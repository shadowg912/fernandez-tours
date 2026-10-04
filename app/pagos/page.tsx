import { getPayments } from "@/lib/queries";
import PagosClient from "./PagosClient";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const payments = await getPayments();
  return <PagosClient payments={payments} />;
}

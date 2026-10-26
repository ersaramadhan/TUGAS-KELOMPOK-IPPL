import { PaymentsManager } from "@/components/dashboard/PaymentsManager";
import { getOwnerBillsData, getOwnerPaymentsData } from "@/lib/owner-data";

export default async function PaymentsPage() {
  const [
    { metrics, payments },
    { bills }
  ] = await Promise.all([getOwnerPaymentsData(), getOwnerBillsData()]);

  return (
    <PaymentsManager
      bills={bills ?? []}
      metrics={metrics}
      payments={payments ?? []}
    />
  );
}

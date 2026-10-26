import { BillsManager } from "@/components/dashboard/BillsManager";
import { getOwnerBillsData, getOwnerTenantsData } from "@/lib/owner-data";

export default async function BillsPage() {
  const [
    { metrics, bills },
    { tenants }
  ] = await Promise.all([getOwnerBillsData(), getOwnerTenantsData()]);

  return (
    <BillsManager
      bills={bills ?? []}
      metrics={metrics}
      tenants={tenants ?? []}
    />
  );
}

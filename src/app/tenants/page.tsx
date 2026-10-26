import { TenantsManager } from "@/components/dashboard/TenantsManager";
import { getOwnerRoomsData, getOwnerTenantsData } from "@/lib/owner-data";

export default async function TenantsPage() {
  const [
    { metrics, tenants, tenantCandidates },
    { rooms }
  ] = await Promise.all([getOwnerTenantsData(), getOwnerRoomsData()]);

  return (
    <TenantsManager
      metrics={metrics}
      rooms={rooms ?? []}
      tenantCandidates={tenantCandidates ?? []}
      tenants={tenants ?? []}
    />
  );
}

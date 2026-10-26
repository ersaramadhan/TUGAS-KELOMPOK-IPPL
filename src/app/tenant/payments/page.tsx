import { TenantPaymentsManager } from "@/components/tenant/TenantPaymentsManager";
import { getTenantPortalData } from "@/lib/tenant-data";

export default async function TenantPaymentsPage() {
  const { profile, bills, payments, sourceReason } = await getTenantPortalData();

  return (
    <TenantPaymentsManager
      bills={bills}
      payments={payments}
      profile={profile}
      sourceReason={sourceReason}
    />
  );
}

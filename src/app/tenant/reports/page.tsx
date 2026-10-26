import { TenantReportsManager } from "@/components/tenant/TenantReportsManager";
import { getTenantPortalData } from "@/lib/tenant-data";

export default async function TenantReportsPage() {
  const { profile, reports, sourceReason } = await getTenantPortalData();

  return (
    <TenantReportsManager
      profile={profile}
      reports={reports}
      sourceReason={sourceReason}
    />
  );
}

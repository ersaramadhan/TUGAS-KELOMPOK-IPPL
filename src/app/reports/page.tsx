import { MaintenanceReportsManager } from "@/components/dashboard/MaintenanceReportsManager";
import {
  getOwnerMaintenanceReportsData,
  getOwnerTenantsData
} from "@/lib/owner-data";

export default async function ReportsPage() {
  const [
    { metrics, maintenanceReports },
    { tenants }
  ] = await Promise.all([
    getOwnerMaintenanceReportsData(),
    getOwnerTenantsData()
  ]);

  return (
    <MaintenanceReportsManager
      metrics={metrics}
      reports={maintenanceReports ?? []}
      tenants={tenants ?? []}
    />
  );
}

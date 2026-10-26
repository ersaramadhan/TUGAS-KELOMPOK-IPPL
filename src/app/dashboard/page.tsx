import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { getDashboardOverviewData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardOverviewData();

  return <DashboardOverview data={data} />;
}

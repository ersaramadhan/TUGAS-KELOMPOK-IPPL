import { TenantDetailView } from "@/components/dashboard/TenantDetailView";
import { getOwnerTenantDetailData } from "@/lib/owner-detail-data";

type TenantDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TenantDetailPage({
  params
}: TenantDetailPageProps) {
  const { id } = await params;
  const data = await getOwnerTenantDetailData(id);

  return <TenantDetailView data={data} />;
}

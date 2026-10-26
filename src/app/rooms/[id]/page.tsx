import { RoomDetailView } from "@/components/dashboard/RoomDetailView";
import { getOwnerRoomDetailData } from "@/lib/owner-detail-data";

type RoomDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { id } = await params;
  const data = await getOwnerRoomDetailData(id);

  return <RoomDetailView data={data} />;
}

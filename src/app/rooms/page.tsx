import { RoomsManager } from "@/components/dashboard/RoomsManager";
import { getOwnerRoomsData } from "@/lib/owner-data";

export default async function RoomsPage() {
  const { metrics, rooms } = await getOwnerRoomsData();

  return (
    <RoomsManager
      metrics={metrics}
      rooms={rooms ?? []}
    />
  );
}

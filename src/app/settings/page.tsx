import { SettingsManager } from "@/components/dashboard/SettingsManager";
import { getOwnerSettingsData } from "@/lib/settings-data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const data = await getOwnerSettingsData();
  const settingsKey = [
    data.profile.full_name,
    data.profile.phone,
    data.property?.name,
    data.property?.address,
    data.property?.payment_account
  ].join("|");

  return <SettingsManager data={data} key={settingsKey} />;
}

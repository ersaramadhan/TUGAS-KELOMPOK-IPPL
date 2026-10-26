import { TenantCard } from "@/components/tenant/TenantCard";
import { TenantListPanel } from "@/components/tenant/TenantListPanel";
import { TenantShell } from "@/components/tenant/TenantShell";
import { formatMoney } from "@/lib/dashboard";
import {
  getTenantPortalData,
  tenantBillRowsFromData
} from "@/lib/tenant-data";

export default async function TenantBillsPage() {
  const { profile, bills, sourceReason } = await getTenantPortalData();
  const unpaidTotal = bills
    .filter((bill) => bill.status !== "paid")
    .reduce((total, bill) => total + bill.amount, 0);
  const paidCount = bills.filter((bill) => bill.status === "paid").length;

  return (
    <TenantShell profile={profile} sourceReason={sourceReason}>
      <section className="grid gap-4 md:grid-cols-3">
        <TenantCard
          label="Belum selesai"
          note="Tagihan belum lunas atau menunggu verifikasi"
          tone="amber"
          value={formatMoney(unpaidTotal)}
        />
        <TenantCard
          label="Lunas"
          note="Riwayat tagihan aman"
          tone="emerald"
          value={`${paidCount}`}
        />
        <TenantCard
          label="Tipe sewa"
          note="Mengikuti data penghuni"
          value={profile.rentType}
        />
      </section>

      <div className="mt-4">
        <TenantListPanel
          emptyMessage="Belum ada tagihan untuk akun ini."
          eyebrow="Tagihan saya"
          rows={tenantBillRowsFromData(bills)}
          title="Semua periode"
        />
      </div>
    </TenantShell>
  );
}

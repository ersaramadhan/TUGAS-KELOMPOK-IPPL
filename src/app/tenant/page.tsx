import Link from "next/link";

import { TenantCard } from "@/components/tenant/TenantCard";
import { TenantListPanel } from "@/components/tenant/TenantListPanel";
import { TenantRoomOnboarding } from "@/components/tenant/TenantRoomOnboarding";
import { TenantShell } from "@/components/tenant/TenantShell";
import { formatMoney } from "@/lib/dashboard";
import {
  getTenantPortalData,
  tenantBillRowsFromData,
  tenantReportRowsFromData
} from "@/lib/tenant-data";

export default async function TenantHomePage() {
  const { profile, availableRooms, bills, reports, sourceReason } =
    await getTenantPortalData();
  const activeBill =
    bills.find((bill) => bill.status !== "paid") ?? bills[0] ?? null;
  const heroText = activeBill
    ? `Tagihan ${activeBill.period} sedang ${activeBill.status === "paid" ? "lunas" : "berjalan"}.`
    : "Belum ada tagihan aktif untuk kamar ini.";

  return (
    <TenantShell profile={profile} sourceReason={sourceReason}>
      {!profile.tenantId ? (
        <TenantRoomOnboarding
          availableRooms={availableRooms}
          profile={profile}
        />
      ) : (
        <>
          <section className="rounded-[32px] bg-[#20352f] p-5 text-white shadow-xl md:p-6">
            <p className="text-sm font-bold text-[#d9f99d]">
              Selamat datang, {profile.name}
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-tight md:text-4xl xl:text-5xl">
              {heroText}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65 md:text-base">
              Pantau tagihan, pembayaran, dan laporan kamar dari satu portal
              penghuni.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                className="inline-flex justify-center rounded-2xl bg-[#d9f99d] px-4 py-3 text-sm font-black text-[#17211e]"
                href="/tenant/payments"
              >
                Upload bukti pembayaran
              </Link>
              <Link
                className="inline-flex justify-center rounded-2xl border border-white/20 px-4 py-3 text-sm font-black text-white"
                href="/tenant/reports"
              >
                Buat laporan kerusakan
              </Link>
            </div>
          </section>

          <section className="mt-4 grid gap-4 md:grid-cols-3">
            <TenantCard
              label="Kamar"
              note={`${profile.rentType} sejak ${profile.moveInDate}`}
              value={profile.room}
            />
            <TenantCard
              label="Tagihan aktif"
              note={
                activeBill ? `Jatuh tempo ${activeBill.dueDate}` : "Tidak ada"
              }
              tone={activeBill ? "amber" : "emerald"}
              value={
                activeBill ? formatMoney(activeBill.amount) : formatMoney(0)
              }
            />
            <TenantCard
              label="Status"
              note="Status tagihan terakhir"
              tone={activeBill?.status === "paid" ? "emerald" : "amber"}
              value={
                activeBill?.status === "paid"
                  ? "Lunas"
                  : activeBill?.status === "pending_verification"
                    ? "Menunggu verifikasi"
                    : activeBill
                      ? "Belum lunas"
                      : "Aman"
              }
            />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            <TenantListPanel
              emptyMessage="Belum ada tagihan untuk akun ini."
              eyebrow="Tagihan saya"
              rows={tenantBillRowsFromData(bills).slice(0, 2)}
              title="Periode terbaru"
            />
            <TenantListPanel
              emptyMessage="Belum ada laporan kerusakan."
              eyebrow="Laporan saya"
              rows={tenantReportRowsFromData(reports)}
              title="Progress kerusakan"
            />
          </section>
        </>
      )}
    </TenantShell>
  );
}

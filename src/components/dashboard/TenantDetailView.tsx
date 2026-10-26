"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  DoorOpen,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Wrench
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { formatMoney } from "@/lib/dashboard";
import type { OwnerTenantDetailData } from "@/lib/owner-detail-data";

type Metric = OwnerTenantDetailData["metrics"][number];

type TenantDetailViewProps = {
  data: OwnerTenantDetailData;
};

const toneClasses: Record<Metric["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
};

const billStatusLabels = {
  draft: "Draft",
  unpaid: "Belum lunas",
  pending_verification: "Menunggu verifikasi",
  paid: "Lunas",
  overdue: "Terlambat"
};

const paymentStatusLabels = {
  pending: "Menunggu verifikasi",
  approved: "Terverifikasi",
  rejected: "Ditolak"
};

const reportStatusLabels = {
  new: "Baru",
  in_progress: "Diproses",
  done: "Selesai",
  rejected: "Ditolak"
};

const priorityLabels = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi"
};

type TenantDetail = NonNullable<OwnerTenantDetailData["tenant"]>;
type TenantRoom = TenantDetail["rooms"];
type TenantBill = OwnerTenantDetailData["bills"][number];
type TenantPayment = OwnerTenantDetailData["payments"][number];

function getTenantRoomName(tenant: TenantDetail) {
  if (Array.isArray(tenant.rooms)) {
    return tenant.rooms[0]?.name ?? "-";
  }

  return tenant.rooms?.name ?? "-";
}

function getTenantRoomField(
  rooms: TenantRoom,
  field: "floor" | "monthly_price" | "yearly_price"
) {
  const room = Array.isArray(rooms) ? rooms[0] : rooms;

  return room?.[field] ?? null;
}

function getBillTenantName(bill: TenantBill) {
  if (Array.isArray(bill.tenants)) {
    return bill.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return bill.tenants?.full_name ?? "Tanpa penghuni";
}

function getBillRoomName(bill: TenantBill) {
  if (Array.isArray(bill.rooms)) {
    return bill.rooms[0]?.name ?? "-";
  }

  return bill.rooms?.name ?? "-";
}

function getBillSummary(bill: TenantBill) {
  return `Kamar ${getBillRoomName(bill)} - ${getBillTenantName(bill)} - ${
    bill.period
  }`;
}

function getPaymentBill(payment: TenantPayment) {
  if (Array.isArray(payment.bills)) {
    return payment.bills[0] ?? null;
  }

  return payment.bills;
}

function getPaymentRoomName(payment: TenantPayment) {
  const bill = getPaymentBill(payment);

  if (Array.isArray(bill?.rooms)) {
    return bill.rooms[0]?.name ?? "-";
  }

  return bill?.rooms?.name ?? "-";
}

export function TenantDetailView({ data }: TenantDetailViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tenant = data.tenant;

  return (
    <DashboardShell
      isSidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onOpenSidebar={() => setSidebarOpen(true)}
    >
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-[#2a6b5c]"
              href="/tenants"
            >
              <ArrowLeft size={16} />
              Kembali ke data penghuni
            </Link>
            <p className="mt-4 text-sm font-bold text-[#2a6b5c]">
              Detail penghuni
            </p>
            <h1 className="mt-2 break-words text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
              {tenant ? tenant.full_name : "Penghuni tidak ditemukan"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              Profil penghuni, kamar, tagihan, pembayaran, dan laporan
              kerusakan yang saling terhubung.
            </p>
          </div>
        </div>
      </section>

      {!tenant ? (
        <section className="mt-4 rounded-[32px] border border-dashed border-slate-200 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
          <AlertTriangle className="mx-auto text-[#2a6b5c]" size={32} />
          <h2 className="mt-3 text-2xl font-black text-slate-950">
            Data penghuni belum bisa ditampilkan
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Penghuni mungkin sudah dihapus atau tidak terlihat oleh user ini.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-4 grid gap-4 lg:grid-cols-4">
            {data.metrics.map((metric) => (
              <article
                className="min-w-0 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur"
                key={metric.label}
              >
                <span
                  className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-black ${toneClasses[metric.tone]}`}
                >
                  <span className="truncate">{metric.label}</span>
                </span>
                <p className="mt-4 break-words text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                  {metric.value}
                </p>
                <p className="mt-2 break-words text-sm leading-5 text-slate-500">
                  {metric.note}
                </p>
              </article>
            ))}
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <article className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
                  <UserRound size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2a6b5c]">
                    Profil penghuni
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    Data kontak
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoItem label="Email" value={tenant.email} />
                <InfoItem
                  label="WhatsApp"
                  value={tenant.phone ?? "Nomor belum diisi"}
                />
                <InfoItem
                  label="Kontak darurat"
                  value={tenant.emergency_contact ?? "Belum diisi"}
                />
                <InfoItem
                  label="Nomor identitas"
                  value={tenant.identity_number ?? "Opsional, belum diisi"}
                />
                <InfoItem
                  label="Tanggal masuk"
                  value={tenant.move_in_date}
                />
                <InfoItem
                  label="Tipe sewa"
                  value={tenant.rent_type === "monthly" ? "Bulanan" : "Tahunan"}
                />
              </div>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f8fafc] text-slate-700">
                  <DoorOpen size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2a6b5c]">
                    Kamar ditempati
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    Kamar {getTenantRoomName(tenant)}
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoItem
                  label="Lantai"
                  value={`${getTenantRoomField(tenant.rooms, "floor") ?? "-"}`}
                />
                <InfoItem
                  label="Harga bulanan"
                  value={formatMoney(
                    Number(getTenantRoomField(tenant.rooms, "monthly_price") ?? 0)
                  )}
                />
                <InfoItem
                  label="Harga tahunan"
                  value={
                    getTenantRoomField(tenant.rooms, "yearly_price")
                      ? formatMoney(
                          Number(
                            getTenantRoomField(tenant.rooms, "yearly_price")
                          )
                        )
                      : "Belum diisi"
                  }
                />
                <InfoItem
                  label="Status relasi"
                  value={data.metrics[0]?.value ?? "-"}
                />
              </div>
              <Link
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                href={`/rooms/${tenant.room_id}`}
              >
                Lihat detail kamar
              </Link>
            </article>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-3">
            <DetailList
              emptyDescription="Belum ada tagihan untuk penghuni ini."
              icon={<ReceiptText size={20} />}
              title="Tagihan"
            >
              {data.bills.map((bill) => (
                <ListItem
                  amount={formatMoney(bill.amount)}
                  key={bill.id}
                  meta={`Jatuh tempo ${bill.due_date}`}
                  status={billStatusLabels[bill.status]}
                  title={getBillSummary(bill)}
                />
              ))}
            </DetailList>

            <DetailList
              emptyDescription="Belum ada pembayaran untuk penghuni ini."
              icon={<Banknote size={20} />}
              title="Pembayaran"
            >
              {data.payments.map((payment) => (
                <ListItem
                  amount={formatMoney(payment.amount)}
                  key={payment.id}
                  meta={`${payment.method} - Kamar ${getPaymentRoomName(payment)}`}
                  status={paymentStatusLabels[payment.verification_status]}
                  title={payment.paid_at.slice(0, 10)}
                />
              ))}
            </DetailList>

            <DetailList
              emptyDescription="Belum ada laporan kerusakan dari penghuni ini."
              icon={<Wrench size={20} />}
              title="Laporan"
            >
              {data.maintenanceReports.map((report) => (
                <ListItem
                  key={report.id}
                  meta={`${priorityLabels[report.priority]} - ${report.created_at.slice(
                    0,
                    10
                  )}`}
                  status={reportStatusLabels[report.status]}
                  title={report.title}
                />
              ))}
            </DetailList>
          </section>

          <section className="mt-4 rounded-[32px] border border-white/70 bg-[#17211e] p-5 text-white shadow-sm md:p-6">
            <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-[#d9f99d]" size={22} />
                  <h2 className="text-xl font-black">Status operasional</h2>
                </div>
                <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-white/65">
                  Gunakan ringkasan ini untuk mengecek apakah penghuni masih
                  aktif, punya tagihan berjalan, atau punya laporan kerusakan
                  yang perlu ditindaklanjuti.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white">
                <CalendarDays size={18} />
                Masuk {tenant.move_in_date}
              </div>
            </div>
          </section>
        </>
      )}
    </DashboardShell>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-3xl border border-slate-100 bg-white p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function DetailList({
  children,
  emptyDescription,
  icon,
  title
}: {
  children: ReactNode;
  emptyDescription: string;
  icon: ReactNode;
  title: string;
}) {
  const hasChildren = Boolean(children && (!Array.isArray(children) || children.length));

  return (
    <article className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
          {icon}
        </div>
        <h2 className="min-w-0 break-words text-xl font-black text-slate-950">
          {title}
        </h2>
      </div>
      <div className="mt-5 space-y-3">
        {hasChildren ? (
          children
        ) : (
          <p className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm font-bold leading-6 text-slate-500">
            {emptyDescription}
          </p>
        )}
      </div>
    </article>
  );
}

function ListItem({
  amount,
  meta,
  status,
  title
}: {
  amount?: string;
  meta: string;
  status: string;
  title: string;
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-slate-100 bg-white p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-sm font-black text-slate-950">
            {title}
          </p>
          <p className="mt-1 break-words text-sm leading-5 text-slate-500">
            {meta}
          </p>
        </div>
        <span className="shrink-0 self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {status}
        </span>
      </div>
      {amount ? (
        <p className="mt-3 break-words text-lg font-black text-slate-950">
          {amount}
        </p>
      ) : null}
    </div>
  );
}

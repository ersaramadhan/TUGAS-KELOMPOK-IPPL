"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  DoorOpen,
  ReceiptText,
  UserRound,
  Wrench
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { formatMoney } from "@/lib/dashboard";
import type { OwnerRoomDetailData } from "@/lib/owner-detail-data";

type Metric = OwnerRoomDetailData["metrics"][number];

type RoomDetailViewProps = {
  data: OwnerRoomDetailData;
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

type RoomBill = OwnerRoomDetailData["bills"][number];
type RoomPayment = OwnerRoomDetailData["payments"][number];

function getBillTenantName(bill: RoomBill) {
  if (Array.isArray(bill.tenants)) {
    return bill.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return bill.tenants?.full_name ?? "Tanpa penghuni";
}

function getBillRoomName(bill: RoomBill) {
  if (Array.isArray(bill.rooms)) {
    return bill.rooms[0]?.name ?? "-";
  }

  return bill.rooms?.name ?? "-";
}

function getBillSummary(bill: RoomBill) {
  return `Kamar ${getBillRoomName(bill)} - ${getBillTenantName(bill)} - ${
    bill.period
  }`;
}

function getPaymentBill(payment: RoomPayment) {
  if (Array.isArray(payment.bills)) {
    return payment.bills[0] ?? null;
  }

  return payment.bills;
}

function getPaymentTenantName(payment: RoomPayment) {
  const bill = getPaymentBill(payment);

  if (Array.isArray(bill?.tenants)) {
    return bill.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return bill?.tenants?.full_name ?? "Tanpa penghuni";
}

export function RoomDetailView({ data }: RoomDetailViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const room = data.room;

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
              href="/rooms"
            >
              <ArrowLeft size={16} />
              Kembali ke data kamar
            </Link>
            <p className="mt-4 text-sm font-bold text-[#2a6b5c]">
              Detail kamar
            </p>
            <h1 className="mt-2 break-words text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
              {room ? `Kamar ${room.name}` : "Kamar tidak ditemukan"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              Detail okupansi, tagihan, pembayaran, dan laporan kerusakan untuk
              kamar ini.
            </p>
          </div>
        </div>
      </section>

      {!room ? (
        <section className="mt-4 rounded-[32px] border border-dashed border-slate-200 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
          <AlertTriangle className="mx-auto text-[#2a6b5c]" size={32} />
          <h2 className="mt-3 text-2xl font-black text-slate-950">
            Data kamar belum bisa ditampilkan
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Kamar mungkin sudah dihapus atau tidak terlihat oleh user ini.
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

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <article className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
                  <DoorOpen size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2a6b5c]">
                    Informasi kamar
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    Profil kamar
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoItem label="Lantai" value={room.floor ?? "Tanpa lantai"} />
                <InfoItem
                  label="Harga bulanan"
                  value={formatMoney(room.monthly_price)}
                />
                <InfoItem
                  label="Harga tahunan"
                  value={
                    room.yearly_price
                      ? formatMoney(room.yearly_price)
                      : "Belum diisi"
                  }
                />
                <InfoItem label="Status" value={data.metrics[0]?.value ?? "-"} />
                <InfoItem
                  label="Fasilitas"
                  value={
                    room.facilities.length
                      ? room.facilities.join(", ")
                      : "Belum ada fasilitas"
                  }
                />
                <InfoItem
                  label="Catatan"
                  value={room.internal_note ?? "Tanpa catatan internal"}
                />
              </div>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f8fafc] text-slate-700">
                  <UserRound size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2a6b5c]">
                    Penghuni aktif
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    Okupansi
                  </h2>
                </div>
              </div>
              {data.tenant ? (
                <div className="mt-5 rounded-3xl border border-slate-100 bg-white p-4">
                  <p className="break-words text-lg font-black text-slate-950">
                    {data.tenant.full_name}
                  </p>
                  <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                    {data.tenant.email} - {data.tenant.phone ?? "Tanpa nomor"}
                  </p>
                  <Link
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                    href={`/tenants/${data.tenant.id}`}
                  >
                    Lihat detail penghuni
                  </Link>
                </div>
              ) : (
                <EmptyBlock
                  title="Belum ada penghuni aktif"
                  description="Kamar ini belum terhubung ke penghuni aktif atau penghuni tidak terlihat oleh user ini."
                />
              )}
            </article>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-3">
            <DetailList
              emptyDescription="Belum ada tagihan untuk kamar ini."
              icon={<ReceiptText size={20} />}
              title="Tagihan kamar"
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
              emptyDescription="Belum ada pembayaran untuk kamar ini."
              icon={<Banknote size={20} />}
              title="Pembayaran"
            >
              {data.payments.map((payment) => (
                <ListItem
                  amount={formatMoney(payment.amount)}
                  key={payment.id}
                  meta={`${payment.method} - ${getPaymentTenantName(payment)}`}
                  status={paymentStatusLabels[payment.verification_status]}
                  title={payment.paid_at.slice(0, 10)}
                />
              ))}
            </DetailList>

            <DetailList
              emptyDescription="Belum ada laporan kerusakan untuk kamar ini."
              icon={<Wrench size={20} />}
              title="Laporan kerusakan"
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

function EmptyBlock({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-white p-6 text-center">
      <CheckCircle2 className="mx-auto text-[#2a6b5c]" size={28} />
      <h3 className="mt-3 text-lg font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
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

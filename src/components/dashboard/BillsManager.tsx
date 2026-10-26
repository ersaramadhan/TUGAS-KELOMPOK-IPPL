"use client";

import {
  AlertTriangle,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createBillAction,
  deleteBillAction,
  updateBillAction
} from "@/app/bills/actions";
import type { BillFormValues } from "@/app/bills/actions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { formatDateInputValue, formatMonthPeriod } from "@/lib/date";
import { formatMoney } from "@/lib/dashboard";
import type { OwnerBillRecord, OwnerTenantRecord } from "@/lib/owner-data";

type Metric = {
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "amber" | "rose" | "slate";
};

type BillsManagerProps = {
  metrics: Metric[];
  bills: OwnerBillRecord[];
  tenants: OwnerTenantRecord[];
};

const emptyFormValues: BillFormValues = {
  tenantId: "",
  roomId: "",
  period: "",
  billType: "monthly",
  amount: "",
  dueDate: "",
  status: "unpaid",
  correctionNote: ""
};

const toneClasses: Record<Metric["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
};

const billStatusLabels: Record<OwnerBillRecord["status"], string> = {
  draft: "Draft",
  unpaid: "Belum lunas",
  pending_verification: "Menunggu verifikasi",
  paid: "Lunas",
  overdue: "Terlambat"
};

function getTenantName(bill: OwnerBillRecord) {
  if (Array.isArray(bill.tenants)) {
    return bill.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return bill.tenants?.full_name ?? "Tanpa penghuni";
}

function getRoomName(bill: OwnerBillRecord) {
  if (Array.isArray(bill.rooms)) {
    return bill.rooms[0]?.name ?? "-";
  }

  return bill.rooms?.name ?? "-";
}

function billToFormValues(bill: OwnerBillRecord): BillFormValues {
  return {
    id: bill.id,
    tenantId: bill.tenant_id,
    roomId: bill.room_id,
    period: bill.period,
    billType: bill.bill_type,
    amount: `${bill.amount}`,
    dueDate: bill.due_date,
    status: bill.status,
    correctionNote: bill.correction_note ?? ""
  };
}

function getTenantRoomName(tenant: OwnerTenantRecord) {
  if (Array.isArray(tenant.rooms)) {
    return tenant.rooms[0]?.name ?? "-";
  }

  return tenant.rooms?.name ?? "-";
}

export function BillsManager({
  metrics,
  bills,
  tenants
}: BillsManagerProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<BillFormValues>(emptyFormValues);
  const [editingBill, setEditingBill] = useState<OwnerBillRecord | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function getInitialFormValues(): BillFormValues {
    const firstTenant = tenants[0];

    return {
      ...emptyFormValues,
      tenantId: firstTenant?.id ?? "",
      roomId: firstTenant?.room_id ?? "",
      period: formatMonthPeriod(),
      amount: firstTenant?.rent_type === "yearly" ? "" : "",
      dueDate: formatDateInputValue()
    };
  }

  function openCreateForm() {
    setEditingBill(null);
    setFormValues(getInitialFormValues());
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(bill: OwnerBillRecord) {
    setEditingBill(bill);
    setFormValues(billToFormValues(bill));
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingBill(null);
    setFormValues(emptyFormValues);
    setError("");
    setIsFormOpen(false);
  }

  function selectTenant(tenantId: string) {
    const tenant = tenants.find((item) => item.id === tenantId);

    setFormValues((currentValues) => ({
      ...currentValues,
      tenantId,
      roomId: tenant?.room_id ?? ""
    }));
  }

  function saveBill() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = editingBill
        ? await updateBillAction(formValues)
        : await createBillAction(formValues);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      closeForm();
      router.refresh();
    });
  }

  function deleteBill(billId: string) {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await deleteBillAction(billId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <DashboardShell
      isSidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onOpenSidebar={() => setSidebarOpen(true)}
    >
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[#2a6b5c]">Tagihan</p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
              Daftar tagihan
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Buat dan kelola tagihan bulanan atau tahunan berdasarkan data
              penghuni aktif.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17211e] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#24332f]"
            onClick={openCreateForm}
            type="button"
          >
            <Plus size={18} />
            Buat tagihan
          </button>
        </div>
      </section>

      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </p>
      ) : null}

      <section className="mt-4 grid gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article
            className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur"
            key={metric.label}
          >
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${toneClasses[metric.tone]}`}
            >
              {metric.label}
            </span>
            <p className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-5 text-slate-500">
              {metric.note}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-4 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-[#2a6b5c]">Data terbaru</p>
            <h2 className="text-2xl font-black text-slate-950">
              Tagihan operasional
            </h2>
          </div>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10 sm:w-72"
              placeholder="Cari tagihan"
              type="search"
            />
          </label>
        </div>

        {bills.length ? (
          <div className="mt-5 space-y-3">
            {bills.map((bill) => (
              <article
                className="grid min-w-0 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
                key={bill.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
                    <ReceiptText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-950">
                      {getTenantName(bill)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Kamar {getRoomName(bill)} - {bill.period} - Jatuh tempo{" "}
                      {bill.due_date}
                    </p>
                  </div>
                </div>
                <p className="self-center whitespace-nowrap font-black text-slate-950">
                  {formatMoney(bill.amount)}
                </p>
                <span className="inline-flex max-w-full justify-self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 md:self-center">
                  {billStatusLabels[bill.status]}
                </span>
                <div className="flex items-center gap-2 self-center">
                  <button
                    aria-label={`Edit tagihan ${getTenantName(bill)}`}
                    className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                    onClick={() => openEditForm(bill)}
                    type="button"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={`Hapus tagihan ${getTenantName(bill)}`}
                    className="rounded-2xl border border-rose-100 p-2 text-rose-600 transition hover:bg-rose-50"
                    onClick={() => deleteBill(bill.id)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center">
            <AlertTriangle className="mx-auto text-[#2a6b5c]" size={30} />
            <h3 className="mt-3 text-xl font-black text-slate-950">
              Belum ada tagihan
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Buat tagihan pertama dari data penghuni aktif.
            </p>
          </div>
        )}
      </section>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="max-h-[calc(100vh-32px)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/70 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#2a6b5c]">
                  {editingBill ? "Edit tagihan" : "Buat tagihan"}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {editingBill ? getTenantName(editingBill) : "Tagihan baru"}
                </h2>
              </div>
              <button
                aria-label="Tutup form"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                onClick={closeForm}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Penghuni
                </span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) => selectTenant(event.target.value)}
                  value={formValues.tenantId}
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.full_name} - Kamar {getTenantRoomName(tenant)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Periode
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      period: event.target.value
                    }))
                  }
                  placeholder="Contoh: Juli 2026"
                  value={formValues.period}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Jatuh tempo
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      dueDate: event.target.value
                    }))
                  }
                  type="date"
                  value={formValues.dueDate}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Nominal
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  inputMode="numeric"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      amount: event.target.value
                    }))
                  }
                  placeholder="Contoh: 1250000 atau 1.250.000"
                  value={formValues.amount}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Tipe tagihan
                </span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      billType: event.target.value as BillFormValues["billType"]
                    }))
                  }
                  value={formValues.billType}
                >
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">Status</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      status: event.target.value as BillFormValues["status"]
                    }))
                  }
                  value={formValues.status}
                >
                  <option value="draft">Draft</option>
                  <option value="unpaid">Belum lunas</option>
                  <option value="pending_verification">Menunggu verifikasi</option>
                  <option value="paid">Lunas</option>
                  <option value="overdue">Terlambat</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Catatan koreksi
                </span>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      correctionNote: event.target.value
                    }))
                  }
                  value={formValues.correctionNote}
                />
              </label>
            </div>

            {error ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {message}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600"
                disabled={isPending}
                onClick={closeForm}
                type="button"
              >
                Batal
              </button>
              <button
                className="rounded-2xl bg-[#2a6b5c] px-4 py-3 text-sm font-black text-white transition hover:bg-[#23594d] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                onClick={saveBill}
                type="button"
              >
                {isPending ? "Menyimpan..." : "Simpan tagihan"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}

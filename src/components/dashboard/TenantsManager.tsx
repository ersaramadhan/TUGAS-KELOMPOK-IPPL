"use client";

import {
  AlertTriangle,
  Eye,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createTenantAction,
  deleteTenantAction,
  updateTenantAction
} from "@/app/tenants/actions";
import type { TenantFormValues } from "@/app/tenants/actions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type {
  OwnerRoomRecord,
  OwnerTenantCandidateRecord,
  OwnerTenantRecord
} from "@/lib/owner-data";

type Metric = {
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "amber" | "rose" | "slate";
};

type TenantsManagerProps = {
  metrics: Metric[];
  tenantCandidates: OwnerTenantCandidateRecord[];
  tenants: OwnerTenantRecord[];
  rooms: OwnerRoomRecord[];
};

const emptyFormValues: TenantFormValues = {
  roomId: "",
  fullName: "",
  email: "",
  phone: "",
  emergencyContact: "",
  moveInDate: "",
  rentType: "monthly",
  status: "active"
};

const toneClasses: Record<Metric["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
};

const tenantStatusLabels: Record<OwnerTenantRecord["status"], string> = {
  active: "Aktif",
  leaving: "Akan keluar",
  left: "Sudah keluar"
};

function getTenantRoomName(tenant: OwnerTenantRecord) {
  if (Array.isArray(tenant.rooms)) {
    return tenant.rooms[0]?.name ?? "-";
  }

  return tenant.rooms?.name ?? "-";
}

function tenantToFormValues(tenant: OwnerTenantRecord): TenantFormValues {
  return {
    id: tenant.id,
    roomId: tenant.room_id,
    fullName: tenant.full_name,
    email: tenant.email,
    phone: tenant.phone ?? "",
    emergencyContact: tenant.emergency_contact ?? "",
    moveInDate: tenant.move_in_date,
    rentType: tenant.rent_type,
    status: tenant.status
  };
}

export function TenantsManager({
  metrics,
  tenantCandidates,
  tenants,
  rooms
}: TenantsManagerProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValues, setFormValues] =
    useState<TenantFormValues>(emptyFormValues);
  const [editingTenant, setEditingTenant] = useState<OwnerTenantRecord | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function openCreateForm() {
    setEditingTenant(null);
    setFormValues({
      ...emptyFormValues,
      roomId: rooms[0]?.id ?? ""
    });
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(tenant: OwnerTenantRecord) {
    setEditingTenant(tenant);
    setFormValues(tenantToFormValues(tenant));
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingTenant(null);
    setFormValues(emptyFormValues);
    setError("");
    setIsFormOpen(false);
  }

  function saveTenant() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = editingTenant
        ? await updateTenantAction(formValues)
        : await createTenantAction(formValues);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      closeForm();
      router.refresh();
    });
  }

  function deleteTenant(tenantId: string) {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await deleteTenantAction(tenantId);

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
            <p className="text-sm font-bold text-[#2a6b5c]">
              Manajemen penghuni
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
              Data penghuni
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Kelola penghuni aktif, kamar yang ditempati, tipe sewa, kontak,
              dan status sewa.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17211e] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#24332f]"
            onClick={openCreateForm}
            type="button"
          >
            <Plus size={18} />
            Tambah penghuni
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
              Ringkasan penghuni
            </h2>
          </div>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10 sm:w-72"
              placeholder="Cari penghuni"
              type="search"
            />
          </label>
        </div>

        {tenantCandidates.length ? (
          <div className="mt-5 rounded-[28px] border border-amber-100 bg-amber-50/70 p-4">
            <div>
              <p className="text-sm font-black text-amber-900">
                Menunggu pilih kamar
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Akun berikut sudah daftar sebagai penghuni dan akan aktif
                setelah memilih kamar kosong dari portal tenant.
              </p>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {tenantCandidates.map((candidate) => (
                <article
                  className="min-w-0 rounded-3xl border border-amber-100 bg-white p-4 shadow-sm"
                  key={candidate.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-black text-slate-950">
                        {candidate.full_name || candidate.email}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-500">
                        {candidate.email}
                      </p>
                      <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800">
                        Belum pilih kamar
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tenants.length ? (
          <div className="mt-5 space-y-3">
            {tenants.map((tenant) => (
              <article
                className="grid min-w-0 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto]"
                key={tenant.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-950">
                      {tenant.full_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Kamar {getTenantRoomName(tenant)} - Masuk{" "}
                      {tenant.move_in_date} -{" "}
                      {tenant.rent_type === "monthly" ? "Bulanan" : "Tahunan"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex max-w-full justify-self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 md:self-center">
                  {tenantStatusLabels[tenant.status]}
                </span>
                <div className="flex items-center gap-2 self-center">
                  <Link
                    aria-label={`Lihat detail penghuni ${tenant.full_name}`}
                    className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                    href={`/tenants/${tenant.id}`}
                  >
                    <Eye size={16} />
                  </Link>
                  <button
                    aria-label={`Edit penghuni ${tenant.full_name}`}
                    className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                    onClick={() => openEditForm(tenant)}
                    type="button"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={`Hapus penghuni ${tenant.full_name}`}
                    className="rounded-2xl border border-rose-100 p-2 text-rose-600 transition hover:bg-rose-50"
                    onClick={() => deleteTenant(tenant.id)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : tenantCandidates.length ? null : (
          <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center">
            <AlertTriangle className="mx-auto text-[#2a6b5c]" size={30} />
            <h3 className="mt-3 text-xl font-black text-slate-950">
              Belum ada penghuni
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Tambahkan penghuni pertama dan hubungkan ke kamar yang tersedia.
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
                  {editingTenant ? "Edit penghuni" : "Tambah penghuni"}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {editingTenant ? editingTenant.full_name : "Data penghuni baru"}
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
                <span className="text-sm font-bold text-slate-700">Kamar</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      roomId: event.target.value
                    }))
                  }
                  value={formValues.roomId}
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {room.floor ?? "Tanpa lantai"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Nama lengkap
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      fullName: event.target.value
                    }))
                  }
                  value={formValues.fullName}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      email: event.target.value
                    }))
                  }
                  type="email"
                  value={formValues.email}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Nomor WhatsApp
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      phone: event.target.value
                    }))
                  }
                  value={formValues.phone}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Tanggal masuk
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      moveInDate: event.target.value
                    }))
                  }
                  type="date"
                  value={formValues.moveInDate}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Tipe sewa
                </span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      rentType: event.target.value as TenantFormValues["rentType"]
                    }))
                  }
                  value={formValues.rentType}
                >
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Status</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      status: event.target.value as TenantFormValues["status"]
                    }))
                  }
                  value={formValues.status}
                >
                  <option value="active">Aktif</option>
                  <option value="leaving">Akan keluar</option>
                  <option value="left">Sudah keluar</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Kontak darurat
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      emergencyContact: event.target.value
                    }))
                  }
                  value={formValues.emergencyContact}
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
                onClick={saveTenant}
                type="button"
              >
                {isPending ? "Menyimpan..." : "Simpan penghuni"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}

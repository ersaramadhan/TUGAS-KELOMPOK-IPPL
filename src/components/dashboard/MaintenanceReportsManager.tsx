"use client";

import {
  AlertTriangle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  Wrench,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createMaintenanceReportAction,
  deleteMaintenanceReportAction,
  updateMaintenanceReportAction
} from "@/app/reports/actions";
import type { MaintenanceReportFormValues } from "@/app/reports/actions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type {
  OwnerMaintenanceReportRecord,
  OwnerTenantRecord
} from "@/lib/owner-data";
import { imageFileTypes, uploadAppFile } from "@/lib/supabase/storage";

type Metric = {
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "amber" | "rose" | "slate";
};

type MaintenanceReportsManagerProps = {
  metrics: Metric[];
  reports: OwnerMaintenanceReportRecord[];
  tenants: OwnerTenantRecord[];
};

const emptyFormValues: MaintenanceReportFormValues = {
  tenantId: "",
  roomId: "",
  title: "",
  description: "",
  photoPath: "",
  priority: "medium",
  status: "new",
  ownerNote: ""
};

const toneClasses: Record<Metric["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
};

const priorityLabels: Record<OwnerMaintenanceReportRecord["priority"], string> =
  {
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi"
  };

const priorityClasses: Record<
  OwnerMaintenanceReportRecord["priority"],
  string
> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-50 text-amber-800",
  high: "bg-rose-50 text-rose-700"
};

const statusLabels: Record<OwnerMaintenanceReportRecord["status"], string> = {
  new: "Baru",
  in_progress: "Sedang diproses",
  done: "Selesai",
  rejected: "Ditolak"
};

const statusClasses: Record<OwnerMaintenanceReportRecord["status"], string> = {
  new: "bg-amber-50 text-amber-800",
  in_progress: "bg-slate-100 text-slate-700",
  done: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-700"
};

function getTenantRoomName(tenant: OwnerTenantRecord) {
  if (Array.isArray(tenant.rooms)) {
    return tenant.rooms[0]?.name ?? "-";
  }

  return tenant.rooms?.name ?? "-";
}

function getReportTenantName(report: OwnerMaintenanceReportRecord) {
  if (Array.isArray(report.tenants)) {
    return report.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return report.tenants?.full_name ?? "Tanpa penghuni";
}

function getReportRoomName(report: OwnerMaintenanceReportRecord) {
  if (Array.isArray(report.rooms)) {
    return report.rooms[0]?.name ?? "-";
  }

  return report.rooms?.name ?? "-";
}

function reportToFormValues(
  report: OwnerMaintenanceReportRecord
): MaintenanceReportFormValues {
  return {
    id: report.id,
    tenantId: report.tenant_id,
    roomId: report.room_id,
    title: report.title,
    description: report.description,
    photoPath: report.photo_path ?? "",
    priority: report.priority,
    status: report.status,
    ownerNote: report.owner_note ?? ""
  };
}

function getInitialFormValues(
  tenants: OwnerTenantRecord[]
): MaintenanceReportFormValues {
  const firstTenant = tenants.find((tenant) => tenant.status === "active") ??
    tenants[0] ??
    null;

  return {
    ...emptyFormValues,
    tenantId: firstTenant?.id ?? "",
    roomId: firstTenant?.room_id ?? ""
  };
}

function createVisibleMetrics(
  reports: OwnerMaintenanceReportRecord[]
): Metric[] {
  const activeReports = reports.filter((report) =>
    ["new", "in_progress"].includes(report.status)
  );
  const highPriority = reports.filter(
    (report) => report.priority === "high" && report.status !== "done"
  ).length;
  const inProgressReports = reports.filter(
    (report) => report.status === "in_progress"
  );
  const doneCount = reports.filter((report) => report.status === "done").length;

  return [
    {
      label: "Aktif",
      value: `${activeReports.length}`,
      note: activeReports.length ? "Butuh tindakan" : "Tidak ada laporan aktif",
      tone: activeReports.length ? "amber" : "emerald"
    },
    {
      label: "Urgent",
      value: `${highPriority}`,
      note: highPriority ? "Prioritas tinggi" : "Tidak ada prioritas tinggi",
      tone: highPriority ? "rose" : "emerald"
    },
    {
      label: "Diproses",
      value: `${inProgressReports.length}`,
      note: inProgressReports[0]
        ? `Kamar ${getReportRoomName(inProgressReports[0])}`
        : "Belum ada pekerjaan berjalan",
      tone: inProgressReports.length ? "slate" : "emerald"
    },
    {
      label: "Selesai",
      value: `${doneCount}`,
      note: "Laporan selesai",
      tone: "emerald"
    }
  ];
}

export function MaintenanceReportsManager({
  reports,
  tenants
}: MaintenanceReportsManagerProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValues, setFormValues] =
    useState<MaintenanceReportFormValues>(emptyFormValues);
  const [reportOverrides, setReportOverrides] = useState<
    Record<string, Partial<OwnerMaintenanceReportRecord>>
  >({});
  const [deletedReportIds, setDeletedReportIds] = useState<string[]>([]);
  const [editingReport, setEditingReport] =
    useState<OwnerMaintenanceReportRecord | null>(null);
  const [photoFileName, setPhotoFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const visibleReports = reports
    .filter((report) => !deletedReportIds.includes(report.id))
    .map((report) => ({
      ...report,
      ...reportOverrides[report.id]
    }));
  const visibleMetrics = createVisibleMetrics(visibleReports);

  function openCreateForm() {
    setEditingReport(null);
    setFormValues(getInitialFormValues(tenants));
    setPhotoFileName("");
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(report: OwnerMaintenanceReportRecord) {
    setEditingReport(report);
    setFormValues(reportToFormValues(report));
    setPhotoFileName(report.photo_path ?? "");
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingReport(null);
    setFormValues(emptyFormValues);
    setPhotoFileName("");
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

  function saveReport() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = editingReport
        ? await updateMaintenanceReportAction(formValues)
        : await createMaintenanceReportAction(formValues);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      if (editingReport) {
        setReportOverrides((currentOverrides) => ({
          ...currentOverrides,
          [editingReport.id]: {
            title: formValues.title,
            description: formValues.description,
            photo_path: formValues.photoPath || null,
            priority: formValues.priority,
            status: formValues.status,
            owner_note: formValues.ownerNote || null
          }
        }));
      }
      closeForm();
      router.refresh();
    });
  }

  function deleteReport(reportId: string) {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await deleteMaintenanceReportAction(reportId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      setDeletedReportIds((currentIds) => [...currentIds, reportId]);
      router.refresh();
    });
  }

  async function uploadReportPhoto(file: File | undefined) {
    if (!file) {
      return;
    }

    setError("");
    setMessage("");
    setIsUploading(true);

    try {
      const path = await uploadAppFile({
        bucket: "report-photos",
        file,
        folder: "owner-reports",
        allowedTypes: imageFileTypes
      });

      setPhotoFileName(file.name);
      setFormValues((currentValues) => ({
        ...currentValues,
        photoPath: path
      }));
      setMessage("Foto laporan berhasil diupload.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal upload foto laporan."
      );
    } finally {
      setIsUploading(false);
    }
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
              Laporan kerusakan
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
              Kerusakan dan perbaikan
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Pantau laporan kerusakan dari penghuni, prioritas pengerjaan,
              status perbaikan, dan catatan tindak lanjut.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17211e] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#24332f]"
            onClick={openCreateForm}
            type="button"
          >
            <Plus size={18} />
            Buat laporan
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
        {visibleMetrics.map((metric) => (
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
              Daftar laporan
            </h2>
          </div>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10 sm:w-72"
              placeholder="Cari laporan"
              type="search"
            />
          </label>
        </div>

        {visibleReports.length ? (
          <div className="mt-5 space-y-3">
            {visibleReports.map((report) => (
              <article
                className="grid min-w-0 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
                key={report.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                    <Wrench size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-950">{report.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Kamar {getReportRoomName(report)} -{" "}
                      {getReportTenantName(report)} -{" "}
                      {report.created_at.slice(0, 10)}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex max-w-full justify-self-start rounded-full px-3 py-1.5 text-xs font-black md:self-center ${priorityClasses[report.priority]}`}
                >
                  {priorityLabels[report.priority]}
                </span>
                <span
                  className={`inline-flex max-w-full justify-self-start rounded-full px-3 py-1.5 text-xs font-black md:self-center ${statusClasses[report.status]}`}
                >
                  {statusLabels[report.status]}
                </span>
                <div className="flex items-center gap-2 self-center">
                  <button
                    aria-label={`Edit laporan ${report.title}`}
                    className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                    onClick={() => openEditForm(report)}
                    type="button"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={`Hapus laporan ${report.title}`}
                    className="rounded-2xl border border-rose-100 p-2 text-rose-600 transition hover:bg-rose-50"
                    onClick={() => deleteReport(report.id)}
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
              Belum ada laporan kerusakan
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Buat laporan pertama dari data penghuni aktif atau tunggu laporan
              dari portal penghuni.
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
                  {editingReport ? "Edit laporan" : "Buat laporan"}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {editingReport ? editingReport.title : "Laporan baru"}
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
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10 disabled:bg-slate-50"
                  disabled={!tenants.length}
                  onChange={(event) => selectTenant(event.target.value)}
                  value={formValues.tenantId}
                >
                  {!tenants.length ? (
                    <option value="">Belum ada penghuni</option>
                  ) : null}
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.full_name} - Kamar {getTenantRoomName(tenant)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Judul masalah
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      title: event.target.value
                    }))
                  }
                  placeholder="Contoh: Keran kamar mandi bocor"
                  value={formValues.title}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Prioritas
                </span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      priority: event.target
                        .value as MaintenanceReportFormValues["priority"]
                    }))
                  }
                  value={formValues.priority}
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Status
                </span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      status: event.target
                        .value as MaintenanceReportFormValues["status"]
                    }))
                  }
                  value={formValues.status}
                >
                  <option value="new">Baru</option>
                  <option value="in_progress">Sedang diproses</option>
                  <option value="done">Selesai</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Deskripsi
                </span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      description: event.target.value
                    }))
                  }
                  value={formValues.description}
                />
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-[#2a6b5c] sm:col-span-2">
                <UploadCloud className="text-[#2a6b5c]" size={32} />
                <span className="mt-3 text-sm font-black text-slate-950">
                  {photoFileName || "Upload foto kerusakan"}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  JPG, PNG, atau WebP. Maksimal 5 MB
                </span>
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => uploadReportPhoto(event.target.files?.[0])}
                  type="file"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Catatan pemilik
                </span>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      ownerNote: event.target.value
                    }))
                  }
                  value={formValues.ownerNote}
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
                disabled={isPending || isUploading}
                onClick={closeForm}
                type="button"
              >
                Batal
              </button>
              <button
                className="rounded-2xl bg-[#2a6b5c] px-4 py-3 text-sm font-black text-white transition hover:bg-[#23594d] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending || isUploading}
                onClick={saveReport}
                type="button"
              >
                {isUploading
                  ? "Upload foto..."
                  : isPending
                    ? "Menyimpan..."
                    : "Simpan laporan"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}

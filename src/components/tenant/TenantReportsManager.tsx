"use client";

import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createTenantReportAction } from "@/app/tenant/reports/actions";
import type { TenantReportFormValues } from "@/app/tenant/reports/actions";
import { TenantCard } from "@/components/tenant/TenantCard";
import { TenantListPanel } from "@/components/tenant/TenantListPanel";
import { TenantShell } from "@/components/tenant/TenantShell";
import { imageFileTypes, uploadAppFile } from "@/lib/supabase/storage";
import type {
  TenantPortalProfile,
  TenantPortalReport
} from "@/lib/tenant-data";

type TenantReportsManagerProps = {
  profile: TenantPortalProfile;
  reports: TenantPortalReport[];
  sourceReason?: string;
};

const emptyFormValues: TenantReportFormValues = {
  title: "",
  description: "",
  priority: "medium",
  photoPath: ""
};

function tenantReportRowsFromData(reports: TenantPortalReport[]) {
  const priorityLabels: Record<TenantPortalReport["priority"], string> = {
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi"
  };
  const statusLabels: Record<TenantPortalReport["status"], string> = {
    new: "Baru",
    in_progress: "Diproses",
    done: "Selesai",
    rejected: "Ditolak"
  };

  return reports.map((report) => ({
    title: report.title,
    meta: `${priorityLabels[report.priority]} - ${report.createdAt.slice(
      0,
      10
    )}`,
    status: statusLabels[report.status]
  }));
}

export function TenantReportsManager({
  profile,
  reports,
  sourceReason
}: TenantReportsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] =
    useState<TenantReportFormValues>(emptyFormValues);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const activeCount = reports.filter((report) =>
    ["new", "in_progress"].includes(report.status)
  ).length;
  const doneCount = reports.filter((report) => report.status === "done").length;
  const priorityLabel =
    formValues.priority === "high"
      ? "Tinggi"
      : formValues.priority === "low"
        ? "Rendah"
        : "Sedang";

  function submitReport() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await createTenantReportAction(formValues);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      setFormValues(emptyFormValues);
      setFileName("");
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
        folder: `tenant-${profile.tenantId}`,
        allowedTypes: imageFileTypes
      });

      setFileName(file.name);
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
    <TenantShell profile={profile} sourceReason={sourceReason}>
      <section className="grid gap-4 md:grid-cols-3">
        <TenantCard
          label="Laporan aktif"
          note="Menunggu tindakan pemilik"
          tone={activeCount ? "amber" : "emerald"}
          value={`${activeCount}`}
        />
        <TenantCard
          label="Selesai"
          note="Riwayat laporan selesai"
          tone="emerald"
          value={`${doneCount}`}
        />
        <TenantCard
          label="Prioritas"
          note="Default laporan baru"
          value={priorityLabel}
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
          <p className="text-sm font-bold text-[#2a6b5c]">
            Buat laporan kerusakan
          </p>
          <h1 className="text-2xl font-black text-slate-950">
            Ceritakan masalah kamar
          </h1>

          <div className="mt-5 space-y-4">
            <label className="block">
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
                value={formValues.title}
              />
            </label>
            <label className="block">
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
                      .value as TenantReportFormValues["priority"]
                  }))
                }
                value={formValues.priority}
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </select>
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-[#2a6b5c]">
              <UploadCloud className="text-[#2a6b5c]" size={32} />
              <span className="mt-3 text-sm font-black text-slate-950">
                {fileName || "Upload foto kerusakan"}
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

          <button
            className="mt-5 w-full rounded-2xl bg-[#2a6b5c] px-4 py-3 text-sm font-black text-white transition hover:bg-[#23594d] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending || isUploading}
            onClick={submitReport}
            type="button"
          >
            {isUploading
              ? "Upload foto..."
              : isPending
                ? "Mengirim..."
                : "Kirim laporan"}
          </button>
        </section>

        <TenantListPanel
          emptyMessage="Belum ada laporan kerusakan."
          eyebrow="Riwayat laporan"
          rows={tenantReportRowsFromData(reports)}
          title={`${reports.length} laporan`}
        />
      </section>
    </TenantShell>
  );
}

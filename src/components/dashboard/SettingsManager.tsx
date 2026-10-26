"use client";

import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  RotateCcw,
  Save,
  WalletCards
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  updateOwnerSettingsAction,
  type SettingsFormValues
} from "@/app/settings/actions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { OwnerSettingsData } from "@/lib/settings-data";

type SettingsManagerProps = {
  data: OwnerSettingsData;
};

type Metric = OwnerSettingsData["metrics"][number];

const toneClasses: Record<Metric["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
};

function createFormValues(data: OwnerSettingsData): SettingsFormValues {
  return {
    fullName: data.profile.full_name,
    phone: data.profile.phone ?? "",
    propertyName: data.property?.name ?? "",
    address: data.property?.address ?? "",
    paymentAccount: data.property?.payment_account ?? ""
  };
}

export function SettingsManager({ data }: SettingsManagerProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState<SettingsFormValues>(() =>
    createFormValues(data)
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function resetForm() {
    setFormValues(createFormValues(data));
    setError("");
    setMessage("");
  }

  function saveSettings() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateOwnerSettingsAction(formValues);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (result.data) {
        setFormValues(result.data);
      }

      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <DashboardShell
      brand={{
        ownerName: formValues.fullName,
        propertyName: formValues.propertyName
      }}
      preferBrand
      isSidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onOpenSidebar={() => setSidebarOpen(true)}
    >
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#2a6b5c]">Pengaturan</p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
              Pengaturan kos
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              Atur profil owner, identitas kos, alamat, dan rekening pembayaran
              yang dipakai di seluruh aplikasi.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
              disabled={isPending}
              onClick={resetForm}
              type="button"
            >
              <RotateCcw size={18} />
              Reset
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17211e] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#24332f] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={saveSettings}
              type="button"
            >
              <Save size={18} />
              {isPending ? "Menyimpan..." : "Simpan pengaturan"}
            </button>
          </div>
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

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <article className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#2a6b5c]">
                Data utama
              </p>
              <h2 className="text-2xl font-black text-slate-950">
                Profil dan properti
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Perubahan di sini menjadi referensi untuk modul kamar, tagihan,
                pembayaran, dan laporan.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block min-w-0">
              <span className="text-sm font-bold text-slate-700">
                Nama owner
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                onChange={(event) =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    fullName: event.target.value
                  }))
                }
                placeholder="Contoh: Adam Pratama"
                value={formValues.fullName}
              />
            </label>
            <label className="block min-w-0">
              <span className="text-sm font-bold text-slate-700">
                Nomor WhatsApp
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                inputMode="tel"
                onChange={(event) =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    phone: event.target.value
                  }))
                }
                placeholder="Contoh: 081234567890"
                value={formValues.phone}
              />
            </label>
            <label className="block min-w-0">
              <span className="text-sm font-bold text-slate-700">
                Nama kos
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                onChange={(event) =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    propertyName: event.target.value
                  }))
                }
                placeholder="Contoh: KosPilot Melati"
                value={formValues.propertyName}
              />
            </label>
            <label className="block min-w-0">
              <span className="text-sm font-bold text-slate-700">
                Rekening pembayaran
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                onChange={(event) =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    paymentAccount: event.target.value
                  }))
                }
                placeholder="Contoh: BCA 1234567890 a.n. Adam"
                value={formValues.paymentAccount}
              />
            </label>
            <label className="block min-w-0 md:col-span-2">
              <span className="text-sm font-bold text-slate-700">
                Alamat kos
              </span>
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                onChange={(event) =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    address: event.target.value
                  }))
                }
                placeholder="Contoh: Jl. Melati No. 14, Bandung"
                value={formValues.address}
              />
            </label>
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f8fafc] text-slate-700">
                <ClipboardCheck size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#2a6b5c]">Ringkasan</p>
                <h2 className="text-xl font-black text-slate-950">
                  Status pengaturan
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {data.rows.map((row) => (
                <div
                  className="rounded-3xl border border-slate-100 bg-white p-4"
                  key={row.title}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black text-slate-950">
                        {row.title}
                      </p>
                      <p className="mt-1 break-words text-sm leading-5 text-slate-500">
                        {row.meta}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {!data.property ? (
            <article className="rounded-[28px] border border-dashed border-amber-200 bg-amber-50/70 p-5">
              <AlertTriangle className="text-amber-700" size={24} />
              <h3 className="mt-3 text-lg font-black text-slate-950">
                Properti belum dibuat
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Isi nama kos lalu simpan. Setelah properti dibuat, modul kamar
                dan data operasional bisa memakai properti owner ini.
              </p>
            </article>
          ) : (
            <article className="rounded-[28px] border border-white/70 bg-[#17211e] p-5 text-white shadow-sm">
              <WalletCards className="text-[#d9f99d]" size={24} />
              <h3 className="mt-3 text-lg font-black">Akun pembayaran</h3>
              <p className="mt-2 break-words text-sm leading-6 text-white/65">
                {data.property.payment_account ||
                  "Tambahkan rekening agar instruksi pembayaran lebih lengkap."}
              </p>
            </article>
          )}
        </aside>
      </section>
    </DashboardShell>
  );
}

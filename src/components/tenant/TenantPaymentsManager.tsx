"use client";

/* eslint-disable @next/next/no-img-element -- Payment proof previews use local blob URLs. */

import { FileText, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { uploadTenantPaymentProofAction } from "@/app/tenant/payments/actions";
import type { TenantPaymentFormValues } from "@/app/tenant/payments/actions";
import { TenantCard } from "@/components/tenant/TenantCard";
import { TenantListPanel } from "@/components/tenant/TenantListPanel";
import { TenantShell } from "@/components/tenant/TenantShell";
import { formatMoney } from "@/lib/dashboard";
import { proofFileTypes, uploadAppFile } from "@/lib/supabase/storage";
import type {
  TenantPortalBill,
  TenantPortalPayment,
  TenantPortalProfile
} from "@/lib/tenant-data";

type TenantPaymentsManagerProps = {
  profile: TenantPortalProfile;
  bills: TenantPortalBill[];
  payments: TenantPortalPayment[];
  sourceReason?: string;
};

function getInitialFormValues(bills: TenantPortalBill[]): TenantPaymentFormValues {
  const firstBill =
    bills.find((bill) => bill.status !== "paid") ?? bills[0] ?? null;

  return {
    billId: firstBill?.id ?? "",
    amount: firstBill ? `${firstBill.amount}` : "",
    method: "Transfer bank",
    proofPath: "",
    note: ""
  };
}

function tenantPaymentRowsFromData(payments: TenantPortalPayment[]) {
  const statusLabels: Record<TenantPortalPayment["status"], string> = {
    pending: "Menunggu verifikasi",
    approved: "Terverifikasi",
    rejected: "Ditolak"
  };

  return payments.map((payment) => ({
    title: payment.billPeriod,
    meta: `${payment.method} - ${payment.paidAt.slice(0, 10)}`,
    amount: formatMoney(payment.amount),
    status: statusLabels[payment.status]
  }));
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function TenantPaymentsManager({
  profile,
  bills,
  payments,
  sourceReason
}: TenantPaymentsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState<TenantPaymentFormValues>(
    getInitialFormValues(bills)
  );
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState<"image" | "file" | "">("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const approvedTotal = payments
    .filter((payment) => payment.status === "approved")
    .reduce((total, payment) => total + payment.amount, 0);
  const pendingCount = payments.filter(
    (payment) => payment.status === "pending"
  ).length;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function selectBill(billId: string) {
    const bill = bills.find((item) => item.id === billId);

    setFormValues((currentValues) => ({
      ...currentValues,
      billId,
      amount: bill ? `${bill.amount}` : currentValues.amount
    }));
  }

  function submitProof() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await uploadTenantPaymentProofAction(formValues);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      setFileName("");
      setPreviewType("");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
      setFormValues(getInitialFormValues(bills));
      router.refresh();
    });
  }

  async function uploadProofFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setError("");
    setMessage("");
    setIsUploading(true);
    const nextPreviewUrl = isImageFile(file) ? URL.createObjectURL(file) : "";

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    setFileName(file.name);
    setPreviewType(isImageFile(file) ? "image" : "file");
    if (nextPreviewUrl) {
      setPreviewUrl(nextPreviewUrl);
    }

    try {
      const path = await uploadAppFile({
        bucket: "payment-proofs",
        file,
        folder: `tenant-${profile.tenantId}`,
        allowedTypes: proofFileTypes
      });

      setFormValues((currentValues) => ({
        ...currentValues,
        proofPath: path
      }));
      setMessage("File bukti berhasil diupload.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal upload file bukti."
      );
      setFileName("");
      setPreviewType("");
      if (nextPreviewUrl) {
        URL.revokeObjectURL(nextPreviewUrl);
        setPreviewUrl("");
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <TenantShell profile={profile} sourceReason={sourceReason}>
      <section className="grid gap-4 md:grid-cols-3">
        <TenantCard
          label="Total dibayar"
          note="Pembayaran terverifikasi"
          tone="emerald"
          value={formatMoney(approvedTotal)}
        />
        <TenantCard
          label="Menunggu"
          note="Bukti sedang dicek pemilik"
          tone="amber"
          value={`${pendingCount}`}
        />
        <TenantCard label="Metode" note="Transfer manual" value="Bank" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
          <p className="text-sm font-bold text-[#2a6b5c]">
            Upload bukti pembayaran
          </p>
          <h1 className="text-2xl font-black text-slate-950">
            Kirim bukti ke pemilik
          </h1>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Tagihan</span>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10 disabled:bg-slate-50"
                disabled={!bills.length}
                onChange={(event) => selectBill(event.target.value)}
                value={formValues.billId}
              >
                {!bills.length ? <option value="">Belum ada tagihan</option> : null}
                {bills.map((bill) => (
                  <option key={bill.id} value={bill.id}>
                    {bill.period} - {formatMoney(bill.amount)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Nominal bayar
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
                value={formValues.amount}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Metode</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                onChange={(event) =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    method: event.target.value
                  }))
                }
                value={formValues.method}
              />
            </label>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-[#2a6b5c]">
              <UploadCloud className="text-[#2a6b5c]" size={32} />
              <span className="mt-3 text-sm font-black text-slate-950">
                {fileName || "Pilih gambar atau PDF"}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                Gambar atau PDF, maksimal 5 MB
              </span>
              <input
                accept="image/*,.pdf"
                disabled={!bills.length}
                className="hidden"
                onChange={(event) => uploadProofFile(event.target.files?.[0])}
                type="file"
              />
            </label>

            {fileName ? (
              <div className="rounded-[28px] border border-slate-100 bg-white p-4">
                <p className="text-sm font-black text-slate-950">
                  Preview bukti
                </p>
                {previewType === "image" && previewUrl ? (
                  <img
                    alt={`Preview bukti pembayaran ${fileName}`}
                    className="mt-3 max-h-72 w-full rounded-2xl border border-slate-100 object-contain"
                    src={previewUrl}
                  />
                ) : (
                  <div className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2a6b5c]">
                      <FileText size={22} />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black text-slate-950">
                        {fileName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        File siap dikirim sebagai bukti pembayaran.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
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
            disabled={isPending || isUploading || !bills.length}
            onClick={submitProof}
            type="button"
          >
            {isUploading ? "Upload file..." : isPending ? "Mengirim..." : "Kirim bukti"}
          </button>
        </section>

        <TenantListPanel
          emptyMessage="Belum ada riwayat pembayaran."
          eyebrow="Riwayat pembayaran"
          rows={tenantPaymentRowsFromData(payments)}
          title={`${payments.length} transaksi`}
        />
      </section>
    </TenantShell>
  );
}

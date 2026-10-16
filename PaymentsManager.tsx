"use client";

/* eslint-disable @next/next/no-img-element -- Payment proof previews use blob and private signed URLs. */

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  createPaymentAction,
  deletePaymentAction,
  updatePaymentAction
} from "@/app/payments/actions";
import type { PaymentFormValues } from "@/app/payments/actions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { formatDateInputValue } from "@/lib/date";
import { formatMoney } from "@/lib/dashboard";
import type { OwnerBillRecord, OwnerPaymentRecord } from "@/lib/owner-data";
import { proofFileTypes, uploadAppFile } from "@/lib/supabase/storage";

type Metric = {
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "amber" | "rose" | "slate";
};

type PaymentsManagerProps = {
  metrics: Metric[];
  payments: OwnerPaymentRecord[];
  bills: OwnerBillRecord[];
};

const emptyFormValues: PaymentFormValues = {
  billId: "",
  paidAt: "",
  amount: "",
  method: "Transfer bank",
  proofPath: "",
  note: "",
  verificationStatus: "pending"
};

const toneClasses: Record<Metric["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
};

const paymentStatusLabels: Record<
  OwnerPaymentRecord["verification_status"],
  string
> = {
  pending: "Menunggu verifikasi",
  approved: "Terverifikasi",
  rejected: "Ditolak"
};

const paymentStatusClasses: Record<
  OwnerPaymentRecord["verification_status"],
  string
> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-700"
};

type ProofPreview = {
  kind: "image" | "file";
  label: string;
  title: string;
  url: string;
  isLocal?: boolean;
};

function getPaymentBill(payment: OwnerPaymentRecord) {
  if (Array.isArray(payment.bills)) {
    return payment.bills[0] ?? null;
  }

  return payment.bills;
}

function getBillTenantName(bill: OwnerBillRecord) {
  if (Array.isArray(bill.tenants)) {
    return bill.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return bill.tenants?.full_name ?? "Tanpa penghuni";
}

function getBillRoomName(bill: OwnerBillRecord) {
  if (Array.isArray(bill.rooms)) {
    return bill.rooms[0]?.name ?? "-";
  }

  return bill.rooms?.name ?? "-";
}

function getPaymentTenantName(payment: OwnerPaymentRecord) {
  const bill = getPaymentBill(payment);

  if (Array.isArray(bill?.tenants)) {
    return bill.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return bill?.tenants?.full_name ?? "Tanpa penghuni";
}

function getPaymentRoomName(payment: OwnerPaymentRecord) {
  const bill = getPaymentBill(payment);

  if (Array.isArray(bill?.rooms)) {
    return bill.rooms[0]?.name ?? "-";
  }

  return bill?.rooms?.name ?? "-";
}

function getProofFileName(proofPath: string | null) {
  return proofPath?.split("/").pop() ?? "Bukti pembayaran";
}

function isImageProof(proofPath: string | null) {
  return /\.(jpe?g|png|webp|gif)$/i.test(proofPath ?? "");
}

function proofPreviewFromPayment(
  payment: OwnerPaymentRecord
): ProofPreview | null {
  if (!payment.proof_path) {
    return null;
  }

  return {
    kind: isImageProof(payment.proof_path) ? "image" : "file",
    label: getProofFileName(payment.proof_path),
    title: `Bukti pembayaran ${getPaymentTenantName(payment)}`,
    url: payment.proof_url ?? ""
  };
}

function paymentToFormValues(payment: OwnerPaymentRecord): PaymentFormValues {
  return {
    id: payment.id,
    billId: payment.bill_id,
    paidAt: payment.paid_at.slice(0, 10),
    amount: `${payment.amount}`,
    method: payment.method,
    proofPath: payment.proof_path ?? "",
    note: payment.note ?? "",
    verificationStatus: payment.verification_status
  };
}

function getInitialFormValues(bills: OwnerBillRecord[]): PaymentFormValues {
  const firstBill =
    bills.find((bill) => bill.status !== "paid") ?? bills[0] ?? null;

  return {
    ...emptyFormValues,
    billId: firstBill?.id ?? "",
    amount: firstBill ? `${firstBill.amount}` : "",
    paidAt: formatDateInputValue()
  };
}

export function PaymentsManager({
  metrics,
  payments,
  bills
}: PaymentsManagerProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<PaymentFormValues>(
    emptyFormValues
  );
  const [editingPayment, setEditingPayment] =
    useState<OwnerPaymentRecord | null>(null);
  const [proofFileName, setProofFileName] = useState("");
  const [formProofPreview, setFormProofPreview] =
    useState<ProofPreview | null>(null);
  const [proofPreview, setProofPreview] = useState<ProofPreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (formProofPreview?.isLocal && formProofPreview.url) {
        URL.revokeObjectURL(formProofPreview.url);
      }
    };
  }, [formProofPreview]);

  function openCreateForm() {
    setEditingPayment(null);
    setFormValues(getInitialFormValues(bills));
    setProofFileName("");
    setFormProofPreview(null);
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(payment: OwnerPaymentRecord) {
    const preview = proofPreviewFromPayment(payment);

    setEditingPayment(payment);
    setFormValues(paymentToFormValues(payment));
    setProofFileName(preview?.label ?? "");
    setFormProofPreview(preview);
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingPayment(null);
    setFormValues(emptyFormValues);
    setProofFileName("");
    setFormProofPreview(null);
    setError("");
    setIsFormOpen(false);
  }

  function selectBill(billId: string) {
    const bill = bills.find((item) => item.id === billId);

    setFormValues((currentValues) => ({
      ...currentValues,
      billId,
      amount: bill ? `${bill.amount}` : currentValues.amount
    }));
  }

  function savePayment() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = editingPayment
        ? await updatePaymentAction(formValues)
        : await createPaymentAction(formValues);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      closeForm();
      router.refresh();
    });
  }

  function deletePayment(paymentId: string) {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await deletePaymentAction(paymentId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      router.refresh();
    });
  }

  async function uploadPaymentProof(file: File | undefined) {
    if (!file) {
      return;
    }

    setError("");
    setMessage("");
    setIsUploading(true);
    const nextPreviewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : "";

    setProofFileName(file.name);
    setFormProofPreview({
      kind: file.type.startsWith("image/") ? "image" : "file",
      label: file.name,
      title: "Preview bukti pembayaran",
      url: nextPreviewUrl,
      isLocal: Boolean(nextPreviewUrl)
    });

    try {
      const path = await uploadAppFile({
        bucket: "payment-proofs",
        file,
        folder: "owner-payments",
        allowedTypes: proofFileTypes
      });

      setFormValues((currentValues) => ({
        ...currentValues,
        proofPath: path
      }));
      setMessage("Bukti pembayaran berhasil diupload.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal upload bukti pembayaran."
      );
      setProofFileName("");
      setFormProofPreview(null);
      if (nextPreviewUrl) {
        URL.revokeObjectURL(nextPreviewUrl);
      }
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
            <p className="text-sm font-bold text-[#2a6b5c]">Pembayaran</p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
              Verifikasi pembayaran
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Catat pembayaran penghuni, verifikasi statusnya, dan sinkronkan
              status tagihan.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17211e] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#24332f]"
            onClick={openCreateForm}
            type="button"
          >
            <Plus size={18} />
            Catat pembayaran
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
              Riwayat pembayaran
            </h2>
          </div>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10 sm:w-72"
              placeholder="Cari pembayaran"
              type="search"
            />
          </label>
        </div>

        {payments.length ? (
          <div className="mt-5 space-y-3">
            {payments.map((payment) => {
              const bill = getPaymentBill(payment);
              const preview = proofPreviewFromPayment(payment);

              return (
                <article
                  className="grid min-w-0 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]"
                  key={payment.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-950">
                        {getPaymentTenantName(payment)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Kamar {getPaymentRoomName(payment)} -{" "}
                        {bill?.period ?? "-"} - {payment.method} -{" "}
                        {payment.paid_at.slice(0, 10)}
                      </p>
                    </div>
                  </div>
                  {preview ? (
                    <button
                      className="inline-flex min-w-0 items-center gap-2 justify-self-start rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c] md:self-center"
                      onClick={() => setProofPreview(preview)}
                      type="button"
                    >
                      {preview.kind === "image" && preview.url ? (
                        <img
                          alt=""
                          className="size-8 rounded-xl object-cover"
                          src={preview.url}
                        />
                      ) : (
                        <FileText className="shrink-0" size={16} />
                      )}
                      <span className="max-w-28 truncate">Lihat bukti</span>
                    </button>
                  ) : (
                    <span className="inline-flex justify-self-start rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-400 md:self-center">
                      Tanpa bukti
                    </span>
                  )}
                  <p className="self-center whitespace-nowrap font-black text-slate-950">
                    {formatMoney(payment.amount)}
                  </p>
                  <span
                    className={`inline-flex max-w-full justify-self-start rounded-full px-3 py-1.5 text-xs font-black md:self-center ${paymentStatusClasses[payment.verification_status]}`}
                  >
                    {paymentStatusLabels[payment.verification_status]}
                  </span>
                  <div className="flex items-center gap-2 self-center">
                    <button
                      aria-label={`Edit pembayaran ${getPaymentTenantName(
                        payment
                      )}`}
                      className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                      onClick={() => openEditForm(payment)}
                      type="button"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      aria-label={`Hapus pembayaran ${getPaymentTenantName(
                        payment
                      )}`}
                      className="rounded-2xl border border-rose-100 p-2 text-rose-600 transition hover:bg-rose-50"
                      onClick={() => deletePayment(payment.id)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center">
            <AlertTriangle className="mx-auto text-[#2a6b5c]" size={30} />
            <h3 className="mt-3 text-xl font-black text-slate-950">
              Belum ada pembayaran
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Catat pembayaran pertama dari tagihan yang sudah dibuat.
            </p>
          </div>
        )}
      </section>

      {proofPreview ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <section className="max-h-[calc(100vh-32px)] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/70 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#2a6b5c]">
                  Preview bukti pembayaran
                </p>
                <h2 className="mt-1 break-words text-2xl font-black text-slate-950">
                  {proofPreview.title}
                </h2>
                <p className="mt-1 break-words text-sm text-slate-500">
                  {proofPreview.label}
                </p>
              </div>
              <button
                aria-label="Tutup preview bukti pembayaran"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setProofPreview(null)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50">
              {proofPreview.kind === "image" && proofPreview.url ? (
                <img
                  alt={proofPreview.title}
                  className="max-h-[70vh] w-full object-contain"
                  src={proofPreview.url}
                />
              ) : proofPreview.url ? (
                <iframe
                  className="h-[70vh] w-full bg-white"
                  src={proofPreview.url}
                  title={proofPreview.title}
                />
              ) : (
                <div className="p-8 text-center">
                  <FileText className="mx-auto text-[#2a6b5c]" size={36} />
                  <h3 className="mt-3 text-xl font-black text-slate-950">
                    Preview belum tersedia
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    File tersimpan, tetapi aplikasi belum bisa membuat tautan
                    preview. Periksa policy Storage untuk bucket
                    payment-proofs.
                  </p>
                </div>
              )}
            </div>

            {proofPreview.url ? (
              <a
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                href={proofPreview.url}
                rel="noreferrer"
                target="_blank"
              >
                Buka di tab baru
                <ExternalLink size={16} />
              </a>
            ) : null}
          </section>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="max-h-[calc(100vh-32px)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/70 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#2a6b5c]">
                  {editingPayment ? "Edit pembayaran" : "Catat pembayaran"}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {editingPayment
                    ? getPaymentTenantName(editingPayment)
                    : "Pembayaran baru"}
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
                  Tagihan
                </span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10 disabled:bg-slate-50"
                  disabled={!bills.length}
                  onChange={(event) => selectBill(event.target.value)}
                  value={formValues.billId}
                >
                  {!bills.length ? (
                    <option value="">Belum ada tagihan</option>
                  ) : null}
                  {bills.map((bill) => (
                    <option key={bill.id} value={bill.id}>
                      {getBillTenantName(bill)} - Kamar {getBillRoomName(bill)} -{" "}
                      {bill.period} - {formatMoney(bill.amount)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Tanggal bayar
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      paidAt: event.target.value
                    }))
                  }
                  type="date"
                  value={formValues.paidAt}
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
                  Metode
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      method: event.target.value
                    }))
                  }
                  placeholder="Transfer bank, tunai, e-wallet"
                  value={formValues.method}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Status verifikasi
                </span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      verificationStatus: event.target
                        .value as PaymentFormValues["verificationStatus"]
                    }))
                  }
                  value={formValues.verificationStatus}
                >
                  <option value="pending">Menunggu verifikasi</option>
                  <option value="approved">Terverifikasi</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-[#2a6b5c] sm:col-span-2">
                <UploadCloud className="text-[#2a6b5c]" size={32} />
                <span className="mt-3 text-sm font-black text-slate-950">
                  {proofFileName || "Upload bukti pembayaran"}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  Gambar atau PDF, maksimal 5 MB
                </span>
                <input
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(event) => uploadPaymentProof(event.target.files?.[0])}
                  type="file"
                />
              </label>
              {formProofPreview ? (
                <div className="rounded-[28px] border border-slate-100 bg-white p-4 sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">
                      Preview bukti
                    </p>
                    {formProofPreview.url ? (
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                        onClick={() => setProofPreview(formProofPreview)}
                        type="button"
                      >
                        <Eye size={15} />
                        Lihat besar
                      </button>
                    ) : null}
                  </div>
                  {formProofPreview.kind === "image" && formProofPreview.url ? (
                    <img
                      alt={`Preview ${formProofPreview.label}`}
                      className="mt-3 max-h-80 w-full rounded-2xl border border-slate-100 object-contain"
                      src={formProofPreview.url}
                    />
                  ) : (
                    <div className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2a6b5c]">
                        <FileText size={22} />
                      </span>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-black text-slate-950">
                          {formProofPreview.label}
                        </p>
                        {formProofPreview.url ? (
                          <a
                            className="mt-1 inline-flex items-center gap-1 text-xs font-black text-[#2a6b5c]"
                            href={formProofPreview.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Buka file
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">
                            File tersimpan, tetapi preview belum tersedia.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Catatan
                </span>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      note: event.target.value
                    }))
                  }
                  value={formValues.note}
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
                onClick={savePayment}
                type="button"
              >
                {isUploading
                  ? "Upload bukti..."
                  : isPending
                    ? "Menyimpan..."
                    : "Simpan pembayaran"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}

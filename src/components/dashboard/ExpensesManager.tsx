"use client";

import {
  AlertTriangle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  WalletCards,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createExpenseAction,
  deleteExpenseAction,
  updateExpenseAction
} from "@/app/expenses/actions";
import type { ExpenseFormValues } from "@/app/expenses/actions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { formatDateInputValue } from "@/lib/date";
import { formatMoney } from "@/lib/dashboard";
import { proofFileTypes, uploadAppFile } from "@/lib/supabase/storage";
import type { OwnerExpenseRecord } from "@/lib/owner-data";

type Metric = {
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "amber" | "rose" | "slate";
};

type ExpensesManagerProps = {
  metrics: Metric[];
  expenses: OwnerExpenseRecord[];
};

const emptyFormValues: ExpenseFormValues = {
  expenseDate: formatDateInputValue(),
  category: "electricity",
  amount: "",
  description: "",
  proofPath: ""
};

const toneClasses: Record<Metric["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
};

const expenseCategoryLabels: Record<OwnerExpenseRecord["category"], string> = {
  electricity: "Listrik",
  water: "Air",
  internet: "Internet",
  maintenance: "Perawatan",
  cleaning: "Kebersihan",
  repair: "Perbaikan",
  other: "Lainnya"
};

function expenseToFormValues(expense: OwnerExpenseRecord): ExpenseFormValues {
  return {
    id: expense.id,
    expenseDate: expense.expense_date,
    category: expense.category,
    amount: `${expense.amount}`,
    description: expense.description,
    proofPath: expense.proof_path ?? ""
  };
}

export function ExpensesManager({
  metrics,
  expenses
}: ExpensesManagerProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValues, setFormValues] =
    useState<ExpenseFormValues>(emptyFormValues);
  const [editingExpense, setEditingExpense] =
    useState<OwnerExpenseRecord | null>(null);
  const [proofFileName, setProofFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function openCreateForm() {
    setEditingExpense(null);
    setFormValues(emptyFormValues);
    setProofFileName("");
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(expense: OwnerExpenseRecord) {
    setEditingExpense(expense);
    setFormValues(expenseToFormValues(expense));
    setProofFileName(expense.proof_path ?? "");
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingExpense(null);
    setFormValues(emptyFormValues);
    setProofFileName("");
    setError("");
    setIsFormOpen(false);
  }

  function saveExpense() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = editingExpense
        ? await updateExpenseAction(formValues)
        : await createExpenseAction(formValues);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      closeForm();
      router.refresh();
    });
  }

  function deleteExpense(expenseId: string) {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await deleteExpenseAction(expenseId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      router.refresh();
    });
  }

  async function uploadExpenseProof(file: File | undefined) {
    if (!file) {
      return;
    }

    setError("");
    setMessage("");
    setIsUploading(true);

    try {
      const path = await uploadAppFile({
        bucket: "expense-proofs",
        file,
        folder: "owner-expenses",
        allowedTypes: proofFileTypes
      });

      setProofFileName(file.name);
      setFormValues((currentValues) => ({
        ...currentValues,
        proofPath: path
      }));
      setMessage("Bukti pengeluaran berhasil diupload.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal upload bukti pengeluaran."
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
            <p className="text-sm font-bold text-[#2a6b5c]">Pengeluaran</p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
              Catatan pengeluaran
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Catat biaya operasional kos seperti listrik, air, internet,
              kebersihan, perawatan, dan perbaikan.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17211e] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#24332f]"
            onClick={openCreateForm}
            type="button"
          >
            <Plus size={18} />
            Catat pengeluaran
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
              Biaya operasional
            </h2>
          </div>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10 sm:w-72"
              placeholder="Cari pengeluaran"
              type="search"
            />
          </label>
        </div>

        {expenses.length ? (
          <div className="mt-5 space-y-3">
            {expenses.map((expense) => (
              <article
                className="grid min-w-0 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
                key={expense.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff7ed] text-amber-700">
                    <WalletCards size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-950">
                      {expense.description}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {expenseCategoryLabels[expense.category]} -{" "}
                      {expense.expense_date}
                    </p>
                  </div>
                </div>
                <p className="self-center whitespace-nowrap font-black text-slate-950">
                  {formatMoney(expense.amount)}
                </p>
                <span className="inline-flex max-w-full justify-self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 md:self-center">
                  Tercatat
                </span>
                <div className="flex items-center gap-2 self-center">
                  <button
                    aria-label={`Edit pengeluaran ${expense.description}`}
                    className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                    onClick={() => openEditForm(expense)}
                    type="button"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={`Hapus pengeluaran ${expense.description}`}
                    className="rounded-2xl border border-rose-100 p-2 text-rose-600 transition hover:bg-rose-50"
                    onClick={() => deleteExpense(expense.id)}
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
              Belum ada pengeluaran
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Catat biaya operasional pertama supaya laporan bulanan lebih
              akurat.
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
                  {editingExpense ? "Edit pengeluaran" : "Catat pengeluaran"}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {editingExpense
                    ? editingExpense.description
                    : "Pengeluaran baru"}
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
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Tanggal
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      expenseDate: event.target.value
                    }))
                  }
                  type="date"
                  value={formValues.expenseDate}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Kategori
                </span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      category: event.target
                        .value as ExpenseFormValues["category"]
                    }))
                  }
                  value={formValues.category}
                >
                  <option value="electricity">Listrik</option>
                  <option value="water">Air</option>
                  <option value="internet">Internet</option>
                  <option value="maintenance">Perawatan</option>
                  <option value="cleaning">Kebersihan</option>
                  <option value="repair">Perbaikan</option>
                  <option value="other">Lainnya</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Deskripsi
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      description: event.target.value
                    }))
                  }
                  placeholder="Contoh: Token listrik area kos"
                  value={formValues.description}
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
                  placeholder="Contoh: 200000 atau 1.250.000"
                  value={formValues.amount}
                />
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white p-5 text-center transition hover:border-[#2a6b5c]">
                <UploadCloud className="text-[#2a6b5c]" size={28} />
                <span className="mt-3 text-sm font-black text-slate-950">
                  {proofFileName || "Upload bukti"}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  Gambar atau PDF, maksimal 5 MB
                </span>
                <input
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(event) => uploadExpenseProof(event.target.files?.[0])}
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
                onClick={saveExpense}
                type="button"
              >
                {isUploading
                  ? "Upload bukti..."
                  : isPending
                    ? "Menyimpan..."
                    : "Simpan pengeluaran"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}

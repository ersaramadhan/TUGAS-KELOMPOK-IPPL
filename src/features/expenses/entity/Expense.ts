import type { SupabaseClient } from "@supabase/supabase-js";

export const EXPENSE_CATEGORIES = [
  "electricity",
  "water",
  "internet",
  "maintenance",
  "cleaning",
  "repair",
  "other"
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Data mentah dari form (Boundary) sebelum divalidasi. */
export type ExpenseInput = {
  expenseDate: string;
  category: string;
  amount: string;
  description: string;
  proofPath: string;
};

/** Galat validasi aturan bisnis (RF-16). Pesannya aman ditampilkan ke pengguna. */
export class ExpenseValidationError extends Error {}

/** Galat saat menyimpan ke database. */
export class ExpenseStoreError extends Error {}

function parsePositiveInteger(value: string, fieldLabel: string): number {
  const digitsOnly = value.replace(/[^\d]/g, "");
  const parsed = Number(digitsOnly);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ExpenseValidationError(
      `${fieldLabel} wajib berupa angka lebih dari 0. Contoh: 200000 atau 1.250.000.`
    );
  }

  return parsed;
}

/**
 * <<entity>> Expense
 * Pengeluaran operasional kos (tabel `expenses`).
 * Memegang aturan bisnis RF-16: tanggal wajib, kategori valid,
 * nominal > 0, deskripsi wajib, bukti opsional.
 */
export class Expense {
  private constructor(
    readonly expenseDate: string,
    readonly category: ExpenseCategory,
    readonly amount: number,
    readonly description: string,
    readonly proofPath: string | null
  ) {}

  /** Membuat Expense yang sudah tervalidasi, atau melempar ExpenseValidationError. */
  static create(input: ExpenseInput): Expense {
    const amount = parsePositiveInteger(input.amount, "Nominal pengeluaran");
    const description = input.description.trim();
    const proofPath = input.proofPath.trim();

    if (!input.expenseDate) {
      throw new ExpenseValidationError("Tanggal pengeluaran wajib diisi.");
    }

    if (!EXPENSE_CATEGORIES.includes(input.category as ExpenseCategory)) {
      throw new ExpenseValidationError("Kategori pengeluaran tidak valid.");
    }

    if (!description) {
      throw new ExpenseValidationError("Deskripsi pengeluaran wajib diisi.");
    }

    return new Expense(
      input.expenseDate,
      input.category as ExpenseCategory,
      amount,
      description,
      proofPath || null
    );
  }

  private toRow() {
    return {
      expense_date: this.expenseDate,
      category: this.category,
      amount: this.amount,
      description: this.description,
      proof_path: this.proofPath
    };
  }

  /** INSERT ke `expenses` untuk properti milik owner. */
  async save(db: SupabaseClient, propertyId: string): Promise<void> {
    const { error } = await db
      .from("expenses")
      .insert({ ...this.toRow(), property_id: propertyId });

    if (error) {
      throw new ExpenseStoreError(
        `Gagal mencatat pengeluaran: ${error.message}`
      );
    }
  }

  /** UPDATE hanya bila baris milik properti owner (DPPL: property_id sesuai pemilik). */
  async update(
    db: SupabaseClient,
    propertyId: string,
    expenseId: string
  ): Promise<void> {
    const { data, error } = await db
      .from("expenses")
      .update(this.toRow())
      .eq("id", expenseId)
      .eq("property_id", propertyId)
      .select("id");

    if (error) {
      throw new ExpenseStoreError(
        `Gagal memperbarui pengeluaran: ${error.message}`
      );
    }

    if (!data?.length) {
      throw new ExpenseStoreError("Pengeluaran tidak ditemukan.");
    }
  }

  /** DELETE hanya bila baris milik properti owner. */
  static async remove(
    db: SupabaseClient,
    propertyId: string,
    expenseId: string
  ): Promise<void> {
    const { data, error } = await db
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("property_id", propertyId)
      .select("id");

    if (error) {
      throw new ExpenseStoreError(
        `Gagal menghapus pengeluaran: ${error.message}`
      );
    }

    if (!data?.length) {
      throw new ExpenseStoreError("Pengeluaran tidak ditemukan.");
    }
  }
}

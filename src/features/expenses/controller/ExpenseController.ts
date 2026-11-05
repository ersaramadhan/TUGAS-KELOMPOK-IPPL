import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import { ActivityLog } from "../entity/ActivityLog";
import { Expense, type ExpenseInput } from "../entity/Expense";
import { Property } from "../entity/Property";

export type ExpenseFormValues = ExpenseInput & { id?: string };

export type ActionResult = {
  ok: boolean;
  message: string;
};

type OwnerContext = { ownerId: string; propertyId: string };

/**
 * <<control>> ExpenseController
 * Mengatur alur use case "Catat pengeluaran" (UC-07 / RF-16):
 * cek sesi -> cari properti owner -> validasi -> simpan -> catat aktivitas.
 * Tidak berisi aturan data (itu di Expense) dan tidak menyentuh UI.
 */
export class ExpenseController {
  constructor(private readonly db: SupabaseClient) {}

  static async forCurrentRequest(): Promise<ExpenseController> {
    return new ExpenseController(await createClient());
  }

  async createExpense(values: ExpenseFormValues): Promise<ActionResult> {
    return this.run("Gagal mencatat pengeluaran.", async () => {
      const { ownerId, propertyId } = await this.resolveOwner();
      const expense = Expense.create(values);

      await expense.save(this.db, propertyId);
      await ActivityLog.record(this.db, {
        propertyId,
        actorId: ownerId,
        action: "Pengeluaran dicatat",
        metadata: {
          category: expense.category,
          amount: expense.amount,
          description: expense.description
        }
      });

      return "Pengeluaran berhasil dicatat.";
    });
  }

  async updateExpense(values: ExpenseFormValues): Promise<ActionResult> {
    if (!values.id) {
      return { ok: false, message: "ID pengeluaran tidak ditemukan." };
    }

    const expenseId = values.id;

    return this.run("Gagal memperbarui pengeluaran.", async () => {
      const { ownerId, propertyId } = await this.resolveOwner();
      const expense = Expense.create(values);

      await expense.update(this.db, propertyId, expenseId);
      await ActivityLog.record(this.db, {
        propertyId,
        actorId: ownerId,
        action: "Pengeluaran diperbarui",
        metadata: {
          expense_id: expenseId,
          category: expense.category,
          amount: expense.amount
        }
      });

      return "Pengeluaran berhasil diperbarui.";
    });
  }

  async deleteExpense(expenseId: string): Promise<ActionResult> {
    return this.run("Gagal menghapus pengeluaran.", async () => {
      const { ownerId, propertyId } = await this.resolveOwner();

      await Expense.remove(this.db, propertyId, expenseId);
      await ActivityLog.record(this.db, {
        propertyId,
        actorId: ownerId,
        action: "Pengeluaran dihapus",
        metadata: { expense_id: expenseId }
      });

      return "Pengeluaran berhasil dihapus.";
    });
  }

  /** Sesi valid + properti milik owner yang sedang login. */
  private async resolveOwner(): Promise<OwnerContext> {
    const {
      data: { user },
      error
    } = await this.db.auth.getUser();

    if (error || !user) {
      throw new Error("Session login tidak ditemukan. Login ulang dulu.");
    }

    const property = await Property.findByOwner(this.db, user.id);

    return { ownerId: user.id, propertyId: property.id };
  }

  /** Mengubah hasil/galat use case menjadi ActionResult untuk Boundary. */
  private async run(
    fallbackMessage: string,
    work: () => Promise<string>
  ): Promise<ActionResult> {
    try {
      return { ok: true, message: await work() };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : fallbackMessage
      };
    }
  }
}

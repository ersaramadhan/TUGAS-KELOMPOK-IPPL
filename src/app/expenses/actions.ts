"use server";

import { revalidatePath } from "next/cache";

import { logOwnerActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

type ExpenseCategory =
  | "electricity"
  | "water"
  | "internet"
  | "maintenance"
  | "cleaning"
  | "repair"
  | "other";

export type ExpenseFormValues = {
  id?: string;
  expenseDate: string;
  category: ExpenseCategory;
  amount: string;
  description: string;
  proofPath: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

const allowedExpenseCategories: ExpenseCategory[] = [
  "electricity",
  "water",
  "internet",
  "maintenance",
  "cleaning",
  "repair",
  "other"
];

async function getCurrentOwnerPropertyId() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Session login tidak ditemukan. Login ulang dulu.");
  }

  const { data: property, error } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!property) {
    throw new Error("Properti untuk owner ini belum dibuat.");
  }

  return property.id as string;
}

function parsePositiveInteger(value: string, fieldLabel: string) {
  const normalizedValue = value.replace(/[^\d]/g, "");
  const parsedValue = Number(normalizedValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(
      `${fieldLabel} wajib berupa angka lebih dari 0. Contoh: 200000 atau 1.250.000.`
    );
  }

  return parsedValue;
}

function normalizeExpensePayload(values: ExpenseFormValues) {
  const description = values.description.trim();
  const proofPath = values.proofPath.trim();
  const amount = parsePositiveInteger(values.amount, "Nominal pengeluaran");

  if (!values.expenseDate) {
    throw new Error("Tanggal pengeluaran wajib diisi.");
  }

  if (!allowedExpenseCategories.includes(values.category)) {
    throw new Error("Kategori pengeluaran tidak valid.");
  }

  if (!description) {
    throw new Error("Deskripsi pengeluaran wajib diisi.");
  }

  return {
    expense_date: values.expenseDate,
    category: values.category,
    amount,
    description,
    proof_path: proofPath || null
  };
}

export async function createExpenseAction(
  values: ExpenseFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const propertyId = await getCurrentOwnerPropertyId();
    const payload = normalizeExpensePayload(values);
    const { error } = await supabase.from("expenses").insert({
      ...payload,
      property_id: propertyId
    });

    if (error) {
      return {
        ok: false,
        message: `Gagal mencatat pengeluaran: ${error.message}`
      };
    }

    await logOwnerActivity("Pengeluaran dicatat", {
      category: payload.category,
      amount: payload.amount,
      description: payload.description
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { ok: true, message: "Pengeluaran berhasil dicatat." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal mencatat pengeluaran."
    };
  }
}

export async function updateExpenseAction(
  values: ExpenseFormValues
): Promise<ActionResult> {
  try {
    if (!values.id) {
      return { ok: false, message: "ID pengeluaran tidak ditemukan." };
    }

    const supabase = await createClient();
    const payload = normalizeExpensePayload(values);
    const { error } = await supabase
      .from("expenses")
      .update(payload)
      .eq("id", values.id);

    if (error) {
      return {
        ok: false,
        message: `Gagal memperbarui pengeluaran: ${error.message}`
      };
    }

    await logOwnerActivity("Pengeluaran diperbarui", {
      expense_id: values.id,
      category: payload.category,
      amount: payload.amount
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { ok: true, message: "Pengeluaran berhasil diperbarui." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui pengeluaran."
    };
  }
}

export async function deleteExpenseAction(
  expenseId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (error) {
      return {
        ok: false,
        message: `Gagal menghapus pengeluaran: ${error.message}`
      };
    }

    await logOwnerActivity("Pengeluaran dihapus", {
      expense_id: expenseId
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { ok: true, message: "Pengeluaran berhasil dihapus." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus pengeluaran."
    };
  }
}

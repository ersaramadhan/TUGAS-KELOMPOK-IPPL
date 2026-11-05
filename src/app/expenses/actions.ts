"use server";

import { revalidatePath } from "next/cache";

import {
  ExpenseController,
  type ActionResult,
  type ExpenseFormValues
} from "@/features/expenses/controller/ExpenseController";

/**
 * Adapter Server Action (transport Next.js) antara Boundary (ExpensesManager)
 * dan Controller. Tidak berisi logika bisnis; hanya meneruskan panggilan dan
 * me-refresh halaman bila use case berhasil.
 */

export type { ExpenseFormValues };

function refreshExpensePages() {
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function createExpenseAction(
  values: ExpenseFormValues
): Promise<ActionResult> {
  const controller = await ExpenseController.forCurrentRequest();
  const result = await controller.createExpense(values);

  if (result.ok) refreshExpensePages();
  return result;
}

export async function updateExpenseAction(
  values: ExpenseFormValues
): Promise<ActionResult> {
  const controller = await ExpenseController.forCurrentRequest();
  const result = await controller.updateExpense(values);

  if (result.ok) refreshExpensePages();
  return result;
}

export async function deleteExpenseAction(
  expenseId: string
): Promise<ActionResult> {
  const controller = await ExpenseController.forCurrentRequest();
  const result = await controller.deleteExpense(expenseId);

  if (result.ok) refreshExpensePages();
  return result;
}

"use server";

import { revalidatePath } from "next/cache";

import { logOwnerActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

type BillType = "monthly" | "yearly";
type BillStatus = "draft" | "unpaid" | "pending_verification" | "paid" | "overdue";

export type BillFormValues = {
  id?: string;
  tenantId: string;
  roomId: string;
  period: string;
  billType: BillType;
  amount: string;
  dueDate: string;
  status: BillStatus;
  correctionNote: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

const allowedBillTypes: BillType[] = ["monthly", "yearly"];
const allowedBillStatuses: BillStatus[] = [
  "draft",
  "unpaid",
  "pending_verification",
  "paid",
  "overdue"
];

function formatBillMutationError(actionLabel: string, message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("row-level security") ||
    normalizedMessage.includes("violates row-level security policy")
  ) {
    return `${actionLabel}: akses database menolak aksi ini. Pastikan login sebagai pemilik kos lalu coba lagi.`;
  }

  return `${actionLabel}: ${message}`;
}

function parsePositiveInteger(value: string, fieldLabel: string) {
  const normalizedValue = value.replace(/[^\d]/g, "");
  const parsedValue = Number(normalizedValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(
      `${fieldLabel} wajib berupa angka lebih dari 0. Contoh: 1250000 atau 1.250.000.`
    );
  }

  return parsedValue;
}

function normalizeBillPayload(values: BillFormValues) {
  const period = values.period.trim();
  const correctionNote = values.correctionNote.trim();
  const amount = parsePositiveInteger(values.amount, "Nominal tagihan");

  if (!values.tenantId) {
    throw new Error("Penghuni wajib dipilih.");
  }

  if (!values.roomId) {
    throw new Error("Kamar tagihan tidak ditemukan.");
  }

  if (!period) {
    throw new Error("Periode tagihan wajib diisi.");
  }

  if (!values.dueDate) {
    throw new Error("Tanggal jatuh tempo wajib diisi.");
  }

  if (!allowedBillTypes.includes(values.billType)) {
    throw new Error("Tipe tagihan tidak valid.");
  }

  if (!allowedBillStatuses.includes(values.status)) {
    throw new Error("Status tagihan tidak valid.");
  }

  return {
    tenant_id: values.tenantId,
    room_id: values.roomId,
    period,
    bill_type: values.billType,
    amount,
    due_date: values.dueDate,
    status: values.status,
    correction_note: correctionNote || null
  };
}

async function ensureOwnerSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("Session login tidak ditemukan. Login ulang sebagai owner.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,email")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (profile?.role !== "owner") {
    throw new Error(
      `Akun ${profile?.email ?? user.email ?? "ini"} bukan owner. Login sebagai pemilik kos untuk membuat tagihan.`
    );
  }
}

async function ensureTenantRoomMatch(tenantId: string, roomId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id,room_id,full_name")
    .eq("id", tenantId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Penghuni tidak ditemukan atau belum terlihat oleh akun owner ini."
    );
  }

  if (data.room_id !== roomId) {
    throw new Error(
      `Kamar tagihan tidak cocok dengan kamar penghuni ${data.full_name}. Refresh halaman lalu pilih penghuni ulang.`
    );
  }
}

export async function createBillAction(
  values: BillFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const payload = normalizeBillPayload(values);
    await ensureOwnerSession();
    await ensureTenantRoomMatch(payload.tenant_id, payload.room_id);
    const { error } = await supabase.from("bills").insert(payload);

    if (error) {
      return {
        ok: false,
        message: formatBillMutationError("Gagal membuat tagihan", error.message)
      };
    }

    await logOwnerActivity("Tagihan baru dibuat", {
      tenant_id: payload.tenant_id,
      period: payload.period,
      amount: payload.amount
    });

    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return { ok: true, message: "Tagihan berhasil dibuat." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal membuat tagihan."
    };
  }
}

export async function updateBillAction(
  values: BillFormValues
): Promise<ActionResult> {
  try {
    if (!values.id) {
      return { ok: false, message: "ID tagihan tidak ditemukan." };
    }

    const supabase = await createClient();
    const payload = normalizeBillPayload(values);
    await ensureOwnerSession();
    await ensureTenantRoomMatch(payload.tenant_id, payload.room_id);
    const { error } = await supabase
      .from("bills")
      .update(payload)
      .eq("id", values.id);

    if (error) {
      return {
        ok: false,
        message: formatBillMutationError(
          "Gagal memperbarui tagihan",
          error.message
        )
      };
    }

    await logOwnerActivity("Tagihan diperbarui", {
      bill_id: values.id,
      status: payload.status,
      amount: payload.amount
    });

    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return { ok: true, message: "Tagihan berhasil diperbarui." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal memperbarui tagihan."
    };
  }
}

export async function deleteBillAction(billId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    await ensureOwnerSession();
    const { error } = await supabase.from("bills").delete().eq("id", billId);

    if (error) {
      return {
        ok: false,
        message: formatBillMutationError("Gagal menghapus tagihan", error.message)
      };
    }

    await logOwnerActivity("Tagihan dihapus", {
      bill_id: billId
    });

    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return { ok: true, message: "Tagihan berhasil dihapus." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menghapus tagihan."
    };
  }
}

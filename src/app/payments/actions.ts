"use server";

import { revalidatePath } from "next/cache";

import { logOwnerActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

type PaymentStatus = "pending" | "approved" | "rejected";

export type PaymentFormValues = {
  id?: string;
  billId: string;
  paidAt: string;
  amount: string;
  method: string;
  proofPath: string;
  note: string;
  verificationStatus: PaymentStatus;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

const allowedPaymentStatuses: PaymentStatus[] = [
  "pending",
  "approved",
  "rejected"
];

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

function getBillStatusForPayment(status: PaymentStatus) {
  if (status === "approved") {
    return "paid";
  }

  if (status === "pending") {
    return "pending_verification";
  }

  return "unpaid";
}

function normalizePaymentPayload(values: PaymentFormValues) {
  const method = values.method.trim();
  const proofPath = values.proofPath.trim();
  const note = values.note.trim();
  const amount = parsePositiveInteger(values.amount, "Nominal pembayaran");

  if (!values.billId) {
    throw new Error("Tagihan wajib dipilih.");
  }

  if (!values.paidAt) {
    throw new Error("Tanggal pembayaran wajib diisi.");
  }

  if (!method) {
    throw new Error("Metode pembayaran wajib diisi.");
  }

  if (!allowedPaymentStatuses.includes(values.verificationStatus)) {
    throw new Error("Status verifikasi tidak valid.");
  }

  return {
    bill_id: values.billId,
    paid_at: values.paidAt,
    amount,
    method,
    proof_path: proofPath || null,
    note: note || null,
    verification_status: values.verificationStatus
  };
}

async function syncBillStatus(billId: string, paymentStatus: PaymentStatus) {
  const supabase = await createClient();
  const nextStatus = getBillStatusForPayment(paymentStatus);
  const { error: rpcError } = await supabase.rpc(
    "owner_sync_bill_status_from_payment",
    {
      target_bill_id: billId,
      target_payment_status: paymentStatus
    }
  );

  if (!rpcError) {
    return null;
  }

  const rpcMessage = rpcError.message.toLowerCase();
  const shouldUseDirectUpdateFallback =
    rpcError.code === "PGRST202" ||
    rpcMessage.includes("could not find the function") ||
    rpcMessage.includes("function public.owner_sync_bill_status_from_payment");

  if (!shouldUseDirectUpdateFallback) {
    return rpcError.message;
  }

  const { data, error } = await supabase
    .from("bills")
    .update({ status: nextStatus })
    .eq("id", billId)
    .select("id,status")
    .maybeSingle();

  if (error) {
    return error.message;
  }

  if (!data) {
    return "Status tagihan belum bisa ikut diperbarui karena akses database belum lengkap. Periksa aturan akses pembayaran lalu coba lagi.";
  }

  return null;
}

export async function createPaymentAction(
  values: PaymentFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const payload = normalizePaymentPayload(values);
    const { error } = await supabase.from("payments").insert(payload);

    if (error) {
      return {
        ok: false,
        message: `Gagal mencatat pembayaran: ${error.message}`
      };
    }

    const billError = await syncBillStatus(
      values.billId,
      values.verificationStatus
    );

    if (billError) {
      return {
        ok: false,
        message: `Pembayaran tersimpan, tapi status tagihan gagal diperbarui: ${billError}`
      };
    }

    await logOwnerActivity("Pembayaran dicatat", {
      bill_id: values.billId,
      amount: payload.amount,
      status: values.verificationStatus
    });

    revalidatePath("/payments");
    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return { ok: true, message: "Pembayaran berhasil dicatat." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal mencatat pembayaran."
    };
  }
}

export async function updatePaymentAction(
  values: PaymentFormValues
): Promise<ActionResult> {
  try {
    if (!values.id) {
      return { ok: false, message: "ID pembayaran tidak ditemukan." };
    }

    const supabase = await createClient();
    const payload = normalizePaymentPayload(values);
    const { data: existingPayment, error: existingError } = await supabase
      .from("payments")
      .select("bill_id")
      .eq("id", values.id)
      .single();

    if (existingError) {
      return {
        ok: false,
        message: `Pembayaran lama tidak ditemukan: ${existingError.message}`
      };
    }

    const { error } = await supabase
      .from("payments")
      .update(payload)
      .eq("id", values.id);

    if (error) {
      return {
        ok: false,
        message: `Gagal memperbarui pembayaran: ${error.message}`
      };
    }

    if (existingPayment.bill_id !== values.billId) {
      const previousBillError = await syncBillStatus(
        existingPayment.bill_id,
        "rejected"
      );

      if (previousBillError) {
        return {
          ok: false,
          message: `Pembayaran diperbarui, tapi status tagihan lama gagal diperbarui: ${previousBillError}`
        };
      }
    }

    const billError = await syncBillStatus(
      values.billId,
      values.verificationStatus
    );

    if (billError) {
      return {
        ok: false,
        message: `Pembayaran diperbarui, tapi status tagihan gagal diperbarui: ${billError}`
      };
    }

    await logOwnerActivity("Pembayaran diverifikasi", {
      payment_id: values.id,
      bill_id: values.billId,
      status: values.verificationStatus
    });

    revalidatePath("/payments");
    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return { ok: true, message: "Pembayaran berhasil diperbarui." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui pembayaran."
    };
  }
}

export async function deletePaymentAction(
  paymentId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: existingPayment, error: existingError } = await supabase
      .from("payments")
      .select("bill_id")
      .eq("id", paymentId)
      .single();

    if (existingError) {
      return {
        ok: false,
        message: `Pembayaran tidak ditemukan: ${existingError.message}`
      };
    }

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", paymentId);

    if (error) {
      return {
        ok: false,
        message: `Gagal menghapus pembayaran: ${error.message}`
      };
    }

    const billError = await syncBillStatus(existingPayment.bill_id, "rejected");

    if (billError) {
      return {
        ok: false,
        message: `Pembayaran terhapus, tapi status tagihan gagal diperbarui: ${billError}`
      };
    }

    await logOwnerActivity("Pembayaran dihapus", {
      payment_id: paymentId,
      bill_id: existingPayment.bill_id
    });

    revalidatePath("/payments");
    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return { ok: true, message: "Pembayaran berhasil dihapus." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus pembayaran."
    };
  }
}

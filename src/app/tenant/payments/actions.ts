"use server";

import { revalidatePath } from "next/cache";

import { logTenantActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

export type TenantPaymentFormValues = {
  billId: string;
  amount: string;
  method: string;
  proofPath: string;
  note: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getCurrentTenantId() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Session login tidak ditemukan. Login ulang dulu.");
  }

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!tenant) {
    throw new Error("Data penghuni untuk akun ini belum ditemukan.");
  }

  return tenant.id as string;
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

export async function uploadTenantPaymentProofAction(
  values: TenantPaymentFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const tenantId = await getCurrentTenantId();
    const method = values.method.trim();
    const proofPath = values.proofPath.trim();
    const note = values.note.trim();
    const amount = parsePositiveInteger(values.amount, "Nominal pembayaran");

    if (!values.billId) {
      throw new Error("Tagihan wajib dipilih.");
    }

    if (!uuidPattern.test(values.billId)) {
      throw new Error(
        "Tagihan yang dipilih belum terhubung ke data akun ini. Refresh halaman atau hubungi pemilik kos."
      );
    }

    if (!method) {
      throw new Error("Metode pembayaran wajib diisi.");
    }

    if (!proofPath) {
      throw new Error("Pilih file bukti pembayaran terlebih dahulu.");
    }

    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select("id")
      .eq("id", values.billId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (billError) {
      throw new Error(billError.message);
    }

    if (!bill) {
      throw new Error("Tagihan tidak ditemukan untuk akun penghuni ini.");
    }

    const { error } = await supabase.from("payments").insert({
      bill_id: values.billId,
      paid_at: new Date().toISOString(),
      amount,
      method,
      proof_path: proofPath,
      note: note || null,
      verification_status: "pending"
    });

    if (error) {
      return {
        ok: false,
        message: `Gagal mengirim bukti pembayaran: ${error.message}`
      };
    }

    const { error: updateError } = await supabase
      .from("bills")
      .update({ status: "pending_verification" })
      .eq("id", values.billId);

    if (updateError) {
      return {
        ok: false,
        message: `Bukti tersimpan, tapi status tagihan gagal diperbarui: ${updateError.message}`
      };
    }

    await logTenantActivity("Bukti pembayaran dikirim penghuni", {
      bill_id: values.billId,
      amount,
      method
    });

    revalidatePath("/tenant");
    revalidatePath("/tenant/bills");
    revalidatePath("/tenant/payments");
    revalidatePath("/payments");
    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return {
      ok: true,
      message: "Bukti pembayaran berhasil dikirim dan menunggu verifikasi."
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengirim bukti pembayaran."
    };
  }
}

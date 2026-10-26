"use server";

import { revalidatePath } from "next/cache";

import { logTenantActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

type ReportPriority = "low" | "medium" | "high";

export type TenantReportFormValues = {
  title: string;
  description: string;
  priority: ReportPriority;
  photoPath: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

const allowedPriorities: ReportPriority[] = ["low", "medium", "high"];

async function getCurrentTenant() {
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
    .select("id,room_id")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!tenant) {
    throw new Error("Data penghuni untuk akun ini belum ditemukan.");
  }

  return {
    tenantId: tenant.id as string,
    roomId: tenant.room_id as string
  };
}

export async function createTenantReportAction(
  values: TenantReportFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { tenantId, roomId } = await getCurrentTenant();
    const title = values.title.trim();
    const description = values.description.trim();
    const photoPath = values.photoPath.trim();

    if (!title) {
      throw new Error("Judul laporan wajib diisi.");
    }

    if (!description) {
      throw new Error("Deskripsi laporan wajib diisi.");
    }

    if (!allowedPriorities.includes(values.priority)) {
      throw new Error("Prioritas laporan tidak valid.");
    }

    const { error } = await supabase.from("maintenance_reports").insert({
      tenant_id: tenantId,
      room_id: roomId,
      title,
      description,
      photo_path: photoPath || null,
      priority: values.priority,
      status: "new",
      owner_note: null
    });

    if (error) {
      return {
        ok: false,
        message: `Gagal mengirim laporan: ${error.message}`
      };
    }

    await logTenantActivity("Laporan kerusakan dikirim penghuni", {
      title,
      priority: values.priority
    });

    revalidatePath("/tenant");
    revalidatePath("/tenant/reports");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    return { ok: true, message: "Laporan kerusakan berhasil dikirim." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal mengirim laporan."
    };
  }
}

"use server";

import { revalidatePath } from "next/cache";

import { logOwnerActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

type ReportPriority = "low" | "medium" | "high";
type ReportStatus = "new" | "in_progress" | "done" | "rejected";

export type MaintenanceReportFormValues = {
  id?: string;
  tenantId: string;
  roomId: string;
  title: string;
  description: string;
  photoPath: string;
  priority: ReportPriority;
  status: ReportStatus;
  ownerNote: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

const allowedPriorities: ReportPriority[] = ["low", "medium", "high"];
const allowedStatuses: ReportStatus[] = [
  "new",
  "in_progress",
  "done",
  "rejected"
];

function formatReportMutationError(actionLabel: string, message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("row-level security") ||
    normalizedMessage.includes("violates row-level security policy")
  ) {
    return `${actionLabel}: akses database menolak aksi ini. Periksa aturan akses laporan kerusakan lalu coba lagi.`;
  }

  return `${actionLabel}: ${message}`;
}

async function ensureTenantRoomMatch(tenantId: string, roomId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id,room_id")
    .eq("id", tenantId)
    .eq("room_id", roomId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Kamar laporan tidak sesuai dengan penghuni yang dipilih.");
  }
}

function normalizeReportPayload(values: MaintenanceReportFormValues) {
  const title = values.title.trim();
  const description = values.description.trim();
  const photoPath = values.photoPath.trim();
  const ownerNote = values.ownerNote.trim();

  if (!values.tenantId) {
    throw new Error("Penghuni wajib dipilih.");
  }

  if (!values.roomId) {
    throw new Error("Kamar laporan tidak ditemukan.");
  }

  if (!title) {
    throw new Error("Judul laporan wajib diisi.");
  }

  if (!description) {
    throw new Error("Deskripsi laporan wajib diisi.");
  }

  if (!allowedPriorities.includes(values.priority)) {
    throw new Error("Prioritas laporan tidak valid.");
  }

  if (!allowedStatuses.includes(values.status)) {
    throw new Error("Status laporan tidak valid.");
  }

  return {
    tenant_id: values.tenantId,
    room_id: values.roomId,
    title,
    description,
    photo_path: photoPath || null,
    priority: values.priority,
    status: values.status,
    owner_note: ownerNote || null
  };
}

export async function createMaintenanceReportAction(
  values: MaintenanceReportFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const payload = normalizeReportPayload(values);
    await ensureTenantRoomMatch(payload.tenant_id, payload.room_id);

    const { error } = await supabase
      .from("maintenance_reports")
      .insert(payload);

    if (error) {
      return {
        ok: false,
        message: `Gagal membuat laporan: ${error.message}`
      };
    }

    await logOwnerActivity("Laporan kerusakan dibuat", {
      tenant_id: payload.tenant_id,
      room_id: payload.room_id,
      priority: payload.priority
    });

    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/tenant");
    revalidatePath("/tenant/reports");
    return { ok: true, message: "Laporan kerusakan berhasil dibuat." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal membuat laporan."
    };
  }
}

export async function updateMaintenanceReportAction(
  values: MaintenanceReportFormValues
): Promise<ActionResult> {
  try {
    if (!values.id) {
      return { ok: false, message: "ID laporan tidak ditemukan." };
    }

    const supabase = await createClient();
    const payload = normalizeReportPayload(values);
    await ensureTenantRoomMatch(payload.tenant_id, payload.room_id);

    const { data: updatedReport, error } = await supabase
      .from("maintenance_reports")
      .update(payload)
      .eq("id", values.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        message: formatReportMutationError(
          "Gagal memperbarui laporan",
          error.message
        )
      };
    }

    if (!updatedReport) {
      return {
        ok: false,
        message:
          "Gagal memperbarui laporan: data tidak berubah. Pastikan laporan ini milik properti pemilik yang sedang login."
      };
    }

    await logOwnerActivity("Status laporan kerusakan diperbarui", {
      report_id: values.id,
      status: payload.status,
      priority: payload.priority
    });

    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/tenant");
    revalidatePath("/tenant/reports");
    revalidatePath(`/rooms/${payload.room_id}`);
    revalidatePath(`/tenants/${payload.tenant_id}`);
    return { ok: true, message: "Laporan kerusakan berhasil diperbarui." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui laporan."
    };
  }
}

export async function deleteMaintenanceReportAction(
  reportId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: deletedReport, error } = await supabase
      .from("maintenance_reports")
      .delete()
      .eq("id", reportId)
      .select("id,tenant_id,room_id")
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        message: formatReportMutationError(
          "Gagal menghapus laporan",
          error.message
        )
      };
    }

    if (!deletedReport) {
      return {
        ok: false,
        message:
          "Gagal menghapus laporan: data tidak berubah. Pastikan laporan ini milik properti pemilik yang sedang login."
      };
    }

    await logOwnerActivity("Laporan kerusakan dihapus", {
      report_id: reportId
    });

    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/tenant");
    revalidatePath("/tenant/reports");
    revalidatePath(`/rooms/${deletedReport.room_id}`);
    revalidatePath(`/tenants/${deletedReport.tenant_id}`);
    return { ok: true, message: "Laporan kerusakan berhasil dihapus." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus laporan."
    };
  }
}

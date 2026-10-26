"use server";

import { revalidatePath } from "next/cache";

import { logOwnerActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

type TenantStatus = "active" | "leaving" | "left";
type RentType = "monthly" | "yearly";

export type TenantFormValues = {
  id?: string;
  roomId: string;
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  moveInDate: string;
  rentType: RentType;
  status: TenantStatus;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

const allowedTenantStatuses: TenantStatus[] = ["active", "leaving", "left"];
const allowedRentTypes: RentType[] = ["monthly", "yearly"];

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

function formatTenantMutationError(errorMessage: string) {
  if (errorMessage.includes("tenants_one_active_per_room")) {
    return "Kamar yang dipilih sudah memiliki penghuni aktif. Pilih kamar kosong, pindahkan penghuni lama, atau ubah status penghuni lama menjadi sudah keluar terlebih dahulu.";
  }

  return errorMessage;
}

async function ensureRoomAvailableForActiveTenant({
  roomId,
  tenantId
}: {
  roomId: string;
  tenantId?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("tenants")
    .select("id,full_name")
    .eq("room_id", roomId)
    .eq("status", "active")
    .limit(1);

  if (tenantId) {
    query = query.neq("id", tenantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    throw new Error(
      `Kamar yang dipilih sudah ditempati oleh ${data.full_name}. Pilih kamar kosong atau ubah status penghuni lama terlebih dahulu.`
    );
  }
}

function normalizeTenantPayload(values: TenantFormValues) {
  const fullName = values.fullName.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const emergencyContact = values.emergencyContact.trim();

  if (!fullName) {
    throw new Error("Nama penghuni wajib diisi.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Email penghuni wajib valid.");
  }

  if (!values.roomId) {
    throw new Error("Kamar wajib dipilih.");
  }

  if (!values.moveInDate) {
    throw new Error("Tanggal masuk wajib diisi.");
  }

  if (!allowedRentTypes.includes(values.rentType)) {
    throw new Error("Tipe sewa tidak valid.");
  }

  if (!allowedTenantStatuses.includes(values.status)) {
    throw new Error("Status penghuni tidak valid.");
  }

  return {
    room_id: values.roomId,
    full_name: fullName,
    email,
    phone: phone || null,
    emergency_contact: emergencyContact || null,
    move_in_date: values.moveInDate,
    rent_type: values.rentType,
    status: values.status
  };
}

export async function createTenantAction(
  values: TenantFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const propertyId = await getCurrentOwnerPropertyId();
    const payload = normalizeTenantPayload(values);

    if (payload.status === "active") {
      await ensureRoomAvailableForActiveTenant({
        roomId: payload.room_id
      });
    }

    const { error } = await supabase.from("tenants").insert({
      ...payload,
      property_id: propertyId
    });

    if (error) {
      return {
        ok: false,
        message: `Gagal menambah penghuni: ${formatTenantMutationError(
          error.message
        )}`
      };
    }

    await logOwnerActivity("Penghuni baru ditambahkan", {
      name: payload.full_name,
      room_id: payload.room_id,
      status: payload.status
    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    return { ok: true, message: "Penghuni berhasil ditambahkan." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menambah penghuni."
    };
  }
}

export async function updateTenantAction(
  values: TenantFormValues
): Promise<ActionResult> {
  try {
    if (!values.id) {
      return { ok: false, message: "ID penghuni tidak ditemukan." };
    }

    const supabase = await createClient();
    const payload = normalizeTenantPayload(values);

    if (payload.status === "active") {
      await ensureRoomAvailableForActiveTenant({
        roomId: payload.room_id,
        tenantId: values.id
      });
    }

    const { error } = await supabase
      .from("tenants")
      .update(payload)
      .eq("id", values.id);

    if (error) {
      return {
        ok: false,
        message: `Gagal memperbarui penghuni: ${formatTenantMutationError(
          error.message
        )}`
      };
    }

    await logOwnerActivity("Data penghuni diperbarui", {
      tenant_id: values.id,
      name: payload.full_name,
      status: payload.status
    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    return { ok: true, message: "Penghuni berhasil diperbarui." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal memperbarui penghuni."
    };
  }
}

export async function deleteTenantAction(
  tenantId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tenants").delete().eq("id", tenantId);

    if (error) {
      return {
        ok: false,
        message: `Gagal menghapus penghuni: ${error.message}`
      };
    }

    await logOwnerActivity("Penghuni dihapus", {
      tenant_id: tenantId
    });

    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    return { ok: true, message: "Penghuni berhasil dihapus." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus penghuni."
    };
  }
}

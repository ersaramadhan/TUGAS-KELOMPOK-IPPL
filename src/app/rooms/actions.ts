"use server";

import { revalidatePath } from "next/cache";

import { logOwnerActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

type RoomStatus = "vacant" | "occupied" | "maintenance" | "inactive";

export type RoomFormValues = {
  id?: string;
  name: string;
  floor: string;
  monthlyPrice: string;
  yearlyPrice: string;
  status: RoomStatus;
  internalNote: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

const allowedStatuses: RoomStatus[] = [
  "vacant",
  "occupied",
  "maintenance",
  "inactive"
];

function parsePositiveInteger(value: string, fieldLabel: string) {
  const normalizedValue = value.replace(/[^\d]/g, "");
  const parsedValue = Number(normalizedValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(
      `${fieldLabel} wajib berupa angka lebih dari 0. Contoh: 1200000 atau 1.200.000.`
    );
  }

  return parsedValue;
}

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

function normalizeRoomPayload(values: RoomFormValues) {
  const name = values.name.trim();
  const floor = values.floor.trim();
  const internalNote = values.internalNote.trim();
  const monthlyPrice = parsePositiveInteger(
    values.monthlyPrice,
    "Harga bulanan"
  );
  const yearlyPrice = values.yearlyPrice.trim()
    ? parsePositiveInteger(values.yearlyPrice, "Harga tahunan")
    : null;

  if (!name) {
    throw new Error("Nomor atau nama kamar wajib diisi.");
  }

  if (!allowedStatuses.includes(values.status)) {
    throw new Error("Status kamar tidak valid.");
  }

  return {
    name,
    floor: floor || null,
    monthly_price: monthlyPrice,
    yearly_price: yearlyPrice,
    status: values.status,
    internal_note: internalNote || null
  };
}

export async function createRoomAction(
  values: RoomFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const propertyId = await getCurrentOwnerPropertyId();
    const payload = normalizeRoomPayload(values);
    const { error } = await supabase.from("rooms").insert({
      ...payload,
      property_id: propertyId
    });

    if (error) {
      return {
        ok: false,
        message: `Gagal menambah kamar: ${error.message}`
      };
    }

    await logOwnerActivity("Kamar baru ditambahkan", {
      room: payload.name,
      status: payload.status
    });

    revalidatePath("/rooms");
    revalidatePath("/dashboard");
    return { ok: true, message: "Kamar berhasil ditambahkan." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menambah kamar."
    };
  }
}

export async function updateRoomAction(
  values: RoomFormValues
): Promise<ActionResult> {
  try {
    if (!values.id) {
      return { ok: false, message: "ID kamar tidak ditemukan." };
    }

    const supabase = await createClient();
    const payload = normalizeRoomPayload(values);
    const { error } = await supabase
      .from("rooms")
      .update(payload)
      .eq("id", values.id);

    if (error) {
      return {
        ok: false,
        message: `Gagal memperbarui kamar: ${error.message}`
      };
    }

    await logOwnerActivity("Data kamar diperbarui", {
      room: payload.name,
      status: payload.status
    });

    revalidatePath("/rooms");
    revalidatePath("/dashboard");
    return { ok: true, message: "Kamar berhasil diperbarui." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal memperbarui kamar."
    };
  }
}

export async function deleteRoomAction(roomId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);

    if (error) {
      return {
        ok: false,
        message: `Gagal menghapus kamar: ${error.message}`
      };
    }

    await logOwnerActivity("Kamar dihapus", {
      room_id: roomId
    });

    revalidatePath("/rooms");
    revalidatePath("/dashboard");
    return { ok: true, message: "Kamar berhasil dihapus." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menghapus kamar."
    };
  }
}

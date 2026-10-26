"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type RentType = "monthly" | "yearly";

type ActionResult = {
  ok: boolean;
  message: string;
};

const allowedRentTypes: RentType[] = ["monthly", "yearly"];

function formatClaimRoomError(errorMessage: string) {
  if (errorMessage.includes("Kamar sudah ditempati")) {
    return "Kamar ini baru saja dipilih penghuni lain. Pilih kamar kosong lainnya.";
  }

  if (errorMessage.includes("Akun ini sudah terhubung")) {
    return "Akun ini sudah terhubung ke kamar. Refresh halaman untuk melihat portal penghuni.";
  }

  if (errorMessage.includes("Kamar tidak tersedia")) {
    return "Kamar ini belum tersedia untuk dipilih.";
  }

  return errorMessage;
}

export async function claimTenantRoomAction({
  rentType,
  roomId
}: {
  rentType: RentType;
  roomId: string;
}): Promise<ActionResult> {
  try {
    if (!roomId) {
      return { ok: false, message: "Pilih kamar terlebih dahulu." };
    }

    if (!allowedRentTypes.includes(rentType)) {
      return { ok: false, message: "Tipe sewa tidak valid." };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("claim_tenant_room", {
      target_rent_type: rentType,
      target_room_id: roomId
    });

    if (error) {
      return {
        ok: false,
        message: `Gagal memilih kamar: ${formatClaimRoomError(error.message)}`
      };
    }

    revalidatePath("/tenant");
    revalidatePath("/tenant/bills");
    revalidatePath("/tenant/payments");
    revalidatePath("/tenant/profile");
    revalidatePath("/tenant/reports");
    revalidatePath("/tenants");
    revalidatePath("/rooms");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Kamar berhasil dipilih. Portal penghuni sudah aktif."
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal memilih kamar."
    };
  }
}

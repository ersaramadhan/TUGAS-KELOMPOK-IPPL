"use server";

import { revalidatePath } from "next/cache";

import { logOwnerActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

export type SettingsFormValues = {
  fullName: string;
  phone: string;
  propertyName: string;
  address: string;
  paymentAccount: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
  data?: SettingsFormValues;
};

function normalizeSettingsPayload(values: SettingsFormValues) {
  const fullName = values.fullName.trim();
  const phone = values.phone.trim();
  const propertyName = values.propertyName.trim();
  const address = values.address.trim();
  const paymentAccount = values.paymentAccount.trim();

  if (!fullName) {
    throw new Error("Nama owner wajib diisi.");
  }

  if (!propertyName) {
    throw new Error("Nama kos wajib diisi.");
  }

  return {
    profile: {
      full_name: fullName,
      phone: phone || null
    },
    property: {
      name: propertyName,
      address: address || null,
      payment_account: paymentAccount || null
    }
  };
}

export async function updateOwnerSettingsAction(
  values: SettingsFormValues
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Session login tidak ditemukan. Login ulang dulu.");
    }

    if (!user.email) {
      throw new Error("Email user Auth belum tersedia.");
    }

    const payload = normalizeSettingsPayload(values);
    const { data: savedProfile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          role: "owner",
          ...payload.profile
        },
        { onConflict: "id" }
      )
      .select("full_name,phone")
      .maybeSingle();

    if (profileError || !savedProfile) {
      return {
        ok: false,
        message: `Gagal menyimpan profil owner: ${
          profileError?.message ??
          "data tidak berubah. Pastikan akun ini punya akses update profil."
        }`
      };
    }

    const { data: existingProperty, error: propertyLookupError } =
      await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (propertyLookupError) {
      return {
        ok: false,
        message: `Gagal membaca properti kos: ${propertyLookupError.message}`
      };
    }

    const propertyMutation = existingProperty
      ? supabase
          .from("properties")
          .update(payload.property)
          .eq("id", existingProperty.id)
          .eq("owner_id", user.id)
      : supabase.from("properties").insert({
          owner_id: user.id,
          ...payload.property
        });

    const { data: savedProperty, error: propertyError } = await propertyMutation
      .select("name,address,payment_account")
      .maybeSingle();

    if (propertyError || !savedProperty) {
      return {
        ok: false,
        message: `Gagal menyimpan properti kos: ${
          propertyError?.message ??
          "data tidak berubah. Pastikan akun ini punya akses update properti."
        }`
      };
    }

    await logOwnerActivity("Pengaturan kos diperbarui", {
      property: payload.property.name
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/rooms");
    revalidatePath("/tenants");
    revalidatePath("/bills");
    revalidatePath("/payments");
    revalidatePath("/expenses");
    revalidatePath("/reports");

    return {
      ok: true,
      message: "Pengaturan kos berhasil disimpan.",
      data: {
        fullName: savedProfile.full_name,
        phone: savedProfile.phone ?? "",
        propertyName: savedProperty.name,
        address: savedProperty.address ?? "",
        paymentAccount: savedProperty.payment_account ?? ""
      }
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menyimpan pengaturan."
    };
  }
}

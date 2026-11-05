import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * <<entity>> Property
 * Properti kos milik pemilik (tabel `properties`).
 * Dipakai untuk memastikan semua data pengeluaran terikat ke properti
 * milik owner yang sedang login (DPPL: "property_id benar-benar dimiliki owner").
 */
export class Property {
  private constructor(readonly id: string) {}

  static async findByOwner(
    db: SupabaseClient,
    ownerId: string
  ): Promise<Property> {
    const { data, error } = await db
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Properti untuk owner ini belum dibuat.");
    }

    return new Property(data.id as string);
  }
}

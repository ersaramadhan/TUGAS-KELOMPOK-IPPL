import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type SettingsMetric = {
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "amber" | "rose" | "slate";
};

type SettingsRow = {
  title: string;
  meta: string;
  status: string;
};

export type OwnerSettingsProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "owner" | "tenant" | string;
};

export type OwnerSettingsProperty = {
  id: string;
  name: string;
  address: string | null;
  payment_account: string | null;
  created_at: string;
};

export type OwnerSettingsData = {
  source: "supabase";
  sourceReason?: string;
  profile: OwnerSettingsProfile;
  property: OwnerSettingsProperty | null;
  metrics: SettingsMetric[];
  rows: SettingsRow[];
};

function getCompletionStatus(value: string | null | undefined) {
  return value?.trim() ? "Lengkap" : "Belum diisi";
}

function getCompletionTone(value: string | null | undefined) {
  return value?.trim() ? "emerald" : "amber";
}

function createRows(
  profile: OwnerSettingsProfile,
  property: OwnerSettingsProperty | null
): SettingsRow[] {
  return [
    {
      title: "Profil owner",
      meta: `${profile.full_name || "Nama belum diisi"} - ${
        profile.email || "Email belum tersedia"
      }`,
      status: getCompletionStatus(profile.full_name)
    },
    {
      title: "Kontak owner",
      meta: profile.phone || "Nomor WhatsApp belum diisi",
      status: getCompletionStatus(profile.phone)
    },
    {
      title: "Properti kos",
      meta: property?.address || "Alamat kos belum diisi",
      status: property?.name ? "Aktif" : "Belum dibuat"
    },
    {
      title: "Rekening pembayaran",
      meta: property?.payment_account || "Rekening belum diisi",
      status: getCompletionStatus(property?.payment_account)
    }
  ];
}

function createMetrics(
  profile: OwnerSettingsProfile,
  property: OwnerSettingsProperty | null
): SettingsMetric[] {
  return [
    {
      label: "Profil owner",
      value: getCompletionStatus(profile.full_name),
      note: profile.email || "Email belum tersedia",
      tone: getCompletionTone(profile.full_name)
    },
    {
      label: "Properti",
      value: property?.name ? "Aktif" : "Belum ada",
      note: property?.name || "Buat data kos pertama",
      tone: property?.name ? "emerald" : "amber"
    },
    {
      label: "Alamat",
      value: getCompletionStatus(property?.address),
      note: property?.address ? "Dipakai di laporan" : "Lengkapi alamat kos",
      tone: getCompletionTone(property?.address)
    },
    {
      label: "Koneksi",
      value: "Aktif",
      note: "Data operasional tersambung",
      tone: "emerald"
    }
  ];
}

function emptySupabaseSettings({
  email,
  id,
  sourceReason
}: {
  email?: string | null;
  id?: string;
  sourceReason?: string;
}): OwnerSettingsData {
  const fallbackEmail = email ?? "";
  const profile: OwnerSettingsProfile = {
    id: id ?? "",
    full_name: fallbackEmail ? fallbackEmail.split("@")[0] : "",
    email: fallbackEmail,
    phone: null,
    role: "owner"
  };
  const property = null;

  return {
    source: "supabase",
    sourceReason,
    profile,
    property,
    metrics: createMetrics(profile, property),
    rows: createRows(profile, property)
  };
}

export async function getOwnerSettingsData(): Promise<OwnerSettingsData> {
  if (!hasSupabaseConfig()) {
    return emptySupabaseSettings({
      sourceReason: "env Supabase belum terbaca"
    });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return emptySupabaseSettings({
        sourceReason: userError?.message ?? "session login tidak ditemukan"
      });
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id,full_name,email,phone,role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return emptySupabaseSettings({
        email: user.email,
        id: user.id,
        sourceReason: `${profileError.message}; session=${
          user.email ?? "tidak ada"
        }`
      });
    }

    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("id,name,address,payment_account,created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (propertyError) {
      return emptySupabaseSettings({
        email: user.email,
        id: user.id,
        sourceReason: `${propertyError.message}; session=${
          user.email ?? "tidak ada"
        }`
      });
    }

    const profile: OwnerSettingsProfile = profileData
      ? (profileData as OwnerSettingsProfile)
      : {
          id: user.id,
          full_name: user.email?.split("@")[0] ?? "Pemilik Kos",
          email: user.email ?? "",
          phone: null,
          role: "owner"
        };
    const property = propertyData as OwnerSettingsProperty | null;

    return {
      source: "supabase",
      profile,
      property,
      metrics: createMetrics(profile, property),
      rows: createRows(profile, property)
    };
  } catch {
    return emptySupabaseSettings({
      sourceReason: "fetch Supabase gagal"
    });
  }
}

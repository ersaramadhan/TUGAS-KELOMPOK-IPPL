import { createClient } from "@/lib/supabase/server";

type ActivityMetadata = Record<string, string | number | boolean | null>;

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function logOwnerActivity(
  action: string,
  metadata: ActivityMetadata = {}
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    const { data: property } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!property) {
      return;
    }

    await supabase.from("activity_logs").insert({
      property_id: property.id,
      actor_id: user.id,
      action,
      metadata
    });
  } catch {
    // Activity logs should never block the main operation.
  }
}

export async function logTenantActivity(
  action: string,
  metadata: ActivityMetadata = {}
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("property_id")
      .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
      .limit(1)
      .maybeSingle();

    if (!tenant) {
      return;
    }

    await supabase.from("activity_logs").insert({
      property_id: tenant.property_id,
      actor_id: user.id,
      action,
      metadata
    });
  } catch {
    // Activity logs should never block the main operation.
  }
}

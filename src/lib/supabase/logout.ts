"use client";

import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export async function signOutSafely() {
  if (hasSupabaseConfig()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  sessionStorage.removeItem("kospilot-tenant-session-sync");
}

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnvFile() {
  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    env[key] = value;
  }

  return env;
}

const env = readEnvFile();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log(
  "url_valid",
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(supabaseUrl)
);

const login = await supabase.auth.signInWithPassword({
  email: process.env.KOSPILOT_TEST_EMAIL ?? "pemilik@kospilot.test",
  password: process.env.KOSPILOT_TEST_PASSWORD ?? "password-demo"
});

console.log("login_error", login.error?.message ?? null);
console.log("user_id", login.data.user?.id ?? null);

const profile = await supabase.from("profiles").select("id,email,role").maybeSingle();
console.log("profile_error", profile.error?.message ?? null);
console.log("profile", profile.data);

const properties = await supabase
  .from("properties")
  .select("id,owner_id,name")
  .order("created_at");
console.log("properties_error", properties.error?.message ?? null);
console.log("properties_count", properties.data?.length ?? null);
console.log("properties", properties.data);

const rooms = await supabase
  .from("rooms")
  .select("id,property_id,name,status")
  .order("name");
console.log("rooms_error", rooms.error?.message ?? null);
console.log("rooms_count", rooms.data?.length ?? null);
console.log("rooms", rooms.data);

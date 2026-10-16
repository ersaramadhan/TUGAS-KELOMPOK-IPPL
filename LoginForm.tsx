"use client";

import { ArrowRight, DoorOpen, Loader2, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

type LoginRole = "owner" | "tenant";

const loginRoles = [
  {
    id: "owner",
    title: "Pemilik kos",
    description: "Kelola kamar, tagihan, pembayaran, dan laporan operasional.",
    icon: ShieldCheck,
    cta: "Masuk sebagai pemilik"
  },
  {
    id: "tenant",
    title: "Penghuni",
    description: "Lihat tagihan, unggah bukti bayar, dan laporkan kerusakan.",
    icon: DoorOpen,
    cta: "Masuk sebagai penghuni"
  }
] satisfies Array<{
  id: LoginRole;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  cta: string;
}>;

function fallbackRoute(role: LoginRole) {
  return role === "owner" ? "/dashboard" : "/tenant";
}

function isAllowedNextPath(nextPath: string | null, role: LoginRole) {
  if (!nextPath?.startsWith("/")) {
    return false;
  }

  if (role === "tenant") {
    return nextPath === "/tenant" || nextPath.startsWith("/tenant/");
  }

  return !nextPath.startsWith("/tenant");
}

async function waitForBrowserSession(supabase: ReturnType<typeof createClient>) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session) {
      return true;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 120);
    });
  }

  return false;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<LoginRole>("owner");
  const [email, setEmail] = useState("pemilik@kospilot.test");
  const [password, setPassword] = useState("password-demo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }

    if (!hasSupabaseConfig()) {
      setError(
        "Konfigurasi aplikasi belum siap. Hubungi admin sistem sebelum login."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      const hasSession = await waitForBrowserSession(supabase);
      if (!hasSession) {
        setError("Session login belum tersimpan. Coba login ulang.");
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      const { data: profile } = user
        ? await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()
        : { data: null };
      const { data: tenant } =
        user && profile?.role !== "owner"
          ? await supabase
              .from("tenants")
              .select("id")
              .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
              .limit(1)
              .maybeSingle()
          : { data: null };

      const role =
        profile?.role === "tenant" || profile?.role === "owner"
          ? profile.role
          : tenant
            ? "tenant"
          : selectedRole;
      const nextPath = searchParams.get("next");
      const targetPath =
        nextPath && isAllowedNextPath(nextPath, role)
          ? nextPath
          : fallbackRoute(role);

      setMessage("Login berhasil. Mengalihkan halaman...");
      sessionStorage.removeItem("kospilot-tenant-session-sync");
      window.location.assign(targetPath);
    } catch {
      setError("Login belum bisa diproses. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="mt-7 grid gap-3">
        {loginRoles.map(({ id, title, description, icon: Icon, cta }) => {
          const active = selectedRole === id;

          return (
            <button
              className={`flex items-start gap-3 rounded-3xl border p-4 text-left transition ${
                active
                  ? "border-[#2a6b5c] bg-[#eef6f2] shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
              key={id}
              onClick={() => {
                setSelectedRole(id);
                setEmail(
                  id === "owner"
                    ? "pemilik@kospilot.test"
                    : "dinda@kospilot.test"
                );
              }}
              type="button"
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                  active
                    ? "bg-[#2a6b5c] text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon size={20} />
              </span>
              <span>
                <span className="block font-black text-slate-950">{title}</span>
                <span className="mt-1 block text-sm leading-5">
                  {description}
                </span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#2a6b5c]">
                  {cta}
                  <ArrowRight size={15} />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <form
        className="mt-7 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleLogin();
        }}
      >
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Email</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Password</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>

        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {message}
          </p>
        ) : null}

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17211e] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#24332f] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <ArrowRight size={18} />
          )}
          Masuk
        </button>
      </form>
    </>
  );
}

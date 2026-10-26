"use client";

import { ArrowLeft, ArrowRight, DoorOpen, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

type RegisterRole = "owner" | "tenant";

const registerRoles = [
  {
    id: "owner",
    title: "Pemilik kos",
    description: "Buat akun pemilik dan data properti kos pertama.",
    icon: ShieldCheck
  },
  {
    id: "tenant",
    title: "Penghuni",
    description: "Buat akun penghuni untuk portal tagihan dan laporan.",
    icon: DoorOpen
  }
] satisfies Array<{
  id: RegisterRole;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
}>;

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

export function RegisterForm() {
  const [role, setRole] = useState<RegisterRole>("owner");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister() {
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedPropertyName = propertyName.trim();

    setError("");
    setMessage("");

    if (!normalizedFullName || !normalizedEmail || !password) {
      setError("Nama lengkap, email, dan password wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password belum sama.");
      return;
    }

    if (role === "owner" && !normalizedPropertyName) {
      setError("Nama kos wajib diisi untuk akun pemilik.");
      return;
    }

    if (!hasSupabaseConfig()) {
      setError(
        "Konfigurasi aplikasi belum siap. Hubungi admin sistem sebelum daftar."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: normalizedFullName,
              phone: normalizedPhone,
              property_name: normalizedPropertyName,
              role
            }
          }
        });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!signUpData.user) {
        setError("Akun belum berhasil dibuat. Coba ulangi pendaftaran.");
        return;
      }

      if (!signUpData.session) {
        setMessage(
          "Akun berhasil dibuat. Cek email untuk verifikasi, lalu login."
        );
        return;
      }

      const hasSession = await waitForBrowserSession(supabase);
      if (!hasSession) {
        setMessage("Akun berhasil dibuat. Login ulang untuk masuk aplikasi.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: signUpData.user.id,
        full_name: normalizedFullName,
        email: normalizedEmail,
        phone: normalizedPhone || null,
        role
      });

      if (profileError) {
        setError(`Akun Auth dibuat, tapi profil gagal disimpan: ${profileError.message}`);
        return;
      }

      if (role === "owner") {
        const { data: existingProperty, error: propertyLookupError } =
          await supabase
            .from("properties")
            .select("id")
            .eq("owner_id", signUpData.user.id)
            .limit(1)
            .maybeSingle();

        if (propertyLookupError) {
          setError(
            `Profil tersimpan, tapi data kos belum bisa dicek: ${propertyLookupError.message}`
          );
          return;
        }

        const { error: propertyError } = existingProperty
          ? { error: null }
          : await supabase.from("properties").insert({
              owner_id: signUpData.user.id,
              name: normalizedPropertyName
            });

        if (propertyError) {
          setError(
            `Profil tersimpan, tapi data kos gagal dibuat: ${propertyError.message}`
          );
          return;
        }
      }

      setMessage("Pendaftaran berhasil. Mengalihkan halaman...");
      sessionStorage.removeItem("kospilot-tenant-session-sync");
      window.location.assign(role === "owner" ? "/dashboard" : "/tenant");
    } catch {
      setError("Pendaftaran belum bisa diproses. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-[#2a6b5c]"
        href="/login"
      >
        <ArrowLeft size={16} />
        Kembali ke login
      </Link>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {registerRoles.map(({ id, title, description, icon: Icon }) => {
          const active = role === id;

          return (
            <button
              className={`flex min-w-0 items-start gap-3 rounded-3xl border p-4 text-left transition ${
                active
                  ? "border-[#2a6b5c] bg-[#eef6f2] shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
              key={id}
              onClick={() => setRole(id)}
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
              <span className="min-w-0">
                <span className="block break-words font-black text-slate-950">
                  {title}
                </span>
                <span className="mt-1 block break-words text-sm leading-5">
                  {description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleRegister();
        }}
      >
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Nama lengkap</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Contoh: Adam Pratama"
            value={fullName}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              type="email"
              value={email}
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Nomor WhatsApp
            </span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="081234567890"
              value={phone}
            />
          </label>
        </div>

        {role === "owner" ? (
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Nama kos</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
              onChange={(event) => setPropertyName(event.target.value)}
              placeholder="Contoh: KosPilot Melati"
              value={propertyName}
            />
          </label>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Konfirmasi password
            </span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
          </label>
        </div>

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
          Daftar
        </button>
      </form>
    </>
  );
}

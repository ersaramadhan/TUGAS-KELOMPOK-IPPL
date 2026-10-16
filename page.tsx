import { Building2 } from "lucide-react";

import { RegisterForm } from "@/app/register/RegisterForm";
import { formatAppDate } from "@/lib/date";

export default function RegisterPage() {
  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-xl backdrop-blur lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[#17211e] p-6 text-white sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#d9f99d] text-[#17211e]">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-lg font-black">KosPilot</p>
              <p className="text-xs text-white/55">Property command center</p>
            </div>
          </div>

          <div className="mt-12 max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#d9f99d]">
              Buat akun
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Mulai kelola kos dari satu pusat kendali.
            </h1>
            <p className="mt-5 text-sm leading-6 text-white/65 sm:text-base">
              Pendaftaran membuat akun, menyimpan peran pengguna, dan
              menyiapkan data awal agar operasional kos bisa langsung dimulai.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-xl">
            <div>
              <p className="text-sm font-bold text-[#2a6b5c]">
                {formatAppDate()}
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Daftar KosPilot
              </h2>
            </div>

            <RegisterForm />
          </div>
        </div>
      </section>
    </main>
  );
}

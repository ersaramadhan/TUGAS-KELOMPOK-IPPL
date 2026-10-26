"use client";

import { Building2, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { signOutSafely } from "@/lib/supabase/logout";
import { tenantNavItems } from "@/lib/tenant";
import { TenantSessionSync } from "@/components/tenant/TenantSessionSync";
import type { TenantPortalProfile } from "@/lib/tenant-data";

type TenantShellProps = {
  children: ReactNode;
  profile: TenantPortalProfile;
  sourceReason?: string;
};

export function TenantShell({
  children,
  profile,
  sourceReason
}: TenantShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOutSafely();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-4 py-5 pb-24 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#d9f99d] text-[#17211e]">
              <Building2 size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-950">KosPilot</p>
              <p className="text-sm font-semibold text-[#2a6b5c]">
                Portal penghuni -{" "}
                {profile.room === "-" ? "Pilih kamar" : `Kamar ${profile.room}`}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-950">
                {profile.name}
              </p>
              <p className="text-xs text-slate-500">{profile.email}</p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="hidden rounded-[28px] border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur lg:block">
            <nav className="space-y-2">
              {tenantNavItems.map(({ label, href, icon: Icon }) => {
                const isActive =
                  pathname === href || (href !== "/tenant" && pathname.startsWith(href));

                return (
                  <Link
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      isActive
                        ? "bg-[#17211e] text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    href={href}
                    key={label}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">
            <TenantSessionSync
              shouldSync={profile.room === "-"}
              sourceReason={sourceReason}
            />
            {children}
          </section>
        </div>
      </div>

      <nav className="fixed inset-x-2 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-[24px] border border-white/70 bg-white/90 p-2 shadow-xl backdrop-blur lg:hidden">
        {tenantNavItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/tenant" && pathname.startsWith(href));

          return (
            <Link
              className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-bold transition sm:text-[11px] ${
                isActive
                  ? "bg-[#17211e] text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
              href={href}
              key={label}
            >
              <Icon size={17} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}

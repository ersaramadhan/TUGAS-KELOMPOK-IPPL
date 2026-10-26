"use client";

import { Bell, LogOut, Menu, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { formatAppDate } from "@/lib/date";
import { signOutSafely } from "@/lib/supabase/logout";
import type { DashboardShellBrand } from "@/components/dashboard/DashboardShell";

type DashboardHeaderProps = {
  brand: Required<DashboardShellBrand>;
  onOpenSidebar: () => void;
};

export function DashboardHeader({
  brand,
  onOpenSidebar
}: DashboardHeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  async function handleLogout() {
    await signOutSafely();
    router.replace("/login");
    router.refresh();
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return;
    }

    if (normalizedQuery.includes("tagihan")) {
      router.push("/bills");
      return;
    }

    if (
      normalizedQuery.includes("bayar") ||
      normalizedQuery.includes("pembayaran")
    ) {
      router.push("/payments");
      return;
    }

    if (
      normalizedQuery.includes("rusak") ||
      normalizedQuery.includes("laporan") ||
      normalizedQuery.includes("perbaikan")
    ) {
      router.push("/reports");
      return;
    }

    if (
      normalizedQuery.includes("penghuni") ||
      normalizedQuery.includes("tenant")
    ) {
      router.push("/tenants");
      return;
    }

    router.push("/rooms");
  }

  return (
    <header className="mb-4 flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Buka menu"
          className="rounded-2xl border border-slate-200 bg-white p-3 lg:hidden"
          onClick={onOpenSidebar}
          type="button"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#2a6b5c]">
            {formatAppDate()} - {brand.ownerName}
          </p>
          <h1 className="break-words text-2xl font-black leading-tight tracking-tight text-slate-950 md:text-3xl">
            {brand.propertyName}
          </h1>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <form className="relative block min-w-0 sm:flex-1 md:flex-none" onSubmit={handleSearchSubmit}>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10 sm:min-w-0 md:w-64"
            placeholder="Cari kamar atau penghuni"
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            value={query}
          />
        </form>
        <Link
          aria-label="Lihat notifikasi"
          className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:border-[#2a6b5c]/40"
          href="/payments"
        >
          <Bell size={20} />
        </Link>
        <Link
          className="rounded-2xl bg-[#17211e] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#24332f]"
          href="/bills"
        >
          <span className="whitespace-nowrap">+ Tambah tagihan</span>
        </Link>
        <button
          aria-label="Keluar"
          className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
          onClick={handleLogout}
          type="button"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

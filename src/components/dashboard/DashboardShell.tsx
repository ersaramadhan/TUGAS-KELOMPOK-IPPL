"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export type DashboardShellBrand = {
  propertyName?: string | null;
  ownerName?: string | null;
};

type DashboardShellProps = {
  children: ReactNode;
  brand?: DashboardShellBrand;
  preferBrand?: boolean;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  onOpenSidebar: () => void;
};

function normalizeBrand(brand?: DashboardShellBrand): Required<DashboardShellBrand> {
  return {
    propertyName: brand?.propertyName?.trim() || "KosPilot",
    ownerName: brand?.ownerName?.trim() || "Pemilik kos"
  };
}

export function DashboardShell({
  brand,
  children,
  isSidebarOpen,
  onCloseSidebar,
  onOpenSidebar,
  preferBrand = false
}: DashboardShellProps) {
  const [fetchedBrand, setFetchedBrand] =
    useState<Required<DashboardShellBrand> | null>(null);
  const shellBrand = preferBrand
    ? normalizeBrand(brand)
    : fetchedBrand ?? normalizeBrand(brand);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      return;
    }

    let mounted = true;

    async function loadShellBrand() {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user || !mounted) {
        return;
      }

      const [{ data: profile }, { data: property }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("properties")
          .select("name")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      if (!mounted) {
        return;
      }

      setFetchedBrand(
        normalizeBrand({
          ownerName: profile?.full_name,
          propertyName: property?.name
        })
      );
    }

    void loadShellBrand();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen p-3 pb-20 text-slate-900 sm:p-5 lg:pb-5">
      <div className="mx-auto flex max-w-[1500px] gap-4">
        <Sidebar
          brand={shellBrand}
          isOpen={isSidebarOpen}
          onClose={onCloseSidebar}
        />

        {isSidebarOpen ? (
          <button
            aria-label="Tutup overlay menu"
            className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
            onClick={onCloseSidebar}
            type="button"
          />
        ) : null}

        <section className="min-w-0 flex-1">
          <DashboardHeader brand={shellBrand} onOpenSidebar={onOpenSidebar} />
          {children}
        </section>
      </div>
      <MobileBottomNav />
    </main>
  );
}

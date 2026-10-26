"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type TenantSessionSyncProps = {
  shouldSync: boolean;
  sourceReason?: string;
};

const syncFlagKey = "kospilot-tenant-session-sync";

function isMissingServerSession(sourceReason?: string) {
  return sourceReason?.includes("session tenant tidak ada") ?? false;
}

function getTenantPortalMessage(sourceReason?: string) {
  if (!sourceReason) {
    return "";
  }

  if (sourceReason.includes("tenant belum memilih kamar untuk session")) {
    return "";
  }

  if (sourceReason.includes("tenant tidak ditemukan")) {
    return "Akun ini belum terhubung ke data penghuni. Pastikan email akun sama dengan data penghuni yang dibuat pemilik kos, atau minta pemilik menghubungkan akun ini.";
  }

  if (sourceReason.includes("permission denied")) {
    return "Portal penghuni belum punya izin membaca data. Pastikan policy tenant portal sudah dijalankan di Supabase.";
  }

  if (sourceReason.includes("env Supabase")) {
    return "Konfigurasi Supabase belum terbaca di aplikasi.";
  }

  return "Data portal penghuni belum bisa dibaca. Coba refresh halaman atau login ulang.";
}

export function TenantSessionSync({
  shouldSync,
  sourceReason
}: TenantSessionSyncProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (
      !shouldSync ||
      !hasSupabaseConfig() ||
      !isMissingServerSession(sourceReason)
    ) {
      return;
    }

    let isMounted = true;

    async function syncSession() {
      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!session) {
        setMessage("Session login belum ditemukan. Login ulang sebagai penghuni.");
        return;
      }

      if (sessionStorage.getItem(syncFlagKey) === "done") {
        setMessage(
          "Session login belum sinkron di server. Logout lalu login ulang."
        );
        return;
      }

      sessionStorage.setItem(syncFlagKey, "done");
      setMessage("Menyinkronkan session penghuni...");
      window.location.reload();
    }

    void syncSession();

    return () => {
      isMounted = false;
    };
  }, [shouldSync, sourceReason]);

  const displayMessage = message || getTenantPortalMessage(sourceReason);

  if (!shouldSync || !displayMessage) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
      {displayMessage}{" "}
      {displayMessage.includes("Login ulang") ||
      displayMessage.includes("Logout") ? (
        <Link className="underline" href="/login">
          Buka login
        </Link>
      ) : null}
    </div>
  );
}

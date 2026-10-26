"use client";

import { DoorOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { BillingList } from "@/components/dashboard/BillingList";
import { CashflowPanel } from "@/components/dashboard/CashflowPanel";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { HeroStatus } from "@/components/dashboard/HeroStatus";
import { RepairPanel } from "@/components/dashboard/RepairPanel";
import { RoomDetailPanel } from "@/components/dashboard/RoomDetailPanel";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { adminChecklist } from "@/lib/dashboard";
import type { DashboardOverviewData } from "@/lib/dashboard-data";

type DashboardOverviewProps = {
  data: DashboardOverviewData;
};

function EmptyRoomDetailPanel() {
  return (
    <aside className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
      <p className="text-sm font-bold text-[#2a6b5c]">Detail kamar</p>
      <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
          <DoorOpen size={24} />
        </div>
        <h2 className="mt-3 text-xl font-black text-slate-950">
          Pilih atau tambah kamar
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Detail kamar akan muncul di sini setelah data kamar tersedia.
        </p>
        <Link
          className="mt-4 inline-flex justify-center rounded-2xl bg-[#2a6b5c] px-4 py-3 text-sm font-black text-white transition hover:bg-[#23594d]"
          href="/rooms"
        >
          Buka data kamar
        </Link>
      </div>
    </aside>
  );
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(data.rooms[0] ?? null);

  return (
    <DashboardShell
      brand={data.brand}
      isSidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onOpenSidebar={() => setSidebarOpen(true)}
    >
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <HeroStatus summary={data.summary} />
        <CashflowPanel
          expenses={data.cashflow.expenses}
          income={data.cashflow.income}
          periodLabel={data.cashflow.periodLabel}
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_390px]">
        <RoomGrid
          onSelectRoom={setSelectedRoom}
          rooms={data.rooms}
          selectedRoomId={selectedRoom?.id}
        />

        {selectedRoom ? (
          <RoomDetailPanel room={selectedRoom} />
        ) : (
          <EmptyRoomDetailPanel />
        )}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <BillingList bills={data.bills} />
        <RepairPanel repairs={data.repairs} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
          <p className="text-sm font-bold text-[#2a6b5c]">
            Checklist admin
          </p>
          <h2 className="text-2xl font-black text-slate-950">Hari ini</h2>
          <div className="mt-5 space-y-3">
            {adminChecklist.map((item, index) => (
              <label
                className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-semibold shadow-sm"
                key={item}
              >
                <input
                  className="size-4 accent-[#2a6b5c]"
                  defaultChecked={index === 2}
                  type="checkbox"
                />
                {item}
              </label>
            ))}
          </div>
        </article>

        <ActivityFeed activities={data.activities} />
      </section>
    </DashboardShell>
  );
}

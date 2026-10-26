import { Wrench } from "lucide-react";

import type { Repair } from "@/lib/dashboard";

type RepairPanelProps = {
  repairs: Repair[];
};

export function RepairPanel({ repairs }: RepairPanelProps) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
      <p className="text-sm font-bold text-[#2a6b5c]">Laporan rusak</p>
      <h2 className="text-2xl font-black text-slate-950">Butuh tindakan</h2>

      <div className="mt-5 space-y-3">
        {repairs.length ? repairs.map((repair) => (
          <article
            className="rounded-3xl border border-slate-100 bg-white p-4"
            key={repair.title}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Wrench size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-950">{repair.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Kamar {repair.room} - {repair.age}
                </p>
              </div>
            </div>
            <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {repair.status}
            </span>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">
            Tidak ada laporan kerusakan aktif.
          </div>
        )}
      </div>
    </div>
  );
}

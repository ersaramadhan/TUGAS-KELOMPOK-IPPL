import { ArrowDownRight, ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";

import { formatMonthPeriod } from "@/lib/date";
import { formatMoney } from "@/lib/dashboard";

type CashflowPanelProps = {
  income?: number;
  expenses?: number;
  periodLabel?: string;
};

export function CashflowPanel({
  income = 0,
  expenses = 0,
  periodLabel = formatMonthPeriod()
}: CashflowPanelProps) {
  const netIncome = income - expenses;

  return (
    <aside className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#2a6b5c]">Cashflow cepat</p>
          <h2 className="text-xl font-black text-slate-950">{periodLabel}</h2>
        </div>
        <Link
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
          href="/expenses"
        >
          Bulanan
          <ChevronDown size={14} />
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        <Link className="block rounded-3xl bg-emerald-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm" href="/payments">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-800">
              Pemasukan
            </span>
            <ArrowUpRight className="text-emerald-700" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950">
            {formatMoney(income)}
          </p>
        </Link>
        <Link className="block rounded-3xl bg-rose-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm" href="/expenses">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-rose-800">
              Pengeluaran
            </span>
            <ArrowDownRight className="text-rose-700" size={18} />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-950">
            {formatMoney(expenses)}
          </p>
        </Link>
        <Link className="block rounded-3xl bg-slate-950 p-4 text-white transition hover:-translate-y-0.5 hover:shadow-sm" href="/dashboard">
          <span className="text-sm font-bold text-white/60">
            Estimasi laba bersih
          </span>
          <p className="mt-2 text-2xl font-black">{formatMoney(netIncome)}</p>
        </Link>
      </div>
    </aside>
  );
}

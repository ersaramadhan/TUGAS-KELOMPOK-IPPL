import { ReceiptText } from "lucide-react";
import Link from "next/link";

import { formatMoney } from "@/lib/dashboard";
import type { Bill } from "@/lib/dashboard";

type BillingListProps = {
  bills: Bill[];
};

function urgencyClass(urgency: Bill["urgency"]) {
  if (urgency === "Tinggi") {
    return "bg-rose-50 text-rose-700";
  }

  if (urgency === "Sedang") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

export function BillingList({ bills }: BillingListProps) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur xl:col-span-2 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#2a6b5c]">Tagihan prioritas</p>
          <h2 className="text-2xl font-black text-slate-950">
            Perlu dicek minggu ini
          </h2>
        </div>
        <Link
          className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 sm:block"
          href="/bills"
        >
          Lihat semua
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {bills.length ? bills.map((bill) => (
          <article
            className="grid min-w-0 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto]"
            key={`${bill.room}-${bill.tenant}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
                <ReceiptText size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-950">{bill.tenant}</p>
                <p className="text-sm text-slate-500">
                  Kamar {bill.room} - {bill.due}
                </p>
              </div>
            </div>
            <p className="self-center whitespace-nowrap font-black text-slate-950">
              {formatMoney(bill.amount)}
            </p>
            <span
              className={`justify-self-start self-center rounded-full px-3 py-1.5 text-xs font-black ${urgencyClass(
                bill.urgency
              )}`}
            >
              {bill.urgency}
            </span>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">
            Tidak ada tagihan prioritas untuk minggu ini.
          </div>
        )}
      </div>
    </div>
  );
}

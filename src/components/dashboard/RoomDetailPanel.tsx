import Link from "next/link";

import { formatMoney, statusClass } from "@/lib/dashboard";
import type { Room } from "@/lib/dashboard";

type RoomDetailPanelProps = {
  room: Room;
};

export function RoomDetailPanel({ room }: RoomDetailPanelProps) {
  return (
    <aside className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
      <p className="text-sm font-bold text-[#2a6b5c]">Detail kamar</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">{room.id}</h2>
      <div className={`mt-4 rounded-3xl border p-4 ${statusClass(room.status)}`}>
        <p className="text-xs font-bold uppercase tracking-[0.2em]">Status</p>
        <p className="mt-1 text-xl font-black">{room.status}</p>
      </div>
      <dl className="mt-5 space-y-4">
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Penghuni
          </dt>
          <dd className="mt-1 font-bold text-slate-900">
            {room.tenant ?? "Belum ditempati"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Harga
          </dt>
          <dd className="mt-1 font-bold text-slate-900">
            {formatMoney(room.price)} / bulan
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Jatuh tempo
          </dt>
          <dd className="mt-1 font-bold text-slate-900">
            {room.dueDate ?? "-"}
          </dd>
        </div>
      </dl>
      <Link
        className="mt-6 w-full rounded-2xl bg-[#2a6b5c] px-4 py-3 text-sm font-black text-white transition hover:bg-[#23594d]"
        href="/rooms"
      >
        Buka data kamar
      </Link>
    </aside>
  );
}

import { DoorOpen, Plus } from "lucide-react";
import Link from "next/link";

import { formatMoney, statusClass } from "@/lib/dashboard";
import type { Room, RoomStatus } from "@/lib/dashboard";

type RoomGridProps = {
  rooms: Room[];
  selectedRoomId?: string;
  onSelectRoom: (room: Room) => void;
};

const roomStatuses: RoomStatus[] = [
  "Terisi",
  "Kosong",
  "Menunggu bayar",
  "Perbaikan"
];

export function RoomGrid({
  rooms,
  selectedRoomId,
  onSelectRoom
}: RoomGridProps) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-[#2a6b5c]">Denah kamar</p>
          <h2 className="text-2xl font-black text-slate-950">
            Status kamar real-time
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          {roomStatuses.map((status) => (
            <span
              className={`rounded-full border px-3 py-1.5 ${statusClass(status)}`}
              key={status}
            >
              {status}
            </span>
          ))}
        </div>
      </div>

      {rooms.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
          <button
            className={`rounded-3xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-lg ${
              selectedRoomId === room.id
                ? "border-[#2a6b5c] bg-[#eef6f2] shadow"
                : statusClass(room.status)
            }`}
            key={room.id}
            onClick={() => onSelectRoom(room)}
            type="button"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold opacity-70">{room.floor}</p>
                <h3 className="mt-1 text-2xl font-black">{room.id}</h3>
              </div>
              <DoorOpen size={22} />
            </div>
            <p className="mt-5 text-sm font-semibold">
              {room.tenant ?? "Belum ada penghuni"}
            </p>
            <p className="mt-1 text-sm opacity-70">
              {formatMoney(room.price)} / bulan
            </p>
          </button>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-white p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
            <DoorOpen size={24} />
          </div>
          <h3 className="mt-3 text-xl font-black text-slate-950">
            Belum ada kamar
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Tambahkan kamar pertama supaya denah, okupansi, tagihan, dan detail
            operasional mulai terbentuk.
          </p>
          <Link
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2a6b5c] px-4 py-3 text-sm font-black text-white transition hover:bg-[#23594d]"
            href="/rooms"
          >
            <Plus size={16} />
            Tambah kamar
          </Link>
        </div>
      )}
    </div>
  );
}

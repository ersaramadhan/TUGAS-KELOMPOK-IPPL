"use client";

import { CheckCircle2, DoorOpen, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { claimTenantRoomAction } from "@/app/tenant/actions";
import { formatMoney } from "@/lib/dashboard";
import type {
  TenantAvailableRoom,
  TenantPortalProfile
} from "@/lib/tenant-data";

type RentType = "monthly" | "yearly";

type TenantRoomOnboardingProps = {
  availableRooms: TenantAvailableRoom[];
  profile: TenantPortalProfile;
};

export function TenantRoomOnboarding({
  availableRooms,
  profile
}: TenantRoomOnboardingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRoomId, setSelectedRoomId] = useState(
    availableRooms[0]?.id ?? ""
  );
  const [rentType, setRentType] = useState<RentType>("monthly");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room.id === selectedRoomId) ?? null,
    [availableRooms, selectedRoomId]
  );
  const canUseYearly = Boolean(selectedRoom?.yearlyPrice);

  function chooseRoom(roomId: string) {
    const room = availableRooms.find((item) => item.id === roomId);

    setSelectedRoomId(roomId);
    if (!room?.yearlyPrice && rentType === "yearly") {
      setRentType("monthly");
    }
  }

  function claimRoom() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await claimTenantRoomAction({
        rentType,
        roomId: selectedRoomId
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#2a6b5c]">Mulai menempati</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
            Pilih kamar kosong
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
            Halo {profile.name}, pilih salah satu kamar yang tersedia. Setelah
            disimpan, akunmu langsung aktif sebagai penghuni dan terlihat di
            dashboard pemilik kos.
          </p>

          <div className="mt-5 rounded-[28px] border border-slate-100 bg-white p-4">
            <p className="text-sm font-black text-slate-950">Tipe sewa</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                  rentType === "monthly"
                    ? "border-[#2a6b5c] bg-[#eef6f2] text-[#2a6b5c]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
                onClick={() => setRentType("monthly")}
                type="button"
              >
                Bulanan
              </button>
              <button
                className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                  rentType === "yearly"
                    ? "border-[#2a6b5c] bg-[#eef6f2] text-[#2a6b5c]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                } disabled:cursor-not-allowed disabled:opacity-50`}
                disabled={!canUseYearly}
                onClick={() => setRentType("yearly")}
                type="button"
              >
                Tahunan
              </button>
            </div>
            {selectedRoom ? (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {rentType === "yearly" && selectedRoom.yearlyPrice
                  ? `${formatMoney(selectedRoom.yearlyPrice)} / tahun`
                  : `${formatMoney(selectedRoom.monthlyPrice)} / bulan`}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {message}
            </p>
          ) : null}

          <button
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2a6b5c] px-4 py-3 text-sm font-black text-white transition hover:bg-[#23594d] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedRoomId || isPending}
            onClick={claimRoom}
            type="button"
          >
            {isPending ? <Loader2 className="animate-spin" size={18} /> : null}
            Simpan pilihan kamar
          </button>
        </div>

        <div className="min-w-0">
          {availableRooms.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {availableRooms.map((room) => {
                const isSelected = room.id === selectedRoomId;

                return (
                  <button
                    className={`min-w-0 rounded-[28px] border p-4 text-left transition ${
                      isSelected
                        ? "border-[#2a6b5c] bg-[#eef6f2] shadow-sm"
                        : "border-slate-200 bg-white hover:border-[#2a6b5c]/40"
                    }`}
                    key={room.id}
                    onClick={() => chooseRoom(room.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-slate-400">
                          {room.floor ?? "Tanpa lantai"}
                        </p>
                        <h2 className="mt-2 break-words text-3xl font-black text-slate-950">
                          {room.name}
                        </h2>
                      </div>
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                          isSelected
                            ? "bg-[#2a6b5c] text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <DoorOpen size={20} />
                        )}
                      </span>
                    </div>
                    <p className="mt-5 text-sm font-bold text-slate-600">
                      {formatMoney(room.monthlyPrice)} / bulan
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {room.yearlyPrice
                        ? `${formatMoney(room.yearlyPrice)} / tahun`
                        : "Sewa tahunan belum tersedia"}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center">
              <DoorOpen className="mx-auto text-[#2a6b5c]" size={32} />
              <h2 className="mt-3 text-xl font-black text-slate-950">
                Belum ada kamar kosong
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Tunggu pemilik kos menambahkan kamar kosong, lalu refresh
                halaman ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

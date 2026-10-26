"use client";

import {
  AlertTriangle,
  Building2,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createRoomAction,
  deleteRoomAction,
  updateRoomAction
} from "@/app/rooms/actions";
import type { RoomFormValues } from "@/app/rooms/actions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { formatMoney } from "@/lib/dashboard";
import type { OwnerRoomRecord } from "@/lib/owner-data";

type Metric = {
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "amber" | "rose" | "slate";
};

type RoomsManagerProps = {
  metrics: Metric[];
  rooms: OwnerRoomRecord[];
};

const emptyFormValues: RoomFormValues = {
  name: "",
  floor: "",
  monthlyPrice: "",
  yearlyPrice: "",
  status: "vacant",
  internalNote: ""
};

const toneClasses: Record<Metric["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
};

const statusLabels: Record<OwnerRoomRecord["status"], string> = {
  vacant: "Kosong",
  occupied: "Terisi",
  maintenance: "Perbaikan",
  inactive: "Nonaktif"
};

function roomToFormValues(room: OwnerRoomRecord): RoomFormValues {
  return {
    id: room.id,
    name: room.name,
    floor: room.floor ?? "",
    monthlyPrice: `${room.monthly_price}`,
    yearlyPrice: room.yearly_price ? `${room.yearly_price}` : "",
    status: room.status,
    internalNote: room.internal_note ?? ""
  };
}

export function RoomsManager({
  metrics,
  rooms
}: RoomsManagerProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<RoomFormValues>(emptyFormValues);
  const [editingRoom, setEditingRoom] = useState<OwnerRoomRecord | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function openCreateForm() {
    setEditingRoom(null);
    setFormValues(emptyFormValues);
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(room: OwnerRoomRecord) {
    setEditingRoom(room);
    setFormValues(roomToFormValues(room));
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingRoom(null);
    setFormValues(emptyFormValues);
    setError("");
    setIsFormOpen(false);
  }

  function saveRoom() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = editingRoom
        ? await updateRoomAction(formValues)
        : await createRoomAction(formValues);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      closeForm();
      router.refresh();
    });
  }

  function deleteRoom(roomId: string) {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await deleteRoomAction(roomId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <DashboardShell
      isSidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      onOpenSidebar={() => setSidebarOpen(true)}
    >
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[#2a6b5c]">
              Manajemen kamar
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
              Data kamar
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Kelola nomor kamar, lantai, harga, status okupansi, dan catatan
              internal dalam satu tempat.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17211e] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#24332f]"
            onClick={openCreateForm}
            type="button"
          >
            <Plus size={18} />
            Tambah kamar
          </button>
        </div>
      </section>

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

      <section className="mt-4 grid gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article
            className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur"
            key={metric.label}
          >
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${toneClasses[metric.tone]}`}
            >
              {metric.label}
            </span>
            <p className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-5 text-slate-500">
              {metric.note}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-4 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-[#2a6b5c]">Data terbaru</p>
            <h2 className="text-2xl font-black text-slate-950">
              Ringkasan operasional
            </h2>
          </div>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10 sm:w-72"
              placeholder="Cari kamar"
              type="search"
            />
          </label>
        </div>

        {rooms.length ? (
          <div className="mt-5 space-y-3">
            {rooms.map((room) => (
              <article
                className="grid min-w-0 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
                key={room.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6f2] text-[#2a6b5c]">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-950">
                      Kamar {room.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {room.floor ?? "Tanpa lantai"} -{" "}
                      {room.internal_note ?? "Tanpa catatan"}
                    </p>
                  </div>
                </div>
                <p className="self-center whitespace-nowrap font-black text-slate-950">
                  {formatMoney(room.monthly_price)}
                </p>
                <span className="inline-flex max-w-full justify-self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 md:self-center">
                  {statusLabels[room.status]}
                </span>
                <div className="flex items-center gap-2 self-center">
                  <Link
                    aria-label={`Lihat detail kamar ${room.name}`}
                    className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                    href={`/rooms/${room.id}`}
                  >
                    <Eye size={16} />
                  </Link>
                  <button
                    aria-label={`Edit kamar ${room.name}`}
                    className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:border-[#2a6b5c]/40 hover:text-[#2a6b5c]"
                    onClick={() => openEditForm(room)}
                    type="button"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={`Hapus kamar ${room.name}`}
                    className="rounded-2xl border border-rose-100 p-2 text-rose-600 transition hover:bg-rose-50"
                    onClick={() => deleteRoom(room.id)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center">
            <AlertTriangle className="mx-auto text-[#2a6b5c]" size={30} />
            <h3 className="mt-3 text-xl font-black text-slate-950">
              Belum ada kamar
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Tambahkan kamar pertama. Jika aksi ditolak, pastikan grant dan RLS
              insert/update/delete untuk tabel rooms sudah dibuat.
            </p>
          </div>
        )}
      </section>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="max-h-[calc(100vh-32px)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/70 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#2a6b5c]">
                  {editingRoom ? "Edit kamar" : "Tambah kamar"}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {editingRoom ? `Kamar ${editingRoom.name}` : "Data kamar baru"}
                </h2>
              </div>
              <button
                aria-label="Tutup form"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                onClick={closeForm}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Nomor kamar
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      name: event.target.value
                    }))
                  }
                  value={formValues.name}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Lantai</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      floor: event.target.value
                    }))
                  }
                  value={formValues.floor}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Harga bulanan
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      monthlyPrice: event.target.value
                    }))
                  }
                  inputMode="numeric"
                  placeholder="Contoh: 1250000 atau 1.250.000"
                  value={formValues.monthlyPrice}
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Harga tahunan
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      yearlyPrice: event.target.value
                    }))
                  }
                  inputMode="numeric"
                  placeholder="Opsional, contoh: 15000000 atau 15.000.000"
                  value={formValues.yearlyPrice}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">Status</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      status: event.target.value as RoomFormValues["status"]
                    }))
                  }
                  value={formValues.status}
                >
                  <option value="vacant">Kosong</option>
                  <option value="occupied">Terisi</option>
                  <option value="maintenance">Perbaikan</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  Catatan internal
                </span>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2a6b5c] focus:ring-4 focus:ring-[#2a6b5c]/10"
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      internalNote: event.target.value
                    }))
                  }
                  value={formValues.internalNote}
                />
              </label>
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

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600"
                disabled={isPending}
                onClick={closeForm}
                type="button"
              >
                Batal
              </button>
              <button
                className="rounded-2xl bg-[#2a6b5c] px-4 py-3 text-sm font-black text-white transition hover:bg-[#23594d] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                onClick={saveRoom}
                type="button"
              >
                {isPending ? "Menyimpan..." : "Simpan kamar"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}

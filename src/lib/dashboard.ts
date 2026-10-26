import {
  CreditCard,
  DoorOpen,
  Home,
  ReceiptText,
  Settings,
  ShieldCheck,
  WalletCards,
  Wrench
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type RoomStatus = "Terisi" | "Kosong" | "Menunggu bayar" | "Perbaikan";
export type UiState = "ready" | "loading" | "empty" | "error";

export type Room = {
  id: string;
  floor: string;
  tenant: string | null;
  price: number;
  dueDate: string | null;
  status: RoomStatus;
};

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type Bill = {
  tenant: string;
  room: string;
  amount: number;
  due: string;
  urgency: "Tinggi" | "Sedang" | "Normal";
};

export type Repair = {
  title: string;
  room: string;
  status: string;
  age: string;
};

export type Summary = {
  occupied: number;
  unpaid: number;
  vacant: number;
  monthlyIncome: number;
  totalRooms: number;
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Kamar", href: "/rooms", icon: DoorOpen },
  { label: "Penghuni", href: "/tenants", icon: ShieldCheck },
  { label: "Tagihan", href: "/bills", icon: ReceiptText },
  { label: "Pembayaran", href: "/payments", icon: CreditCard },
  { label: "Pengeluaran", href: "/expenses", icon: WalletCards },
  { label: "Kerusakan", href: "/reports", icon: Wrench },
  { label: "Pengaturan", href: "/settings", icon: Settings }
];

export const adminChecklist = [
  "Cek pembayaran menunggu verifikasi",
  "Tinjau laporan kerusakan aktif",
  "Catat pengeluaran operasional"
];

const moneyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const naturalTextCollator = new Intl.Collator("id-ID", {
  numeric: true,
  sensitivity: "base"
});

export function formatMoney(value: number) {
  return moneyFormatter.format(value).replace("IDR", "Rp");
}

export function compareNaturalText(firstValue: string, secondValue: string) {
  return naturalTextCollator.compare(firstValue, secondValue);
}

export function statusClass(status: RoomStatus) {
  const styles: Record<RoomStatus, string> = {
    Terisi: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Kosong: "border-slate-200 bg-white text-slate-700",
    "Menunggu bayar": "border-amber-200 bg-amber-50 text-amber-800",
    Perbaikan: "border-rose-200 bg-rose-50 text-rose-800"
  };

  return styles[status];
}

export function getSummary(roomList: Room[]): Summary {
  const occupied = roomList.filter((room) => room.status === "Terisi").length;
  const unpaid = roomList.filter(
    (room) => room.status === "Menunggu bayar"
  ).length;
  const vacant = roomList.filter((room) => room.status === "Kosong").length;
  const monthlyIncome = roomList
    .filter((room) => room.status === "Terisi" || room.status === "Menunggu bayar")
    .reduce((total, room) => total + room.price, 0);

  return {
    occupied,
    unpaid,
    vacant,
    monthlyIncome,
    totalRooms: roomList.length
  };
}

import { CreditCard, Home, ReceiptText, UserRound, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TenantNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const tenantNavItems: TenantNavItem[] = [
  { label: "Beranda", href: "/tenant", icon: Home },
  { label: "Tagihan", href: "/tenant/bills", icon: ReceiptText },
  { label: "Pembayaran", href: "/tenant/payments", icon: CreditCard },
  { label: "Laporan", href: "/tenant/reports", icon: Wrench },
  { label: "Profil", href: "/tenant/profile", icon: UserRound }
];

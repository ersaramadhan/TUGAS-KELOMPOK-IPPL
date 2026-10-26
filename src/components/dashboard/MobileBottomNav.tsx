"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/lib/dashboard";

const mobileNavItems = [
  navigationItems[0],
  navigationItems[1],
  navigationItems[3],
  navigationItems[6],
  navigationItems[7]
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-2 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-[24px] border border-white/70 bg-white/90 p-2 shadow-xl backdrop-blur lg:hidden">
      {mobileNavItems.map(({ label, href, icon: Icon }) => {
        const isActive =
          pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

        return (
        <Link
          className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-bold transition sm:text-[11px] ${
            isActive
              ? "bg-[#17211e] text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
          key={label}
          href={href}
        >
          <Icon size={17} />
          <span className="max-w-full truncate">{label}</span>
        </Link>
        );
      })}
    </nav>
  );
}

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  href?: string;
};

export function StatCard({ label, value, note, icon: Icon, href }: StatCardProps) {
  const content = (
    <>
      <Icon className="text-[#d9f99d]" size={22} />
      <p className="mt-4 text-xs font-semibold text-white/55">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="mt-2 text-xs text-white/55">{note}</p>
    </>
  );

  if (href) {
    return (
      <Link
        className="block min-w-0 rounded-3xl border border-white/10 bg-white/10 p-4 transition hover:-translate-y-0.5 hover:bg-white/15"
        href={href}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="min-w-0 rounded-3xl border border-white/10 bg-white/10 p-4">
      {content}
    </article>
  );
}

type TenantCardProps = {
  label: string;
  value: string;
  note: string;
  tone?: "emerald" | "amber" | "rose" | "slate";
};

const toneClasses = {
  emerald: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-rose-50 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
};

export function TenantCard({
  label,
  value,
  note,
  tone = "slate"
}: TenantCardProps) {
  return (
    <article className="min-w-0 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <span
        className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-black ${toneClasses[tone]}`}
      >
        {label}
      </span>
      <p className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-slate-500">{note}</p>
    </article>
  );
}

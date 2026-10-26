type TenantListRow = {
  title: string;
  meta: string;
  status: string;
  amount?: string;
};

type TenantListPanelProps = {
  eyebrow: string;
  title: string;
  rows: TenantListRow[];
  emptyMessage?: string;
};

export function TenantListPanel({
  eyebrow,
  title,
  rows,
  emptyMessage
}: TenantListPanelProps) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
      <p className="text-sm font-bold text-[#2a6b5c]">{eyebrow}</p>
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>

      <div className="mt-5 space-y-3">
        {rows.length ? rows.map((row) => (
          <article
            className="grid min-w-0 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto]"
            key={`${row.title}-${row.meta}`}
          >
            <div className="min-w-0">
              <p className="font-black text-slate-950">{row.title}</p>
              <p className="mt-1 text-sm text-slate-500">{row.meta}</p>
            </div>
            {row.amount ? (
              <p className="self-center whitespace-nowrap font-black text-slate-950">
                {row.amount}
              </p>
            ) : null}
            <span className="inline-flex max-w-full justify-self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 md:self-center">
              {row.status}
            </span>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">
            {emptyMessage ?? "Belum ada data."}
          </div>
        )}
      </div>
    </section>
  );
}

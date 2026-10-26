import { CheckCircle2 } from "lucide-react";

type ActivityFeedProps = {
  activities: string[];
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <article className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
      <p className="text-sm font-bold text-[#2a6b5c]">Aktivitas terbaru</p>
      <h2 className="text-2xl font-black text-slate-950">
        Jejak operasional
      </h2>
      <div className="mt-5 space-y-4">
        {activities.length ? activities.map((activity, index) => (
          <div className="flex min-w-0 gap-3" key={`${activity}-${index}`}>
            <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e7f0ec] text-[#2a6b5c]">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-sm leading-6 text-slate-600">{activity}</p>
          </div>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">
            Belum ada aktivitas terbaru.
          </div>
        )}
      </div>
    </article>
  );
}

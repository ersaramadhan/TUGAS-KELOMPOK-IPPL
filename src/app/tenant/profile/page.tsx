import { TenantCard } from "@/components/tenant/TenantCard";
import { TenantShell } from "@/components/tenant/TenantShell";
import { getTenantPortalData } from "@/lib/tenant-data";

export default async function TenantProfilePage() {
  const { profile, sourceReason } = await getTenantPortalData();
  const profileRows = [
    ["Nama lengkap", profile.name],
    ["Email", profile.email],
    ["Nomor WhatsApp", profile.phone],
    ["Kamar", profile.room],
    ["Tipe sewa", profile.rentType],
    ["Tanggal masuk", profile.moveInDate],
    ["Kontak darurat", profile.emergencyContact]
  ];

  return (
    <TenantShell profile={profile} sourceReason={sourceReason}>
      <section className="grid gap-4 md:grid-cols-3">
        <TenantCard label="Kamar" note="Kamar aktif" value={profile.room} />
        <TenantCard
          label="Sewa"
          note="Mengikuti data penghuni"
          value={profile.rentType}
        />
        <TenantCard
          label="Status"
          note="Penghuni aktif"
          tone="emerald"
          value={profile.status}
        />
      </section>

      <section className="mt-4 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
        <p className="text-sm font-bold text-[#2a6b5c]">Profil saya</p>
        <h1 className="text-2xl font-black text-slate-950">
          Data penghuni
        </h1>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {profileRows.map(([label, value]) => (
            <div className="rounded-3xl border border-slate-100 bg-white p-4" key={label}>
              <dt className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                {label}
              </dt>
              <dd className="mt-2 font-black text-slate-950">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </TenantShell>
  );
}

# KosPilot Dashboard

Aplikasi admin kos berbasis Next.js, TypeScript, Tailwind CSS, dan Supabase.

## Fitur Utama

- Dashboard pemilik dengan ringkasan kamar, cashflow, tagihan, laporan, dan aktivitas.
- Modul pemilik: kamar, penghuni, tagihan, pembayaran, pengeluaran, kerusakan, dan pengaturan.
- Portal penghuni: beranda, tagihan, pembayaran, laporan kerusakan, dan profil.
- Supabase Auth untuk login/register owner dan tenant.
- Supabase Database dan Storage untuk data operasional dan bukti file.
- Empty/error state Supabase tanpa fallback data lokal.
- Proteksi route berbasis role owner dan tenant.

## Setup Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Supabase

1. Jalankan `docs/deploy-supabase.sql` di Supabase SQL Editor.
2. Pastikan bucket Storage `payment-proofs`, `expense-proofs`, dan `report-photos` sudah ada.
3. Isi `.env.local` dari `.env.example`.
4. Pastikan user Auth punya row `profiles` dengan role `owner` atau `tenant`.

## Pengecekan

```bash
npm run lint
npm run build
```

`npm run lint` memeriksa kualitas kode. `npm run build` memastikan project siap dibuat sebagai versi produksi.

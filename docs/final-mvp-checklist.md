# KosPilot Final MVP Checklist

Status saat ini: MVP Supabase dengan dashboard pemilik dan portal penghuni.

## Selesai

- Dashboard pemilik responsive.
- Route pemilik: dashboard, kamar, penghuni, tagihan, pembayaran, pengeluaran, kerusakan, pengaturan.
- Portal penghuni: beranda, tagihan, pembayaran, laporan kerusakan, profil.
- Supabase Auth untuk login, register, dan logout.
- Proteksi route berbasis role owner dan tenant.
- CRUD Supabase untuk kamar, penghuni, tagihan, pembayaran, pengeluaran, dan laporan kerusakan.
- Upload bukti pembayaran, bukti pengeluaran, dan foto laporan melalui Supabase Storage.
- Empty/error state Supabase tanpa fallback data lokal.
- RLS policy SQL per modul di folder `docs`.

## Wajib Dicek Sebelum Deploy

- `docs/deploy-supabase.sql` sudah dijalankan di Supabase SQL Editor.
- Bucket Storage `payment-proofs`, `expense-proofs`, dan `report-photos` sudah dibuat.
- `.env.local` atau env deploy berisi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Akun owner dan tenant punya row `profiles` sesuai ID Supabase Auth.
- Tenant aktif terhubung ke `profile_id` atau email Auth yang sama.
- `npm run lint` dan `npm run build` berhasil.

## Smoke Test

1. Login owner dan buka semua menu pemilik.
2. Tambah kamar, tambah penghuni, buat tagihan, catat/verifikasi pembayaran.
3. Catat pengeluaran dan update laporan kerusakan.
4. Login tenant, lihat tagihan, upload bukti, dan buat laporan.
5. Pastikan tenant hanya melihat data miliknya sendiri.

# PRD dan Desain UI - Aplikasi Admin Kos

## 1. Ringkasan Produk

**Nama sementara:** KosPilot

KosPilot adalah web aplikasi untuk pemilik kos yang ingin mengelola aset kos secara mandiri. Versi pertama difokuskan untuk satu properti kos aktif, dengan fitur utama untuk mengatur kamar, penghuni, tagihan, pembayaran, laporan kerusakan, dan ringkasan keuangan.

Produk ini memiliki dua area:

1. **Dashboard Pemilik**
   Dipakai oleh pemilik kos untuk mengelola semua data operasional.

2. **Portal Penghuni**
   Dipakai penghuni untuk melihat tagihan, mengunggah bukti pembayaran, melihat riwayat, dan melaporkan kerusakan.

## 2. Latar Belakang Masalah

Banyak pemilik kos masih mengelola data lewat catatan manual, chat, spreadsheet, atau ingatan pribadi. Cara ini rawan membuat data pembayaran tercecer, status kamar tidak akurat, bukti pembayaran sulit dicari, dan laporan kerusakan tidak terlacak.

KosPilot dibuat agar semua aktivitas penting kos berada dalam satu sistem yang rapi, mudah dicek dari laptop maupun HP, dan siap dikembangkan menjadi sistem yang lebih otomatis.

## 3. Tujuan Produk

- Membantu pemilik kos mengetahui kondisi bisnis kos dalam satu dashboard.
- Mengurangi pencatatan manual untuk kamar, penghuni, pembayaran, dan pengeluaran.
- Memberi penghuni portal sendiri agar tagihan dan laporan kerusakan tidak tercecer di chat.
- Membuat data kos siap digunakan untuk laporan bulanan dan pengambilan keputusan.
- Menjadi fondasi untuk fitur lanjutan seperti pengingat WhatsApp, kontrak digital, dan analisis keuntungan kamar.

## 4. Ruang Lingkup MVP

MVP adalah versi awal yang cukup berguna untuk dipakai sehari-hari.

### Masuk MVP

- Login pemilik.
- Login penghuni.
- Dashboard ringkasan.
- Manajemen data kamar.
- Manajemen data penghuni.
- Tagihan bulanan dan tahunan.
- Pencatatan pembayaran.
- Unggah bukti pembayaran.
- Pencatatan pengeluaran operasional.
- Laporan kerusakan dari penghuni.
- Status pengerjaan laporan kerusakan.
- Riwayat aktivitas dasar.
- Responsive design untuk laptop dan HP.

### Tidak Masuk MVP

- Pembayaran otomatis dengan payment gateway.
- Pengingat WhatsApp otomatis.
- Tanda tangan kontrak digital.
- Multi-admin atau role penjaga kos.
- Marketplace pencarian kos untuk publik.
- Manajemen banyak properti aktif.

Catatan: jika nanti aset kedua tetap ingin dicatat karena sedang dijual, fiturnya bisa masuk fase berikut sebagai **mode properti dijual**, berisi dokumen aset, status penawaran, dan riwayat biaya.

## 5. Target Pengguna

| Pengguna | Kebutuhan Utama | Akses |
|---|---|---|
| Pemilik kos | Mengelola kamar, penghuni, pembayaran, pengeluaran, dan laporan | Penuh |
| Penghuni | Melihat tagihan, unggah bukti, dan melapor kerusakan | Terbatas ke data sendiri |

## 6. Asumsi Produk

- Jumlah properti aktif pada MVP: **1 properti kos**.
- Sistem dikelola langsung oleh pemilik, belum ada admin tambahan.
- Pembayaran bisa **bulanan** dan **tahunan**.
- Setiap penghuni wajib punya akun sendiri.
- Bukti pembayaran berupa file gambar atau PDF.
- Aplikasi web dibuat terlebih dahulu, lalu bisa dibuat lebih mobile-friendly setelah MVP stabil.

## 7. Fitur Detail

### 7.1 Autentikasi

**Tujuan:** memastikan data kos hanya bisa diakses oleh pengguna yang benar.

Fitur:

- Login pemilik.
- Login penghuni.
- Logout.
- Proteksi halaman berdasarkan role.
- Reset password melalui email.

Aturan:

- Pemilik bisa melihat semua data.
- Penghuni hanya bisa melihat data kamar, tagihan, pembayaran, dan laporan miliknya sendiri.
- Password tidak boleh disimpan manual di database aplikasi. Gunakan layanan autentikasi seperti Supabase Auth.

### 7.2 Dashboard Pemilik

**Tujuan:** memberi gambaran cepat kondisi kos.

Komponen:

- Total kamar.
- Kamar terisi.
- Kamar kosong.
- Pemasukan bulan ini.
- Tagihan belum lunas.
- Pengeluaran bulan ini.
- Laporan kerusakan aktif.
- Aktivitas terbaru.

Empty state:

- Jika belum ada kamar, tampilkan ajakan membuat kamar pertama.
- Jika belum ada pembayaran, tampilkan pesan bahwa belum ada transaksi.

### 7.3 Manajemen Kamar

**Tujuan:** mengatur data kamar dan status okupansi.

Data kamar:

- Nomor/nama kamar.
- Lantai atau area.
- Harga bulanan.
- Harga tahunan.
- Status: kosong, terisi, perbaikan, nonaktif.
- Fasilitas: kamar mandi, AC, Wi-Fi, kasur, lemari, meja.
- Catatan internal.

Aksi:

- Tambah kamar.
- Edit kamar.
- Ubah status kamar.
- Lihat detail kamar.

Validasi:

- Nomor kamar wajib diisi.
- Harga tidak boleh negatif.
- Nomor kamar tidak boleh duplikat dalam satu properti.

### 7.4 Manajemen Penghuni

**Tujuan:** menyimpan data penghuni dan relasinya ke kamar.

Data penghuni:

- Nama lengkap.
- Email.
- Nomor WhatsApp.
- Nomor identitas, opsional untuk MVP.
- Kontak darurat.
- Kamar yang ditempati.
- Tanggal masuk.
- Tipe sewa: bulanan atau tahunan.
- Status: aktif, akan keluar, sudah keluar.

Aksi:

- Tambah penghuni.
- Hubungkan penghuni ke kamar.
- Lihat detail penghuni.
- Tandai penghuni keluar.

Validasi:

- Nama wajib diisi.
- Email wajib valid.
- Satu kamar hanya boleh punya satu penghuni aktif pada MVP.
- Tanggal masuk tidak boleh kosong.

### 7.5 Tagihan

**Tujuan:** mencatat kewajiban pembayaran penghuni.

Data tagihan:

- Penghuni.
- Kamar.
- Periode tagihan.
- Tipe: bulanan atau tahunan.
- Nominal.
- Tanggal jatuh tempo.
- Status: draft, belum lunas, menunggu verifikasi, lunas, terlambat.

Aksi:

- Buat tagihan manual.
- Generate tagihan dari data penghuni.
- Edit tagihan sebelum lunas.
- Tandai terlambat otomatis berdasarkan tanggal jatuh tempo.

Validasi:

- Nominal wajib lebih dari 0.
- Tanggal jatuh tempo wajib diisi.
- Tagihan lunas tidak boleh diedit sembarangan tanpa catatan koreksi.

### 7.6 Pembayaran

**Tujuan:** mencatat pembayaran dan bukti transfer.

Alur:

1. Penghuni melihat tagihan.
2. Penghuni mengunggah bukti pembayaran.
3. Status tagihan berubah menjadi menunggu verifikasi.
4. Pemilik memeriksa bukti.
5. Pemilik menyetujui atau menolak.
6. Jika disetujui, status menjadi lunas.

Data pembayaran:

- Tagihan terkait.
- Tanggal bayar.
- Nominal bayar.
- Metode pembayaran.
- Bukti pembayaran.
- Catatan.
- Status verifikasi.

Validasi:

- File bukti hanya gambar atau PDF.
- Ukuran file dibatasi, misalnya maksimal 5 MB.
- Nominal bayar wajib lebih dari 0.

### 7.7 Pengeluaran

**Tujuan:** menghitung biaya operasional kos.

Kategori:

- Listrik.
- Air.
- Internet.
- Perawatan.
- Kebersihan.
- Perbaikan.
- Lainnya.

Data:

- Tanggal.
- Kategori.
- Nominal.
- Deskripsi.
- Bukti pengeluaran opsional.

Output:

- Total pengeluaran bulan ini.
- Ringkasan pemasukan dikurangi pengeluaran.

### 7.8 Laporan Kerusakan

**Tujuan:** membuat laporan masalah kamar lebih rapi dan terlacak.

Data laporan:

- Penghuni.
- Kamar.
- Judul masalah.
- Deskripsi.
- Foto opsional.
- Prioritas: rendah, sedang, tinggi.
- Status: baru, diproses, selesai, ditolak.
- Catatan pemilik.

Alur:

1. Penghuni membuat laporan.
2. Pemilik menerima notifikasi di dashboard.
3. Pemilik mengubah status.
4. Penghuni bisa melihat progres.

Empty state:

- Jika tidak ada laporan aktif, tampilkan kondisi aman dan rapi.

## 8. Struktur Halaman

### 8.1 Halaman Pemilik

| Route | Halaman | Fungsi |
|---|---|---|
| `/login` | Login | Masuk sebagai pemilik atau penghuni |
| `/dashboard` | Dashboard pemilik | Ringkasan kondisi kos |
| `/rooms` | Data kamar | Daftar dan status kamar |
| `/rooms/[id]` | Detail kamar | Detail kamar, penghuni, tagihan, inventaris singkat |
| `/tenants` | Data penghuni | Daftar penghuni aktif dan riwayat |
| `/tenants/[id]` | Detail penghuni | Profil, kamar, tagihan, pembayaran |
| `/bills` | Tagihan | Semua tagihan |
| `/payments` | Pembayaran | Verifikasi bukti pembayaran |
| `/expenses` | Pengeluaran | Catatan biaya operasional |
| `/reports` | Kerusakan | Daftar laporan kerusakan |
| `/settings` | Pengaturan | Profil kos dan preferensi pembayaran |

### 8.2 Halaman Penghuni

| Route | Halaman | Fungsi |
|---|---|---|
| `/tenant` | Beranda penghuni | Ringkasan kamar dan tagihan |
| `/tenant/bills` | Tagihan saya | Lihat tagihan pribadi |
| `/tenant/payments` | Pembayaran saya | Unggah dan lihat riwayat pembayaran |
| `/tenant/reports` | Laporan saya | Buat dan pantau laporan kerusakan |
| `/tenant/profile` | Profil | Data akun penghuni |

## 9. Desain UI

### 9.1 Identitas Visual

Konsep visual: **property command center**. Tampilan harus terasa modern, rapi, dan premium, tetapi tetap mudah dipakai pemula.

Gaya:

- Layout dashboard padat tetapi tidak sesak.
- Banyak area putih atau terang agar data mudah dibaca.
- Aksen warna dipakai untuk status, bukan sekadar dekorasi.
- Kartu dipakai untuk statistik dan item berulang.
- Tabel dilengkapi filter, search, dan status badge.

Palet warna:

| Nama | Warna | Fungsi |
|---|---|---|
| Ink | `#111827` | Teks utama |
| Slate | `#64748B` | Teks sekunder |
| Surface | `#F8FAFC` | Background halaman |
| Card | `#FFFFFF` | Kontainer data |
| Emerald | `#10B981` | Lunas/aktif |
| Amber | `#F59E0B` | Menunggu/peringatan |
| Rose | `#F43F5E` | Terlambat/error |
| Indigo | `#4F46E5` | Aksi utama |
| Cyan | `#06B6D4` | Informasi |

Tipografi:

- Gunakan `Inter` atau `Geist Sans`.
- Judul halaman: 24-32 px.
- Judul section: 18-20 px.
- Teks isi: 14-16 px.
- Teks bantuan: 12-13 px.

### 9.2 Layout Dashboard Pemilik

Susunan desktop:

1. Sidebar kiri berisi menu utama.
2. Topbar berisi nama kos, search, dan profil.
3. Area statistik ringkas di atas.
4. Denah/status kamar dalam bentuk grid.
5. Kolom aktivitas dan tagihan yang butuh perhatian.

Susunan mobile:

1. Bottom navigation untuk menu utama.
2. Statistik menjadi carousel atau grid dua kolom.
3. Tabel berubah menjadi list card.
4. Aksi utama tetap mudah dijangkau.

### 9.3 Komponen UI Utama

| Komponen | Fungsi | Catatan UX |
|---|---|---|
| Status Badge | Menandai lunas, kosong, terlambat, diproses | Warna konsisten di seluruh aplikasi |
| Room Tile | Menampilkan kamar sebagai blok visual | Cocok untuk denah sederhana |
| Stat Card | Menampilkan angka penting | Harus punya ikon dan perubahan periode |
| Data Table | Daftar kamar, penghuni, tagihan | Wajib ada search dan filter |
| Upload Card | Unggah bukti pembayaran/foto kerusakan | Tampilkan preview file |
| Empty State | Kondisi data kosong | Beri aksi yang jelas |
| Toast | Feedback sukses/error | Jangan hanya diam setelah aksi |
| Modal Form | Tambah/edit data cepat | Validasi langsung terlihat |

### 9.4 Wireframe Tekstual

Dashboard pemilik:

```text
Sidebar     Topbar: KosPilot / Search / Profil
Menu        ------------------------------------------------
Dashboard   Total Kamar | Terisi | Pemasukan | Belum Lunas
Kamar       ------------------------------------------------
Penghuni    Status Kamar Grid          Tagihan Perlu Dicek
Tagihan     [A1] [A2] [A3] [A4]        - Budi: Menunggu
Pembayaran  [B1] [B2] [B3] [B4]        - Sinta: Terlambat
Kerusakan   ------------------------------------------------
Keuangan    Aktivitas Terbaru          Laporan Kerusakan
```

Portal penghuni:

```text
Topbar: Nama Penghuni / Kamar A1
------------------------------------------------
Tagihan Aktif
Nominal | Jatuh Tempo | Status | Upload Bukti
------------------------------------------------
Riwayat Pembayaran
------------------------------------------------
Laporan Kerusakan Saya
```

## 10. Struktur Data Awal

Tabel database yang disarankan:

| Tabel | Fungsi |
|---|---|
| `profiles` | Data user pemilik dan penghuni |
| `properties` | Data properti kos |
| `rooms` | Data kamar |
| `tenants` | Data penghuni |
| `bills` | Data tagihan |
| `payments` | Data pembayaran |
| `expenses` | Data pengeluaran |
| `maintenance_reports` | Laporan kerusakan |
| `activity_logs` | Riwayat aktivitas |

Relasi sederhana:

```text
property -> rooms
room -> tenant
tenant -> bills
bill -> payments
tenant -> maintenance_reports
property -> expenses
```

## 11. Stack Teknologi

Stack yang disarankan:

| Bagian | Teknologi | Alasan |
|---|---|---|
| Frontend dan backend | Next.js + TypeScript | Modern dan satu project untuk UI plus API |
| Styling | Tailwind CSS | Cepat, responsif, mudah dipelajari |
| UI dasar | shadcn/ui | Komponen rapi dan bisa dikustom |
| Database | PostgreSQL | Cocok untuk data relasional |
| Backend service | Supabase | Auth, database, dan storage dalam satu tempat |
| Validasi | Zod | Validasi form lebih aman |
| Form | React Hook Form | Form lebih ringan dan terkontrol |
| Deploy | Vercel | Mudah untuk Next.js |

Catatan keamanan:

- API key disimpan di `.env.local`.
- Jangan commit `.env.local`.
- Gunakan Row Level Security di Supabase agar penghuni hanya bisa akses data sendiri.

## 12. Struktur Folder Next.js yang Disarankan

```text
kos-pilot/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (owner)/
│   │   ├── dashboard/
│   │   ├── rooms/
│   │   ├── tenants/
│   │   ├── bills/
│   │   ├── payments/
│   │   ├── expenses/
│   │   └── reports/
│   ├── (tenant)/
│   │   ├── tenant/
│   │   ├── tenant/bills/
│   │   ├── tenant/payments/
│   │   └── tenant/reports/
│   └── api/
├── components/
│   ├── layout/
│   ├── rooms/
│   ├── tenants/
│   ├── bills/
│   └── ui/
├── lib/
│   ├── supabase/
│   ├── validations/
│   └── utils.ts
├── types/
├── public/
└── docs/
```

## 13. Validasi, Loading, Error, dan Empty State

Setiap halaman minimal punya:

- Loading skeleton saat data sedang diambil.
- Pesan error jika data gagal dimuat.
- Empty state jika belum ada data.
- Validasi form sebelum data dikirim.
- Konfirmasi untuk aksi penting seperti hapus atau tolak pembayaran.
- Toast sukses setelah data berhasil disimpan.

Contoh empty state:

- Kamar kosong data: "Belum ada kamar. Tambahkan kamar pertama untuk mulai mengelola kos."
- Tagihan kosong: "Belum ada tagihan untuk periode ini."
- Laporan kosong: "Tidak ada laporan kerusakan aktif."

## 14. Keamanan dan Privasi

Aturan penting:

- Penghuni tidak boleh melihat data penghuni lain.
- Bukti pembayaran hanya bisa dilihat pemilik dan penghuni pemilik bukti tersebut.
- File upload harus dibatasi tipe dan ukurannya.
- Data sensitif tidak ditampilkan di daftar umum.
- Semua aksi penting sebaiknya masuk ke `activity_logs`.
- Validasi dilakukan di frontend dan server.

## 15. Milestone Pengembangan

### Milestone 1 - PRD dan UI

Output:

- PRD aplikasi.
- Daftar halaman.
- Konsep visual.
- Flow pemilik dan penghuni.

Status: sedang disusun.

### Milestone 2 - Setup Project

Output:

- Project Next.js TypeScript.
- Tailwind CSS.
- Struktur folder.
- Halaman login awal.

### Milestone 3 - Database dan Auth

Output:

- Supabase project.
- Schema database awal.
- Login pemilik dan penghuni.
- Proteksi route.

### Milestone 4 - Modul Kamar dan Penghuni

Output:

- CRUD kamar.
- CRUD penghuni.
- Relasi penghuni ke kamar.

### Milestone 5 - Modul Tagihan dan Pembayaran

Output:

- Buat tagihan.
- Upload bukti.
- Verifikasi pembayaran.
- Status lunas/terlambat.

### Milestone 6 - Modul Pengeluaran dan Kerusakan

Output:

- Catat pengeluaran.
- Laporan kerusakan.
- Status pengerjaan.

### Milestone 7 - Polishing dan Deploy

Output:

- Responsive design.
- Testing.
- Security review.
- Deploy ke Vercel.

## 16. Acceptance Criteria MVP

MVP dianggap berhasil jika:

- Pemilik bisa login dan melihat dashboard.
- Pemilik bisa menambah, mengedit, dan melihat kamar.
- Pemilik bisa menambah penghuni dan menghubungkannya ke kamar.
- Penghuni bisa login ke portal sendiri.
- Penghuni bisa melihat tagihan miliknya.
- Penghuni bisa mengunggah bukti pembayaran.
- Pemilik bisa memverifikasi pembayaran.
- Pemilik bisa mencatat pengeluaran.
- Penghuni bisa membuat laporan kerusakan.
- Pemilik bisa mengubah status laporan kerusakan.
- Aplikasi nyaman dipakai di laptop dan HP.
- Data antar penghuni tidak bocor.

## 17. Catatan Keputusan Produk

- Fokus MVP adalah satu properti kos aktif agar scope tidak terlalu besar.
- Portal penghuni tetap dibuat sejak awal karena menjadi pembeda penting.
- Pembayaran belum otomatis agar MVP lebih cepat selesai dan lebih mudah diuji.
- Desain diarahkan seperti pusat kendali properti, bukan template dashboard biasa.
- Fitur WhatsApp, payment gateway, dan kontrak digital masuk fase setelah MVP.


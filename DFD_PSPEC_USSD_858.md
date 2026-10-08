# Analisis Layanan USSD *858# — DFD, PSPEC, dan Kode

> Sumber: slide tugas (menu utama *858#: 1 Transfer Pulsa, 2 Minta Pulsa, 3 Auto TP, 4 Delete Auto TP, 5 List Auto TP, 6 Cek Kupon Undian TP).
> Menu 1 meminta nomor tujuan (08xxxx / 628xxxx), lalu lanjut ke eksekusi dan notifikasi berhasil.
> Langkah **nominal** dan **konfirmasi** serta aturan bisnis (min/maks, biaya admin) adalah **asumsi** karena tidak ada di slide.

## Kamus Data singkat
| Nama | Isi |
|---|---|
| Kode_Dial | `*858#` |
| Pilihan_Menu | angka 1–6 |
| No_Tujuan | 08xxxx / 628xxxx |
| Nominal | angka rupiah |
| Konfirmasi | 1 = Ya, 2 = Tidak |
| D1 Data_Pelanggan | msisdn, saldo, status aktif |
| D2 Log_Transaksi | id, pengirim, penerima, nominal, biaya, status |

## 1. DFD Level 0 (Diagram Konteks)

```mermaid
flowchart LR
    P((0<br/>Sistem Layanan<br/>USSD *858#))
    U[Pelanggan Pengirim] -- "Kode_Dial, Pilihan_Menu,<br/>No_Tujuan, Nominal, Konfirmasi" --> P
    P -- "Tampilan Menu, Prompt,<br/>Hasil Transaksi" --> U
    P -- "SMS Notifikasi Pengirim" --> U
    P -- "SMS Notifikasi Penerima" --> R[Pelanggan Penerima]
```

## 2. DFD Level 1

```mermaid
flowchart TB
    U[Pelanggan Pengirim]
    R[Pelanggan Penerima]
    D1[(D1 Data Pelanggan)]
    D2[(D2 Log Transaksi)]

    P1((1.0<br/>Terima Dial &<br/>Tampilkan Menu))
    P2((2.0<br/>Proses<br/>Transfer Pulsa))
    P3((3.0<br/>Proses Menu Lain<br/>Minta/Auto TP/Kupon))
    P4((4.0<br/>Kirim Notifikasi))

    U -- Kode_Dial --> P1
    P1 -- Menu_Utama --> U
    U -- Pilihan_Menu --> P1
    P1 -- "Pilihan = 1" --> P2
    P1 -- "Pilihan = 2..6" --> P3
    U -- "No_Tujuan, Nominal, Konfirmasi" --> P2
    P2 -- "Prompt / Pesan Error / Hasil" --> U
    P2 <-- "cek & ubah saldo" --> D1
    P2 -- "catat transaksi" --> D2
    P2 -- "Data_Transaksi" --> P4
    P4 -- "SMS" --> U
    P4 -- "SMS" --> R
```

## 3. DFD Level 2 — Proses 2.0 Transfer Pulsa

```mermaid
flowchart TB
    U[Pelanggan Pengirim]
    D1[(D1 Data Pelanggan)]
    D2[(D2 Log Transaksi)]

    P21((2.1<br/>Validasi &<br/>Normalisasi Nomor))
    P22((2.2<br/>Validasi<br/>Nominal))
    P23((2.3<br/>Cek Kelayakan<br/>Transaksi))
    P24((2.4<br/>Minta<br/>Konfirmasi))
    P25((2.5<br/>Eksekusi<br/>Transfer))
    P4((4.0 Kirim Notifikasi))

    U -- No_Tujuan --> P21
    P21 -- "nomor tidak valid" --> U
    P21 -- No_Tujuan_628 --> P22
    U -- Nominal --> P22
    P22 -- "nominal tidak valid" --> U
    P22 -- "Nominal valid" --> P23
    D1 -- "status & saldo" --> P23
    P23 -- "ditolak (saldo kurang / nomor tak aktif)" --> U
    P23 -- "lolos" --> P24
    P24 -- "Ringkasan + 1.Ya 2.Tidak" --> U
    U -- Konfirmasi --> P24
    P24 -- "Ya" --> P25
    P24 -- "Tidak: dibatalkan" --> U
    P25 -- "debit/kredit saldo" --> D1
    P25 -- "Log" --> D2
    P25 -- "Hasil BERHASIL" --> U
    P25 -- Data_Transaksi --> P4
```

Catatan penyeimbangan (balancing): aliran masuk/keluar Level 2 sama dengan proses 2.0 di Level 1 (No_Tujuan, Nominal, Konfirmasi masuk; Prompt/Error/Hasil keluar; akses D1, D2; keluaran ke 4.0).

---

## 4. PSPEC (Structured English) — jalur: `*858#` → 1 Transfer Pulsa → eksekusi

**P1.0 Terima Dial & Tampilkan Menu**
```
BEGIN
  READ Kode_Dial
  IF Kode_Dial = "*858#" THEN
     DISPLAY Menu_Utama (1..6)
     READ Pilihan_Menu
     IF Pilihan_Menu = 1 THEN CALL P2.0
     ELSE IF Pilihan_Menu IN (2,3,4,5,6) THEN CALL P3.0
     ELSE DISPLAY "Pilihan salah"; END SESSION
  ELSE
     DISPLAY "Kode USSD tidak dikenal"; END SESSION
  ENDIF
END
```

**P2.1 Validasi & Normalisasi Nomor**
```
READ No_Tujuan
IF No_Tujuan MATCHES (08 + 8..11 digit) OR (628 + 8..11 digit) THEN
   IF No_Tujuan diawali "0" THEN No_Tujuan := "62" + No_Tujuan tanpa digit pertama
   PASS No_Tujuan ke P2.2
ELSE
   DISPLAY "Nomor tidak valid"; ULANGI input nomor
ENDIF
```

**P2.2 Validasi Nominal**
```
READ Nominal
IF Nominal bukan angka THEN DISPLAY "Nominal harus angka"; ULANGI
ELSE IF Nominal < 5.000 THEN DISPLAY "Minimum Rp5.000"; ULANGI
ELSE IF Nominal > 100.000 THEN DISPLAY "Maksimum Rp100.000"; ULANGI
ELSE PASS Nominal ke P2.3
```

**P2.3 Cek Kelayakan Transaksi**
```
READ Data_Pelanggan (pengirim, penerima) dari D1
IF No_Tujuan = No_Pengirim THEN REJECT "Tidak dapat transfer ke nomor sendiri"
ELSE IF penerima tidak terdaftar OR tidak aktif THEN REJECT "Nomor tujuan tidak aktif"
ELSE IF Saldo_Pengirim - (Nominal + Biaya_Admin) < 0 THEN REJECT "Pulsa tidak mencukupi"
ELSE PASS ke P2.4
ENDIF
```

**P2.4 Minta Konfirmasi**
```
DISPLAY "Transfer Rp[Nominal] ke [No_Tujuan], biaya Rp[Biaya_Admin]. 1.Ya 2.Tidak"
READ Konfirmasi
IF Konfirmasi = 1 THEN CALL P2.5
ELSE IF Konfirmasi = 2 THEN DISPLAY "Transaksi dibatalkan"; END SESSION
ELSE DISPLAY "Pilihan salah"; ULANGI konfirmasi
```

**P2.5 Eksekusi Transfer**
```
RE-CHECK kelayakan (P2.3)           -- saldo bisa berubah selama sesi
IF lolos THEN
   Saldo_Pengirim  := Saldo_Pengirim - Nominal - Biaya_Admin
   Saldo_Penerima  := Saldo_Penerima + Nominal
   WRITE Log_Transaksi (ID, pengirim, penerima, Nominal, Biaya, "SUCCESS") ke D2
   DISPLAY "Transfer pulsa berhasil. ID: [ID]"
   SEND Data_Transaksi ke P4.0
ELSE
   DISPLAY pesan error; END SESSION
ENDIF
```

**P4.0 Kirim Notifikasi**
```
SEND SMS ke pengirim: "Transfer Rp[Nominal] ke [No_Tujuan] berhasil. Sisa pulsa Rp[Saldo]. ID [ID]"
SEND SMS ke penerima: "Anda menerima pulsa Rp[Nominal] dari [No_Pengirim]. ID [ID]"
```

---

## 5. Kode
Lihat `ussd_858_transfer_pulsa.py` (Python 3, tanpa dependensi). Pemetaan: `dial()` = P1.0, `normalize_msisdn` = P2.1, `validate_amount` = P2.2, `check_eligibility` = P2.3, state `CONFIRM` = P2.4, `execute_transfer` = P2.5 + P4.0.
Untuk dikumpulkan: unggah ke GitHub (`git init`, `git add .`, `git commit`, `git push`).

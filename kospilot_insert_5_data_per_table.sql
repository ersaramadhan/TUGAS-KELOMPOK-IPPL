-- KosPilot - INSERT 5 data untuk setiap tabel
-- Target: MySQL 8.0+
-- Jalankan SETELAH seluruh 9 tabel berhasil dibuat.

USE kospilot;

-- =========================================================
-- 1. PROFILES
-- 2 owner dan 3 tenant yang memiliki akun aplikasi.
-- =========================================================
INSERT INTO profiles (id, full_name, email, role, phone) VALUES
(1, 'Andi Pratama', 'andi.pratama@kospilot.test', 'owner', '081234567801'),
(2, 'Siti Rahmawati', 'siti.rahmawati@kospilot.test', 'owner', '081234567802'),
(3, 'Budi Santoso', 'budi.santoso@kospilot.test', 'tenant', '081234567803'),
(4, 'Citra Lestari', 'citra.lestari@kospilot.test', 'tenant', '081234567804'),
(5, 'Dimas Saputra', 'dimas.saputra@kospilot.test', 'tenant', '081234567805');

-- =========================================================
-- 2. PROPERTIES
-- owner_id harus mengacu ke profiles dengan role owner.
-- =========================================================
INSERT INTO properties (id, owner_id, name, address, payment_account) VALUES
(1, 1, 'Kos Melati', 'Jl. Melati No. 10, Bandung', 'BCA 1234567890 a.n. Andi Pratama'),
(2, 1, 'Kos Anggrek', 'Jl. Anggrek No. 21, Bandung', 'BCA 1234567890 a.n. Andi Pratama'),
(3, 1, 'Kos Kenanga', 'Jl. Kenanga No. 8, Cimahi', 'BCA 1234567890 a.n. Andi Pratama'),
(4, 2, 'Kos Mawar', 'Jl. Mawar No. 15, Tasikmalaya', 'BRI 0987654321 a.n. Siti Rahmawati'),
(5, 2, 'Kos Flamboyan', 'Jl. Flamboyan No. 7, Banjar', 'BRI 0987654321 a.n. Siti Rahmawati');

-- =========================================================
-- 3. ROOMS
-- Setiap kamar terhubung ke satu properti.
-- =========================================================
INSERT INTO rooms
(id, property_id, name, floor, monthly_price, yearly_price, status, facilities, internal_note)
VALUES
(1, 1, 'A01', '1', 850000.00, 9600000.00, 'occupied', JSON_ARRAY('WiFi', 'AC', 'Kamar Mandi Dalam'), 'Kamar dekat pintu utama.'),
(2, 2, 'B01', '1', 900000.00, 10200000.00, 'occupied', JSON_ARRAY('WiFi', 'Kipas Angin', 'Kamar Mandi Dalam'), 'Kamar menghadap halaman.'),
(3, 3, 'C01', '2', 1000000.00, 11400000.00, 'occupied', JSON_ARRAY('WiFi', 'AC', 'Meja Belajar'), 'Kamar lantai dua.'),
(4, 4, 'D01', '1', 750000.00, 8400000.00, 'occupied', JSON_ARRAY('WiFi', 'Lemari', 'Kasur'), 'Kamar dekat dapur bersama.'),
(5, 5, 'E01', '2', 950000.00, 10800000.00, 'occupied', JSON_ARRAY('WiFi', 'AC', 'Balkon'), 'Kamar memiliki balkon kecil.');

-- =========================================================
-- 4. TENANTS
-- active_room_id TIDAK diisi karena merupakan generated column.
-- Tenant 1-3 terhubung ke akun profiles.
-- Tenant 4-5 belum memiliki akun aplikasi, sehingga profile_id NULL.
-- =========================================================
INSERT INTO tenants
(id, profile_id, property_id, room_id, full_name, email, phone, identity_number,
 emergency_contact, move_in_date, rent_type, status)
VALUES
(1, 3, 1, 1, 'Budi Santoso', 'budi.santoso@kospilot.test', '081234567803', '3273010101010001', 'Rina Santoso - 081311110001', '2026-01-10', 'monthly', 'active'),
(2, 4, 2, 2, 'Citra Lestari', 'citra.lestari@kospilot.test', '081234567804', '3273010202020002', 'Agus Lestari - 081311110002', '2026-02-15', 'monthly', 'active'),
(3, 5, 3, 3, 'Dimas Saputra', 'dimas.saputra@kospilot.test', '081234567805', '3273010303030003', 'Nina Saputra - 081311110003', '2026-03-01', 'yearly', 'active'),
(4, NULL, 4, 4, 'Fajar Nugroho', 'fajar.nugroho@kospilot.test', '081234567806', '3273010404040004', 'Dewi Nugroho - 081311110004', '2026-04-20', 'monthly', 'active'),
(5, NULL, 5, 5, 'Gita Permata', 'gita.permata@kospilot.test', '081234567807', '3273010505050005', 'Rudi Permata - 081311110005', '2026-05-05', 'monthly', 'active');

-- =========================================================
-- 5. BILLS
-- Setiap tagihan mengacu ke tenant dan kamar yang sesuai.
-- =========================================================
INSERT INTO bills
(id, tenant_id, room_id, period, bill_type, amount, due_date, status, correction_note)
VALUES
(1, 1, 1, 'Oktober 2026', 'monthly', 850000.00, '2026-10-10', 'paid', NULL),
(2, 2, 2, 'Oktober 2026', 'monthly', 900000.00, '2026-10-10', 'paid', NULL),
(3, 3, 3, 'Maret 2026 - Februari 2027', 'yearly', 11400000.00, '2026-03-10', 'paid', NULL),
(4, 4, 4, 'Oktober 2026', 'monthly', 750000.00, '2026-10-10', 'pending_verification', NULL),
(5, 5, 5, 'Oktober 2026', 'monthly', 950000.00, '2026-10-10', 'overdue', 'Pembayaran melewati tanggal jatuh tempo.');

-- =========================================================
-- 6. PAYMENTS
-- Setiap pembayaran mengacu ke satu bill.
-- =========================================================
INSERT INTO payments
(id, bill_id, paid_at, amount, method, proof_path, note, verification_status)
VALUES
(1, 1, '2026-10-05 09:15:00', 850000.00, 'Transfer Bank', 'proofs/payment_001.jpg', 'Pembayaran sewa Oktober.', 'approved'),
(2, 2, '2026-10-06 13:20:00', 900000.00, 'QRIS', 'proofs/payment_002.jpg', 'Pembayaran diterima melalui QRIS.', 'approved'),
(3, 3, '2026-03-07 10:05:00', 11400000.00, 'Transfer Bank', 'proofs/payment_003.jpg', 'Pembayaran sewa tahunan.', 'approved'),
(4, 4, '2026-10-09 16:40:00', 750000.00, 'Transfer Bank', 'proofs/payment_004.jpg', 'Menunggu verifikasi pemilik kos.', 'pending'),
(5, 5, '2026-10-18 11:30:00', 950000.00, 'Transfer Bank', 'proofs/payment_005.jpg', 'Bukti transfer kurang jelas.', 'rejected');

-- =========================================================
-- 7. EXPENSES
-- Lima pengeluaran operasional untuk lima properti.
-- =========================================================
INSERT INTO expenses
(id, property_id, expense_date, category, amount, description, proof_path)
VALUES
(1, 1, '2026-10-03', 'electricity', 650000.00, 'Pembayaran listrik Kos Melati bulan Oktober.', 'proofs/expense_001.jpg'),
(2, 2, '2026-10-04', 'water', 250000.00, 'Pembayaran air Kos Anggrek bulan Oktober.', 'proofs/expense_002.jpg'),
(3, 3, '2026-10-05', 'internet', 450000.00, 'Biaya internet Kos Kenanga bulan Oktober.', 'proofs/expense_003.jpg'),
(4, 4, '2026-10-08', 'maintenance', 300000.00, 'Perawatan pompa air Kos Mawar.', 'proofs/expense_004.jpg'),
(5, 5, '2026-10-12', 'cleaning', 200000.00, 'Jasa kebersihan area bersama Kos Flamboyan.', 'proofs/expense_005.jpg');

-- =========================================================
-- 8. MAINTENANCE_REPORTS
-- Laporan tenant terhadap kamar yang ditempatinya.
-- =========================================================
INSERT INTO maintenance_reports
(id, tenant_id, room_id, title, description, photo_path, priority, status, owner_note)
VALUES
(1, 1, 1, 'AC kurang dingin', 'AC tetap menyala tetapi udara yang keluar kurang dingin.', 'maintenance/report_001.jpg', 'medium', 'in_progress', 'Teknisi dijadwalkan datang.'),
(2, 2, 2, 'Keran kamar mandi bocor', 'Keran wastafel menetes terus meskipun sudah ditutup.', 'maintenance/report_002.jpg', 'low', 'done', 'Keran telah diganti.'),
(3, 3, 3, 'Lampu kamar mati', 'Lampu utama kamar tidak dapat dinyalakan.', 'maintenance/report_003.jpg', 'medium', 'done', 'Lampu dan fitting telah diganti.'),
(4, 4, 4, 'Saluran air tersumbat', 'Air di kamar mandi mengalir sangat lambat.', 'maintenance/report_004.jpg', 'high', 'new', NULL),
(5, 5, 5, 'Pintu balkon sulit dikunci', 'Kunci pintu balkon macet dan sulit diputar.', 'maintenance/report_005.jpg', 'high', 'in_progress', 'Kunci pengganti sedang disiapkan.');

-- =========================================================
-- 9. ACTIVITY_LOGS
-- Catatan aktivitas yang berkaitan dengan properti dan pengguna.
-- =========================================================
INSERT INTO activity_logs
(id, property_id, actor_id, action, metadata)
VALUES
(1, 1, 1, 'Menambahkan data kamar A01', JSON_OBJECT('room_id', 1, 'room_name', 'A01')),
(2, 2, 1, 'Memverifikasi pembayaran tenant', JSON_OBJECT('bill_id', 2, 'payment_id', 2, 'status', 'approved')),
(3, 3, 5, 'Mengirim laporan maintenance', JSON_OBJECT('maintenance_report_id', 3, 'room_id', 3)),
(4, 4, 2, 'Mencatat pengeluaran maintenance', JSON_OBJECT('expense_id', 4, 'amount', 300000)),
(5, 5, 2, 'Memperbarui status laporan maintenance', JSON_OBJECT('maintenance_report_id', 5, 'status', 'in_progress'));

-- =========================================================
-- VERIFIKASI JUMLAH DATA
-- Setiap tabel harus menghasilkan total_data = 5.
-- =========================================================
SELECT 'profiles' AS nama_tabel, COUNT(*) AS total_data FROM profiles
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'maintenance_reports', COUNT(*) FROM maintenance_reports
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM activity_logs;

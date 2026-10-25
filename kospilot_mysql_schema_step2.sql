-- KosPilot - Versi XAMPP / MariaDB
-- Target: MySQL 8.0+ / MariaDB XAMPP
-- Tahap 2: CREATE DATABASE dan CREATE TABLE

DROP DATABASE IF EXISTS kospilot;

CREATE DATABASE IF NOT EXISTS kospilot
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kospilot;

-- 1. Data pengguna aplikasi: pemilik kos dan penghuni.
CREATE TABLE IF NOT EXISTS profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    role ENUM('owner', 'tenant') NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Properti/kos yang dimiliki oleh owner.
CREATE TABLE IF NOT EXISTS properties (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    payment_account VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_properties_owner
        FOREIGN KEY (owner_id) REFERENCES profiles(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. Kamar yang berada di dalam suatu properti.
CREATE TABLE IF NOT EXISTS rooms (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id INT UNSIGNED NOT NULL,
    name VARCHAR(50) NOT NULL,
    floor VARCHAR(20),
    monthly_price DECIMAL(12,2) NOT NULL,
    yearly_price DECIMAL(12,2),
    status ENUM('vacant', 'occupied', 'maintenance', 'inactive') NOT NULL,
    facilities JSON,
    internal_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_rooms_property_name UNIQUE (property_id, name),
    CONSTRAINT chk_rooms_monthly_price CHECK (monthly_price > 0),
    CONSTRAINT chk_rooms_yearly_price CHECK (yearly_price IS NULL OR yearly_price > 0),
    CONSTRAINT fk_rooms_property
        FOREIGN KEY (property_id) REFERENCES properties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. Data penghuni dan kamar yang ditempatinya. (REVISI XAMPP)
CREATE TABLE IF NOT EXISTS tenants (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id INT UNSIGNED,
    property_id INT UNSIGNED NOT NULL,
    room_id INT UNSIGNED NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    identity_number VARCHAR(50),
    emergency_contact VARCHAR(100),
    move_in_date DATE NOT NULL,
    rent_type ENUM('monthly', 'yearly') NOT NULL,
    status ENUM('active', 'leaving', 'left') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tenants_profile
        FOREIGN KEY (profile_id) REFERENCES profiles(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_tenants_property
        FOREIGN KEY (property_id) REFERENCES properties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_tenants_room
        FOREIGN KEY (room_id) REFERENCES rooms(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. Tagihan sewa milik penghuni.
CREATE TABLE IF NOT EXISTS bills (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT UNSIGNED NOT NULL,
    room_id INT UNSIGNED NOT NULL,
    period VARCHAR(30) NOT NULL,
    bill_type ENUM('monthly', 'yearly') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('draft', 'unpaid', 'pending_verification', 'paid', 'overdue') NOT NULL,
    correction_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_bills_amount CHECK (amount > 0),
    CONSTRAINT fk_bills_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_bills_room
        FOREIGN KEY (room_id) REFERENCES rooms(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. Pembayaran untuk suatu tagihan.
CREATE TABLE IF NOT EXISTS payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bill_id INT UNSIGNED NOT NULL,
    paid_at DATETIME NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    proof_path VARCHAR(255),
    note TEXT,
    verification_status ENUM('pending', 'approved', 'rejected') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT fk_payments_bill
        FOREIGN KEY (bill_id) REFERENCES bills(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7. Pengeluaran operasional properti.
CREATE TABLE IF NOT EXISTS expenses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id INT UNSIGNED NOT NULL,
    expense_date DATE NOT NULL,
    category ENUM(
        'electricity', 'water', 'internet', 'maintenance',
        'cleaning', 'repair', 'other'
    ) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    proof_path VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_expenses_amount CHECK (amount > 0),
    CONSTRAINT fk_expenses_property
        FOREIGN KEY (property_id) REFERENCES properties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. Laporan perawatan/kerusakan dari penghuni.
CREATE TABLE IF NOT EXISTS maintenance_reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT UNSIGNED NOT NULL,
    room_id INT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    photo_path VARCHAR(255),
    priority ENUM('low', 'medium', 'high') NOT NULL,
    status ENUM('new', 'in_progress', 'done', 'rejected') NOT NULL,
    owner_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_maintenance_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_maintenance_room
        FOREIGN KEY (room_id) REFERENCES rooms(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 9. Catatan aktivitas penting dalam sistem.
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id INT UNSIGNED NOT NULL,
    actor_id INT UNSIGNED,
    action VARCHAR(255) NOT NULL,
    metadata JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_property
        FOREIGN KEY (property_id) REFERENCES properties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_activity_actor
        FOREIGN KEY (actor_id) REFERENCES profiles(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

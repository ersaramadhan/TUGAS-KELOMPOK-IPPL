"""
Simulasi layanan USSD *858#  ->  Menu 1: Transfer Pulsa  (sampai eksekusi)

Jalur yang dikerjakan:
  Dial *858#  ->  pilih 1 (Transfer Pulsa)  ->  input nomor tujuan
  ->  input nominal  ->  konfirmasi  ->  eksekusi  ->  notifikasi

Catatan: aturan bisnis (nominal minimum/maksimum, biaya admin, format nomor)
adalah ASUMSI untuk keperluan tugas, bukan aturan resmi operator.
Jalankan:  python ussd_858_transfer_pulsa.py
Tes     :  python ussd_858_transfer_pulsa.py --test
"""
import re
import sys
from dataclasses import dataclass, field

# ------------------------------------------------------------------ KONFIGURASI
MIN_TRANSFER = 5_000
MAX_TRANSFER = 100_000
ADMIN_FEE = 1_000
MIN_SISA_SALDO = 0          # saldo pengirim setelah transfer tidak boleh < ini

MAIN_MENU = (
    "1.Transfer Pulsa\n"
    "2.Minta Pulsa\n"
    "3.Auto TP\n"
    "4.Delete Auto TP\n"
    "5.List Auto TP\n"
    "6.Cek Kupon Undian TP"
)


# ------------------------------------------------------------------ DATA STORE (D1)
@dataclass
class Subscriber:
    msisdn: str
    balance: int
    active: bool = True


@dataclass
class Database:
    """D1 = Data Pelanggan (saldo), D2 = Log Transaksi."""
    subscribers: dict = field(default_factory=dict)
    transactions: list = field(default_factory=list)
    sms_outbox: list = field(default_factory=list)

    def get(self, msisdn):
        return self.subscribers.get(msisdn)


# ------------------------------------------------------------------ PROSES 2.x
def normalize_msisdn(raw: str):
    """P2.1  Validasi & normalisasi nomor. 08xxx / 628xxx -> 628xxx. None jika invalid."""
    raw = raw.strip()
    if not re.fullmatch(r"(08\d{8,11}|628\d{8,11})", raw):
        return None
    return "62" + raw[1:] if raw.startswith("0") else raw


def validate_amount(raw: str):
    """P2.2  Validasi nominal. Return (nominal, pesan_error)."""
    if not raw.strip().isdigit():
        return None, "Nominal harus berupa angka."
    amount = int(raw)
    if amount < MIN_TRANSFER:
        return None, f"Nominal minimum Rp{MIN_TRANSFER:,}.".replace(",", ".")
    if amount > MAX_TRANSFER:
        return None, f"Nominal maksimum Rp{MAX_TRANSFER:,}.".replace(",", ".")
    return amount, None


def check_eligibility(db: Database, sender: str, dest: str, amount: int):
    """P2.3  Cek kelayakan transaksi. Return pesan_error / None."""
    s, d = db.get(sender), db.get(dest)
    if dest == sender:
        return "Tidak dapat transfer ke nomor sendiri."
    if d is None or not d.active:
        return "Nomor tujuan tidak terdaftar / tidak aktif."
    if s is None or not s.active:
        return "Nomor Anda tidak aktif."
    if s.balance - (amount + ADMIN_FEE) < MIN_SISA_SALDO:
        return "Pulsa Anda tidak mencukupi."
    return None


def execute_transfer(db: Database, sender: str, dest: str, amount: int):
    """P2.4  Eksekusi: debit pengirim, kredit penerima, catat log, kirim SMS."""
    s, d = db.get(sender), db.get(dest)
    s.balance -= amount + ADMIN_FEE
    d.balance += amount
    trx_id = f"TP{len(db.transactions) + 1:06d}"
    db.transactions.append(
        dict(id=trx_id, from_=sender, to=dest, amount=amount, fee=ADMIN_FEE, status="SUCCESS")
    )
    db.sms_outbox.append((sender, f"Transfer pulsa Rp{amount:,} ke {dest} berhasil. "
                                  f"Biaya Rp{ADMIN_FEE:,}. Sisa pulsa Rp{s.balance:,}. ID {trx_id}"))
    db.sms_outbox.append((dest, f"Anda menerima pulsa Rp{amount:,} dari {sender}. ID {trx_id}"))
    return trx_id


# ------------------------------------------------------------------ SESI USSD (P1 + P2)
class USSDSession:
    """Mesin status (state machine) satu sesi USSD."""

    def __init__(self, db: Database, msisdn: str):
        self.db, self.msisdn = db, msisdn
        self.state = "START"
        self.dest = None
        self.amount = None

    def dial(self, code: str) -> str:
        """P1  Terima kode dial & tampilkan menu utama."""
        if code != "*858#":
            self.state = "END"
            return "Kode USSD tidak dikenal."
        self.state = "MAIN_MENU"
        return MAIN_MENU

    def reply(self, text: str) -> str:
        text = text.strip()
        if self.state == "MAIN_MENU":
            if text == "1":
                self.state = "ASK_DEST"
                return "Silakan masukkan nomor tujuan Transfer Pulsa : (contoh: 08xxxx atau 628xxxx)"
            self.state = "END"
            return "Menu belum tersedia pada simulasi ini." if text in "23456" and text else "Pilihan salah."

        if self.state == "ASK_DEST":
            dest = normalize_msisdn(text)
            if dest is None:
                return "Nomor tidak valid. Masukkan nomor tujuan (contoh: 08xxxx atau 628xxxx)"
            self.dest, self.state = dest, "ASK_AMOUNT"
            return f"Masukkan nominal pulsa yang akan ditransfer (Rp{MIN_TRANSFER:,}-Rp{MAX_TRANSFER:,})".replace(",", ".")

        if self.state == "ASK_AMOUNT":
            amount, err = validate_amount(text)
            if err:
                return err + " Masukkan nominal kembali."
            err = check_eligibility(self.db, self.msisdn, self.dest, amount)
            if err:
                self.state = "END"
                return err
            self.amount, self.state = amount, "CONFIRM"
            return (f"Transfer Rp{amount:,} ke {self.dest}. Biaya Rp{ADMIN_FEE:,}.\n"
                    "1.Ya\n2.Tidak").replace(",", ".")

        if self.state == "CONFIRM":
            if text == "1":
                # cek ulang sebelum eksekusi (saldo bisa berubah saat sesi berjalan)
                err = check_eligibility(self.db, self.msisdn, self.dest, self.amount)
                self.state = "END"
                if err:
                    return err
                trx = execute_transfer(self.db, self.msisdn, self.dest, self.amount)
                return f"Transfer pulsa Rp{self.amount:,} ke {self.dest} BERHASIL. ID: {trx}".replace(",", ".")
            if text == "2":
                self.state = "END"
                return "Transaksi dibatalkan."
            return "Pilihan salah.\n1.Ya\n2.Tidak"

        return "Sesi berakhir."


# ------------------------------------------------------------------ DEMO & TEST
def make_db():
    db = Database()
    db.subscribers["6281111111111"] = Subscriber("6281111111111", 50_000)
    db.subscribers["6282222222222"] = Subscriber("6282222222222", 2_000)
    return db


def run_tests():
    db = make_db()
    me = "6281111111111"

    assert normalize_msisdn("081234567890") == "6281234567890"
    assert normalize_msisdn("6281234567890") == "6281234567890"
    assert normalize_msisdn("12345") is None
    assert validate_amount("abc")[0] is None
    assert validate_amount("1000")[0] is None
    assert validate_amount("10000") == (10000, None)

    s = USSDSession(db, me); s.dial("*858#")
    s.reply("1"); s.reply("082222222222"); s.reply("10000"); out = s.reply("1")
    assert "BERHASIL" in out
    assert db.get(me).balance == 50_000 - 10_000 - ADMIN_FEE
    assert db.get("6282222222222").balance == 12_000

    s = USSDSession(db, me); s.dial("*858#")          # saldo tidak cukup
    s.reply("1"); s.reply("082222222222")
    assert "tidak mencukupi" in s.reply("100000")

    s = USSDSession(db, me); s.dial("*858#")          # dibatalkan
    s.reply("1"); s.reply("082222222222"); s.reply("5000")
    assert "dibatalkan" in s.reply("2")
    print("Semua tes lulus.")


def interactive():
    db = make_db()
    me = "6281111111111"
    print(f"[Simulasi] Nomor Anda {me}, pulsa Rp{db.get(me).balance}. "
          "Nomor tujuan uji: 082222222222")
    code = input("Dial: ")
    s = USSDSession(db, me)
    print("\n" + s.dial(code))
    while s.state != "END" and s.state != "START":
        print("\n" + s.reply(input("> ")))
    for to, msg in db.sms_outbox:
        print(f"\n[SMS ke {to}] {msg}")


if __name__ == "__main__":
    run_tests() if "--test" in sys.argv else interactive()

import { compareNaturalText, formatMoney } from "@/lib/dashboard";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ModuleMetric = {
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "amber" | "rose" | "slate";
};

type ModuleRow = {
  id?: string;
  title: string;
  meta: string;
  status: string;
  amount?: string;
};

type OwnerModuleData = {
  metrics: ModuleMetric[];
  rows: ModuleRow[];
  source: "supabase";
  sourceReason?: string;
  rooms?: OwnerRoomRecord[];
  tenants?: OwnerTenantRecord[];
  bills?: OwnerBillRecord[];
  payments?: OwnerPaymentRecord[];
  expenses?: OwnerExpenseRecord[];
  maintenanceReports?: OwnerMaintenanceReportRecord[];
  tenantCandidates?: OwnerTenantCandidateRecord[];
};

export type OwnerRoomRecord = {
  id: string;
  name: string;
  floor: string | null;
  monthly_price: number;
  yearly_price: number | null;
  status: "vacant" | "occupied" | "maintenance" | "inactive";
  internal_note: string | null;
};

export type OwnerTenantRecord = {
  id: string;
  profile_id?: string | null;
  property_id: string;
  room_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  emergency_contact: string | null;
  move_in_date: string;
  rent_type: "monthly" | "yearly";
  status: "active" | "leaving" | "left";
  rooms:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

export type OwnerTenantCandidateRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
};

export type OwnerBillRecord = {
  id: string;
  tenant_id: string;
  room_id: string;
  period: string;
  bill_type: "monthly" | "yearly";
  amount: number;
  due_date: string;
  status: "draft" | "unpaid" | "pending_verification" | "paid" | "overdue";
  correction_note: string | null;
  tenants:
    | {
        full_name: string;
      }
    | {
        full_name: string;
      }[]
    | null;
  rooms:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

export type OwnerPaymentRecord = {
  id: string;
  bill_id: string;
  paid_at: string;
  amount: number;
  method: string;
  proof_path: string | null;
  proof_url?: string | null;
  note: string | null;
  verification_status: "pending" | "approved" | "rejected";
  bills:
    | {
        id: string;
        tenant_id: string;
        room_id: string;
        period: string;
        amount: number;
        status: OwnerBillRecord["status"];
        tenants:
          | {
              full_name: string;
            }
          | {
              full_name: string;
            }[]
          | null;
        rooms:
          | {
              name: string;
            }
          | {
              name: string;
            }[]
          | null;
      }
    | {
        id: string;
        tenant_id: string;
        room_id: string;
        period: string;
        amount: number;
        status: OwnerBillRecord["status"];
        tenants:
          | {
              full_name: string;
            }
          | {
              full_name: string;
            }[]
          | null;
        rooms:
          | {
              name: string;
            }
          | {
              name: string;
            }[]
          | null;
      }[]
    | null;
};

export type OwnerExpenseRecord = {
  id: string;
  property_id: string;
  expense_date: string;
  category:
    | "electricity"
    | "water"
    | "internet"
    | "maintenance"
    | "cleaning"
    | "repair"
    | "other";
  amount: number;
  description: string;
  proof_path: string | null;
};

export type OwnerMaintenanceReportRecord = {
  id: string;
  tenant_id: string;
  room_id: string;
  title: string;
  description: string;
  photo_path: string | null;
  priority: "low" | "medium" | "high";
  status: "new" | "in_progress" | "done" | "rejected";
  owner_note: string | null;
  created_at: string;
  tenants:
    | {
        full_name: string;
      }
    | {
        full_name: string;
      }[]
    | null;
  rooms:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

const roomStatusLabels: Record<OwnerRoomRecord["status"], string> = {
  vacant: "Kosong",
  occupied: "Terisi",
  maintenance: "Perbaikan",
  inactive: "Nonaktif"
};

const tenantStatusLabels: Record<OwnerTenantRecord["status"], string> = {
  active: "Aktif",
  leaving: "Akan keluar",
  left: "Sudah keluar"
};

const billStatusLabels: Record<OwnerBillRecord["status"], string> = {
  draft: "Draft",
  unpaid: "Belum lunas",
  pending_verification: "Menunggu verifikasi",
  paid: "Lunas",
  overdue: "Terlambat"
};

const paymentStatusLabels: Record<OwnerPaymentRecord["verification_status"], string> = {
  pending: "Menunggu verifikasi",
  approved: "Terverifikasi",
  rejected: "Ditolak"
};

const expenseCategoryLabels: Record<OwnerExpenseRecord["category"], string> = {
  electricity: "Listrik",
  water: "Air",
  internet: "Internet",
  maintenance: "Perawatan",
  cleaning: "Kebersihan",
  repair: "Perbaikan",
  other: "Lainnya"
};

const reportPriorityLabels: Record<
  OwnerMaintenanceReportRecord["priority"],
  string
> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi"
};

const reportStatusLabels: Record<
  OwnerMaintenanceReportRecord["status"],
  string
> = {
  new: "Baru",
  in_progress: "Sedang diproses",
  done: "Selesai",
  rejected: "Ditolak"
};

function getPaymentBill(payment: OwnerPaymentRecord) {
  if (Array.isArray(payment.bills)) {
    return payment.bills[0] ?? null;
  }

  return payment.bills;
}

function getPaymentTenantName(payment: OwnerPaymentRecord) {
  const bill = getPaymentBill(payment);

  if (Array.isArray(bill?.tenants)) {
    return bill.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return bill?.tenants?.full_name ?? "Tanpa penghuni";
}

function getPaymentRoomName(payment: OwnerPaymentRecord) {
  const bill = getPaymentBill(payment);

  if (Array.isArray(bill?.rooms)) {
    return bill.rooms[0]?.name ?? "-";
  }

  return bill?.rooms?.name ?? "-";
}

async function getPaymentProofSignedUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  proofPath: string | null
) {
  if (!proofPath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(proofPath, 60 * 10);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

function getReportTenantName(report: OwnerMaintenanceReportRecord) {
  if (Array.isArray(report.tenants)) {
    return report.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return report.tenants?.full_name ?? "Tanpa penghuni";
}

function getReportRoomName(report: OwnerMaintenanceReportRecord) {
  if (Array.isArray(report.rooms)) {
    return report.rooms[0]?.name ?? "-";
  }

  return report.rooms?.name ?? "-";
}

function emptySupabaseRooms(sourceReason?: string): OwnerModuleData {
  return {
    source: "supabase",
    sourceReason,
    rooms: [],
    metrics: [
      {
        label: "Total kamar",
        value: "0",
        note: "Belum ada kamar",
        tone: "slate"
      },
      {
        label: "Terisi",
        value: "0",
        note: "0% okupansi",
        tone: "slate"
      },
      {
        label: "Kosong",
        value: "0",
        note: "Tambahkan kamar pertama",
        tone: "amber"
      },
      {
        label: "Perbaikan",
        value: "0",
        note: "Tidak ada",
        tone: "emerald"
      }
    ],
    rows: []
  };
}

function emptySupabaseTenants(sourceReason?: string): OwnerModuleData {
  return {
    source: "supabase",
    sourceReason,
    tenants: [],
    tenantCandidates: [],
    metrics: [
      {
        label: "Aktif",
        value: "0",
        note: "Belum ada penghuni",
        tone: "slate"
      },
      {
        label: "Belum pilih kamar",
        value: "0",
        note: "Tidak ada antrean",
        tone: "emerald"
      },
      {
        label: "Sewa bulanan",
        value: "0",
        note: "Belum ada sewa bulanan",
        tone: "slate"
      },
      {
        label: "Sewa tahunan",
        value: "0",
        note: "Belum ada sewa tahunan",
        tone: "slate"
      }
    ],
    rows: []
  };
}

function emptySupabaseBills(sourceReason?: string): OwnerModuleData {
  return {
    source: "supabase",
    sourceReason,
    bills: [],
    metrics: [
      {
        label: "Belum lunas",
        value: formatMoney(0),
        note: "0 tagihan aktif",
        tone: "emerald"
      },
      {
        label: "Menunggu verifikasi",
        value: "0",
        note: "Belum ada bukti masuk",
        tone: "slate"
      },
      {
        label: "Lunas",
        value: "0",
        note: "Belum ada tagihan selesai",
        tone: "slate"
      },
      {
        label: "Terlambat",
        value: "0",
        note: "Belum ada lewat tempo",
        tone: "emerald"
      }
    ],
    rows: []
  };
}

function emptySupabasePayments(sourceReason?: string): OwnerModuleData {
  return {
    source: "supabase",
    sourceReason,
    payments: [],
    metrics: [
      {
        label: "Masuk bulan ini",
        value: formatMoney(0),
        note: "0 pembayaran tercatat",
        tone: "slate"
      },
      {
        label: "Perlu verifikasi",
        value: "0",
        note: "Belum ada bukti masuk",
        tone: "slate"
      },
      {
        label: "Ditolak",
        value: "0",
        note: "Tidak ada koreksi",
        tone: "emerald"
      },
      {
        label: "Terverifikasi",
        value: "0",
        note: "Belum ada pembayaran disetujui",
        tone: "slate"
      }
    ],
    rows: []
  };
}

function emptySupabaseExpenses(sourceReason?: string): OwnerModuleData {
  return {
    source: "supabase",
    sourceReason,
    expenses: [],
    metrics: [
      {
        label: "Bulan ini",
        value: formatMoney(0),
        note: "0 transaksi biaya",
        tone: "slate"
      },
      {
        label: "Terbesar",
        value: "-",
        note: "Belum ada kategori",
        tone: "slate"
      },
      {
        label: "Maintenance",
        value: formatMoney(0),
        note: "Belum ada perawatan",
        tone: "slate"
      },
      {
        label: "Total tercatat",
        value: formatMoney(0),
        note: "Belum ada pengeluaran",
        tone: "emerald"
      }
    ],
    rows: []
  };
}

function emptySupabaseMaintenanceReports(
  sourceReason?: string
): OwnerModuleData {
  return {
    source: "supabase",
    sourceReason,
    maintenanceReports: [],
    metrics: [
      {
        label: "Aktif",
        value: "0",
        note: "Tidak ada laporan aktif",
        tone: "emerald"
      },
      {
        label: "Urgent",
        value: "0",
        note: "Tidak ada prioritas tinggi",
        tone: "emerald"
      },
      {
        label: "Diproses",
        value: "0",
        note: "Belum ada pekerjaan berjalan",
        tone: "slate"
      },
      {
        label: "Selesai",
        value: "0",
        note: "Belum ada laporan selesai",
        tone: "slate"
      }
    ],
    rows: []
  };
}

export async function getOwnerRoomsData(): Promise<OwnerModuleData> {
  if (!hasSupabaseConfig()) {
    return emptySupabaseRooms("env Supabase belum terbaca");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("rooms")
      .select("id,name,floor,monthly_price,yearly_price,status,internal_note")
      .order("name");

    if (error) {
      return emptySupabaseRooms(
        `${error.message}; session=${user?.email ?? "tidak ada"}`
      );
    }

    if (!data?.length) {
      return emptySupabaseRooms(
        `Belum ada kamar di Supabase; session=${
          user?.email ?? "tidak ada"
        }`
      );
    }

    const rooms = (data as OwnerRoomRecord[]).sort((firstRoom, secondRoom) =>
      compareNaturalText(firstRoom.name, secondRoom.name)
    );
    const occupied = rooms.filter((room) => room.status === "occupied").length;
    const vacant = rooms.filter((room) => room.status === "vacant").length;
    const maintenance = rooms.filter(
      (room) => room.status === "maintenance"
    ).length;

    return {
      source: "supabase",
      rooms,
      metrics: [
        {
          label: "Total kamar",
          value: `${rooms.length}`,
          note: "Dari database",
          tone: "slate"
        },
        {
          label: "Terisi",
          value: `${occupied}`,
          note: `${Math.round((occupied / rooms.length) * 100)}% okupansi`,
          tone: "emerald"
        },
        {
          label: "Kosong",
          value: `${vacant}`,
          note: "Siap dipasarkan",
          tone: "amber"
        },
        {
          label: "Perbaikan",
          value: `${maintenance}`,
          note: maintenance ? "Butuh tindakan" : "Tidak ada",
          tone: maintenance ? "rose" : "emerald"
        }
      ],
      rows: rooms.map((room) => ({
        id: room.id,
        title: `Kamar ${room.name}`,
        meta: `${room.floor ?? "Tanpa lantai"} - ${
          room.internal_note ?? "Data database"
        } - ${formatMoney(room.monthly_price)} / bulan`,
        status: roomStatusLabels[room.status]
      }))
    };
  } catch {
    return emptySupabaseRooms("fetch Supabase gagal");
  }
}

export async function getOwnerMaintenanceReportsData(): Promise<OwnerModuleData> {
  if (!hasSupabaseConfig()) {
    return emptySupabaseMaintenanceReports("env Supabase belum terbaca");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("maintenance_reports")
      .select(
        "id,tenant_id,room_id,title,description,photo_path,priority,status,owner_note,created_at,tenants(full_name),rooms(name)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return emptySupabaseMaintenanceReports(
        `${error.message}; session=${user?.email ?? "tidak ada"}`
      );
    }

    if (!data?.length) {
      return emptySupabaseMaintenanceReports(
        `Belum ada laporan kerusakan di Supabase; session=${
          user?.email ?? "tidak ada"
        }`
      );
    }

    const maintenanceReports = data as unknown as OwnerMaintenanceReportRecord[];
    const activeReports = maintenanceReports.filter((report) =>
      ["new", "in_progress"].includes(report.status)
    );
    const highPriority = maintenanceReports.filter(
      (report) => report.priority === "high" && report.status !== "done"
    ).length;
    const inProgressReports = maintenanceReports.filter(
      (report) => report.status === "in_progress"
    );
    const doneCount = maintenanceReports.filter(
      (report) => report.status === "done"
    ).length;

    return {
      source: "supabase",
      maintenanceReports,
      metrics: [
        {
          label: "Aktif",
          value: `${activeReports.length}`,
          note: activeReports.length ? "Butuh tindakan" : "Tidak ada laporan aktif",
          tone: activeReports.length ? "amber" : "emerald"
        },
        {
          label: "Urgent",
          value: `${highPriority}`,
          note: highPriority ? "Prioritas tinggi" : "Tidak ada prioritas tinggi",
          tone: highPriority ? "rose" : "emerald"
        },
        {
          label: "Diproses",
          value: `${inProgressReports.length}`,
          note: inProgressReports[0]
            ? `Kamar ${getReportRoomName(inProgressReports[0])}`
            : "Belum ada pekerjaan berjalan",
          tone: inProgressReports.length ? "slate" : "emerald"
        },
        {
          label: "Selesai",
          value: `${doneCount}`,
          note: "Laporan selesai",
          tone: "emerald"
        }
      ],
      rows: maintenanceReports.map((report) => ({
        id: report.id,
        title: report.title,
        meta: `Kamar ${getReportRoomName(report)} - ${getReportTenantName(
          report
        )} - ${reportPriorityLabels[report.priority]}`,
        status: reportStatusLabels[report.status]
      }))
    };
  } catch {
    return emptySupabaseMaintenanceReports("fetch Supabase gagal");
  }
}

export async function getOwnerExpensesData(): Promise<OwnerModuleData> {
  if (!hasSupabaseConfig()) {
    return emptySupabaseExpenses("env Supabase belum terbaca");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("expenses")
      .select(
        "id,property_id,expense_date,category,amount,description,proof_path"
      )
      .order("expense_date", { ascending: false });

    if (error) {
      return emptySupabaseExpenses(
        `${error.message}; session=${user?.email ?? "tidak ada"}`
      );
    }

    if (!data?.length) {
      return emptySupabaseExpenses(
        `Belum ada pengeluaran di Supabase; session=${
          user?.email ?? "tidak ada"
        }`
      );
    }

    const expenses = data as OwnerExpenseRecord[];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = expenses.filter((expense) =>
      expense.expense_date.startsWith(currentMonth)
    );
    const activeExpenses = monthlyExpenses.length ? monthlyExpenses : expenses;
    const monthlyTotal = monthlyExpenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );
    const maintenanceTotal = expenses
      .filter((expense) =>
        ["maintenance", "repair"].includes(expense.category)
      )
      .reduce((total, expense) => total + expense.amount, 0);
    const categoryTotals = expenses.reduce<
      Partial<Record<OwnerExpenseRecord["category"], number>>
    >((totals, expense) => {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
      return totals;
    }, {});
    const largestCategory = Object.entries(categoryTotals).sort(
      ([, firstAmount], [, secondAmount]) => secondAmount - firstAmount
    )[0] as [OwnerExpenseRecord["category"], number] | undefined;
    const totalExpenses = expenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );

    return {
      source: "supabase",
      expenses,
      metrics: [
        {
          label: "Bulan ini",
          value: formatMoney(monthlyTotal),
          note: `${monthlyExpenses.length} transaksi biaya`,
          tone: monthlyTotal ? "rose" : "slate"
        },
        {
          label: "Terbesar",
          value: largestCategory
            ? expenseCategoryLabels[largestCategory[0]]
            : "-",
          note: largestCategory ? formatMoney(largestCategory[1]) : "Belum ada",
          tone: largestCategory ? "amber" : "slate"
        },
        {
          label: "Maintenance",
          value: formatMoney(maintenanceTotal),
          note: "Perawatan dan perbaikan",
          tone: maintenanceTotal ? "amber" : "slate"
        },
        {
          label: "Total tercatat",
          value: formatMoney(totalExpenses),
          note: `${expenses.length} transaksi semua periode`,
          tone: "emerald"
        }
      ],
      rows: activeExpenses.map((expense) => ({
        id: expense.id,
        title: expense.description,
        meta: `${expenseCategoryLabels[expense.category]} - ${
          expense.expense_date
        }`,
        amount: formatMoney(expense.amount),
        status: "Tercatat"
      }))
    };
  } catch {
    return emptySupabaseExpenses("fetch Supabase gagal");
  }
}

export async function getOwnerPaymentsData(): Promise<OwnerModuleData> {
  if (!hasSupabaseConfig()) {
    return emptySupabasePayments("env Supabase belum terbaca");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id,bill_id,paid_at,amount,method,proof_path,note,verification_status,bills(id,tenant_id,room_id,period,amount,status,tenants(full_name),rooms(name))"
      )
      .order("paid_at", { ascending: false });

    if (error) {
      return emptySupabasePayments(
        `${error.message}; session=${user?.email ?? "tidak ada"}`
      );
    }

    if (!data?.length) {
      return emptySupabasePayments(
        `Belum ada pembayaran di Supabase; session=${
          user?.email ?? "tidak ada"
        }`
      );
    }

    const payments = await Promise.all(
      ((data ?? []) as unknown as OwnerPaymentRecord[]).map(
        async (payment) => ({
          ...payment,
          proof_url: await getPaymentProofSignedUrl(
            supabase,
            payment.proof_path
          )
        })
      )
    );
    const approvedPayments = payments.filter(
      (payment) => payment.verification_status === "approved"
    );
    const pendingCount = payments.filter(
      (payment) => payment.verification_status === "pending"
    ).length;
    const rejectedCount = payments.filter(
      (payment) => payment.verification_status === "rejected"
    ).length;
    const approvedTotal = approvedPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    return {
      source: "supabase",
      payments,
      metrics: [
        {
          label: "Masuk bulan ini",
          value: formatMoney(approvedTotal),
          note: `${approvedPayments.length} pembayaran disetujui`,
          tone: approvedPayments.length ? "emerald" : "slate"
        },
        {
          label: "Perlu verifikasi",
          value: `${pendingCount}`,
          note: pendingCount ? "Cek bukti pembayaran" : "Tidak ada antrean",
          tone: pendingCount ? "amber" : "slate"
        },
        {
          label: "Ditolak",
          value: `${rejectedCount}`,
          note: rejectedCount ? "Perlu koreksi" : "Tidak ada koreksi",
          tone: rejectedCount ? "rose" : "emerald"
        },
        {
          label: "Terverifikasi",
          value: `${approvedPayments.length}`,
          note: "Pembayaran disetujui",
          tone: "emerald"
        }
      ],
      rows: payments.map((payment) => {
        const bill = getPaymentBill(payment);

        return {
          id: payment.id,
          title: getPaymentTenantName(payment),
          meta: `Kamar ${getPaymentRoomName(payment)} - ${
            bill?.period ?? "-"
          } - ${payment.method}`,
          amount: formatMoney(payment.amount),
          status: paymentStatusLabels[payment.verification_status]
        };
      })
    };
  } catch {
    return emptySupabasePayments("fetch Supabase gagal");
  }
}

export async function getOwnerTenantsData(): Promise<OwnerModuleData> {
  if (!hasSupabaseConfig()) {
    return emptySupabaseTenants("env Supabase belum terbaca");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const [
      { data: tenantsData, error: tenantsError },
      { data: profilesData, error: profilesError }
    ] = await Promise.all([
      supabase
        .from("tenants")
        .select(
          "id,profile_id,property_id,room_id,full_name,email,phone,emergency_contact,move_in_date,rent_type,status,rooms(name)"
        )
        .order("full_name"),
      supabase
        .from("profiles")
        .select("id,full_name,email,phone,created_at")
        .eq("role", "tenant")
        .order("created_at", { ascending: false })
    ]);

    const error = tenantsError ?? profilesError;
    if (error) {
      return emptySupabaseTenants(
        `${error.message}; session=${
          user?.email ?? "tidak ada"
        }`
      );
    }

    const tenants = (tenantsData ?? []) as unknown as OwnerTenantRecord[];
    const linkedProfileIds = new Set(
      tenants
        .map((tenant) => tenant.profile_id)
        .filter((profileId): profileId is string => Boolean(profileId))
    );
    const linkedEmails = new Set(
      tenants.map((tenant) => tenant.email.trim().toLowerCase())
    );
    const tenantCandidates = (
      (profilesData ?? []) as OwnerTenantCandidateRecord[]
    ).filter(
      (profile) =>
        !linkedProfileIds.has(profile.id) &&
        !linkedEmails.has(profile.email.trim().toLowerCase())
    );

    if (!tenants.length && !tenantCandidates.length) {
      return emptySupabaseTenants(
        `Belum ada penghuni di Supabase; session=${
          user?.email ?? "tidak ada"
        }`
      );
    }

    const active = tenants.filter((tenant) => tenant.status === "active").length;
    const monthly = tenants.filter(
      (tenant) => tenant.rent_type === "monthly"
    ).length;
    const yearly = tenants.filter(
      (tenant) => tenant.rent_type === "yearly"
    ).length;

    return {
      source: "supabase",
      tenants,
      tenantCandidates,
      metrics: [
        {
          label: "Aktif",
          value: `${active}`,
          note: "Penghuni berjalan",
          tone: "emerald"
        },
        {
          label: "Belum pilih kamar",
          value: `${tenantCandidates.length}`,
          note: tenantCandidates.length ? "Menunggu pilihan tenant" : "Tidak ada antrean",
          tone: tenantCandidates.length ? "amber" : "emerald"
        },
        {
          label: "Sewa bulanan",
          value: `${monthly}`,
          note: "Ditagih tiap bulan",
          tone: "slate"
        },
        {
          label: "Sewa tahunan",
          value: `${yearly}`,
          note: "Kontrak jangka panjang",
          tone: "slate"
        }
      ],
      rows: tenants.map((tenant) => ({
        id: tenant.id,
        title: tenant.full_name,
        meta: `Kamar ${
          Array.isArray(tenant.rooms)
            ? tenant.rooms[0]?.name ?? "-"
            : tenant.rooms?.name ?? "-"
        } - Masuk ${
          tenant.move_in_date
        } - ${tenant.rent_type === "monthly" ? "Bulanan" : "Tahunan"}`,
        status: tenantStatusLabels[tenant.status]
      }))
    };
  } catch {
    return emptySupabaseTenants("fetch Supabase gagal");
  }
}

export async function getOwnerBillsData(): Promise<OwnerModuleData> {
  if (!hasSupabaseConfig()) {
    return emptySupabaseBills("env Supabase belum terbaca");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("bills")
      .select(
        "id,tenant_id,room_id,period,bill_type,amount,due_date,status,correction_note,tenants(full_name),rooms(name)"
      )
      .order("due_date", { ascending: true });

    if (error) {
      return emptySupabaseBills(
        `${error.message}; session=${user?.email ?? "tidak ada"}`
      );
    }

    if (!data?.length) {
      return emptySupabaseBills(
        `Belum ada tagihan di Supabase; session=${
          user?.email ?? "tidak ada"
        }`
      );
    }

    const bills = data as unknown as OwnerBillRecord[];
    const unpaidBills = bills.filter((bill) =>
      ["draft", "unpaid", "overdue"].includes(bill.status)
    );
    const pendingCount = bills.filter(
      (bill) => bill.status === "pending_verification"
    ).length;
    const paidCount = bills.filter((bill) => bill.status === "paid").length;
    const overdueCount = bills.filter((bill) => bill.status === "overdue").length;
    const unpaidTotal = unpaidBills.reduce(
      (total, bill) => total + bill.amount,
      0
    );

    return {
      source: "supabase",
      bills,
      metrics: [
        {
          label: "Belum lunas",
          value: formatMoney(unpaidTotal),
          note: `${unpaidBills.length} tagihan aktif`,
          tone: unpaidBills.length ? "amber" : "emerald"
        },
        {
          label: "Menunggu verifikasi",
          value: `${pendingCount}`,
          note: "Bukti pembayaran masuk",
          tone: pendingCount ? "amber" : "slate"
        },
        {
          label: "Lunas",
          value: `${paidCount}`,
          note: "Tagihan selesai",
          tone: "emerald"
        },
        {
          label: "Terlambat",
          value: `${overdueCount}`,
          note: overdueCount ? "Butuh follow up" : "Belum ada lewat tempo",
          tone: overdueCount ? "rose" : "emerald"
        }
      ],
      rows: bills.map((bill) => {
        const tenant = Array.isArray(bill.tenants)
          ? bill.tenants[0]?.full_name
          : bill.tenants?.full_name;
        const room = Array.isArray(bill.rooms)
          ? bill.rooms[0]?.name
          : bill.rooms?.name;

        return {
          id: bill.id,
          title: tenant ?? "Tanpa penghuni",
          meta: `Kamar ${room ?? "-"} - ${bill.period} - Jatuh tempo ${
            bill.due_date
          }`,
          amount: formatMoney(bill.amount),
          status: billStatusLabels[bill.status]
        };
      })
    };
  } catch {
    return emptySupabaseBills("fetch Supabase gagal");
  }
}

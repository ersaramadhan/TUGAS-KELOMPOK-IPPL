import { compareNaturalText, getSummary } from "@/lib/dashboard";
import type { Bill, Repair, Room, Summary } from "@/lib/dashboard";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type DashboardOverviewData = {
  source: "supabase";
  sourceReason?: string;
  brand: {
    ownerName: string;
    propertyName: string;
  };
  rooms: Room[];
  bills: Bill[];
  repairs: Repair[];
  activities: string[];
  summary: Summary;
  cashflow: {
    income: number;
    expenses: number;
    periodLabel: string;
  };
};

type RoomRow = {
  id: string;
  name: string;
  floor: string | null;
  monthly_price: number;
  status: "vacant" | "occupied" | "maintenance" | "inactive";
};

type TenantRow = {
  id: string;
  room_id: string;
  full_name: string;
  status: "active" | "leaving" | "left";
};

type BillRow = {
  id: string;
  tenant_id: string;
  room_id: string;
  amount: number;
  due_date: string;
  status: "draft" | "unpaid" | "pending_verification" | "paid" | "overdue";
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

type RepairRow = {
  title: string;
  status: "new" | "in_progress" | "done" | "rejected";
  created_at: string;
  rooms:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

type ActivityLogRow = {
  action: string;
  created_at: string;
};

type PaymentAmountRow = {
  amount: number;
  paid_at: string;
};

type ExpenseAmountRow = {
  amount: number;
  expense_date: string;
};

type ProfileRow = {
  full_name: string | null;
};

type PropertyRow = {
  name: string | null;
};

const fallbackBrand = {
  ownerName: "Pemilik kos",
  propertyName: "KosPilot"
};

function emptySupabaseDashboardData(sourceReason?: string): DashboardOverviewData {
  return {
    source: "supabase",
    sourceReason,
    brand: fallbackBrand,
    rooms: [],
    bills: [],
    repairs: [],
    activities: ["Belum ada aktivitas prioritas."],
    summary: getSummary([]),
    cashflow: {
      income: 0,
      expenses: 0,
      periodLabel: formatPeriodLabel(new Date())
    }
  };
}

function formatPeriodLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function getNestedName(
  value:
    | {
        name?: string;
        full_name?: string;
      }
    | {
        name?: string;
        full_name?: string;
      }[]
    | null,
  fallback: string
) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  return firstValue?.name ?? firstValue?.full_name ?? fallback;
}

function getDueLabel(dueDate: string) {
  const dueTime = new Date(`${dueDate}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueTime - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} hari terlambat`;
  }

  if (diffDays === 0) {
    return "Hari ini";
  }

  return `${diffDays} hari lagi`;
}

function getRepairAge(createdAt: string) {
  const diffHours = Math.max(
    1,
    Math.round((Date.now() - new Date(createdAt).getTime()) / 3600000)
  );

  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  return `${Math.round(diffHours / 24)} hari lalu`;
}

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");

  return `${year}-${month}`;
}

function getRoomStatus(room: RoomRow, hasPendingBill: boolean) {
  if (room.status === "maintenance") {
    return "Perbaikan";
  }

  if (room.status === "vacant" || room.status === "inactive") {
    return "Kosong";
  }

  if (hasPendingBill) {
    return "Menunggu bayar";
  }

  return "Terisi";
}

export async function getDashboardOverviewData(): Promise<DashboardOverviewData> {
  if (!hasSupabaseConfig()) {
    return emptySupabaseDashboardData("env Supabase belum terbaca");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const now = new Date();
    const currentMonthKey = getMonthKey(now);
    const [
      { data: profileData },
      { data: propertyData },
      { data: roomsData, error: roomsError },
      { data: tenantsData, error: tenantsError },
      { data: billsData, error: billsError },
      { data: paymentsData, error: paymentsError },
      { data: expensesData, error: expensesError },
      { data: repairsData, error: repairsError },
      { data: activityLogsData }
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id ?? "")
        .maybeSingle(),
      supabase
        .from("properties")
        .select("name")
        .eq("owner_id", user?.id ?? "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("rooms")
        .select("id,name,floor,monthly_price,status")
        .order("name"),
      supabase
        .from("tenants")
        .select("id,room_id,full_name,status")
        .eq("status", "active"),
      supabase
        .from("bills")
        .select("id,tenant_id,room_id,amount,due_date,status,tenants(full_name),rooms(name)")
        .neq("status", "paid")
        .order("due_date", { ascending: true })
        .limit(5),
      supabase
        .from("payments")
        .select("amount,paid_at")
        .eq("verification_status", "approved"),
      supabase
        .from("expenses")
        .select("amount,expense_date"),
      supabase
        .from("maintenance_reports")
        .select("title,status,created_at,rooms(name)")
        .in("status", ["new", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("activity_logs")
        .select("action,created_at")
        .order("created_at", { ascending: false })
        .limit(4)
    ]);
    const firstError =
      roomsError ??
      tenantsError ??
      billsError ??
      paymentsError ??
      expensesError ??
      repairsError;

    if (firstError) {
      return emptySupabaseDashboardData(firstError.message);
    }

    const roomRows = ((roomsData ?? []) as RoomRow[]).sort(
      (firstRoom, secondRoom) =>
        compareNaturalText(firstRoom.name, secondRoom.name)
    );
    const tenantRows = (tenantsData ?? []) as TenantRow[];
    const billRows = (billsData ?? []) as unknown as BillRow[];
    const repairRows = (repairsData ?? []) as unknown as RepairRow[];
    const activityLogRows = (activityLogsData ?? []) as ActivityLogRow[];
    const profile = profileData as ProfileRow | null;
    const property = propertyData as PropertyRow | null;
    const brand = {
      ownerName:
        profile?.full_name?.trim() || user?.email?.split("@")[0] || fallbackBrand.ownerName,
      propertyName: property?.name?.trim() || fallbackBrand.propertyName
    };
    const tenantsByRoom = new Map(
      tenantRows.map((tenant) => [tenant.room_id, tenant.full_name])
    );
    const pendingRoomIds = new Set(
      billRows
        .filter((bill) =>
          ["unpaid", "pending_verification", "overdue"].includes(bill.status)
        )
        .map((bill) => bill.room_id)
    );
    const rooms: Room[] = roomRows.map((room) => ({
      id: room.name,
      floor: room.floor ?? "Tanpa lantai",
      tenant: tenantsByRoom.get(room.id) ?? null,
      price: room.monthly_price,
      dueDate:
        billRows.find((bill) => bill.room_id === room.id)?.due_date ?? null,
      status: getRoomStatus(room, pendingRoomIds.has(room.id))
    }));
    const bills: Bill[] = billRows.map((bill) => ({
      tenant: getNestedName(bill.tenants, "Tanpa penghuni"),
      room: getNestedName(bill.rooms, "-"),
      amount: bill.amount,
      due: getDueLabel(bill.due_date),
      urgency:
        bill.status === "overdue" || getDueLabel(bill.due_date) === "Hari ini"
          ? "Tinggi"
          : "Sedang"
    }));
    const repairs: Repair[] = repairRows.map((repair) => ({
      title: repair.title,
      room: getNestedName(repair.rooms, "-"),
      status: repair.status === "new" ? "Baru" : "Diproses",
      age: getRepairAge(repair.created_at)
    }));
    const paymentRows = (paymentsData ?? []) as PaymentAmountRow[];
    const expenseRows = (expensesData ?? []) as ExpenseAmountRow[];
    const income = paymentRows
      .filter((payment) => payment.paid_at.slice(0, 7) === currentMonthKey)
      .reduce(
        (total, payment) => total + payment.amount,
        0
      );
    const expenses = expenseRows
      .filter((expense) => expense.expense_date.slice(0, 7) === currentMonthKey)
      .reduce(
        (total, expense) => total + expense.amount,
        0
      );
    const summary = {
      ...getSummary(rooms),
      monthlyIncome: income
    };
    const generatedActivities = [
      billRows.some((bill) => bill.status === "pending_verification")
        ? "Ada bukti pembayaran yang menunggu verifikasi."
        : null,
      rooms.some((room) => room.status === "Kosong")
        ? "Ada kamar kosong yang siap dipasarkan."
        : null,
      repairs.length ? `${repairs.length} laporan kerusakan aktif perlu dicek.` : null,
      expenses ? "Pengeluaran bulan ini sudah tercatat." : null
    ].filter(Boolean) as string[];
    const activities = activityLogRows.length
      ? activityLogRows.map((log) => log.action)
      : generatedActivities;

    return {
      source: "supabase",
      brand,
      rooms,
      bills,
      repairs,
      activities: activities.length
        ? activities
        : ["Belum ada aktivitas prioritas."],
      summary,
      cashflow: {
        income,
        expenses,
        periodLabel: formatPeriodLabel(now)
      }
    };
  } catch {
    return emptySupabaseDashboardData("fetch Supabase gagal");
  }
}

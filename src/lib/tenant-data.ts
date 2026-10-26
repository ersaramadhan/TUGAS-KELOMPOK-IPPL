import { compareNaturalText, formatMoney } from "@/lib/dashboard";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type TenantPortalProfile = {
  tenantId: string;
  roomId: string;
  name: string;
  email: string;
  phone: string;
  room: string;
  rentType: string;
  moveInDate: string;
  emergencyContact: string;
  status: string;
};

export type TenantAvailableRoom = {
  id: string;
  propertyId: string;
  name: string;
  floor: string | null;
  monthlyPrice: number;
  yearlyPrice: number | null;
};

export type TenantPortalBill = {
  id: string;
  period: string;
  amount: number;
  dueDate: string;
  status: "draft" | "unpaid" | "pending_verification" | "paid" | "overdue";
  billType: "monthly" | "yearly";
};

export type TenantPortalPayment = {
  id: string;
  billId: string;
  billPeriod: string;
  amount: number;
  method: string;
  paidAt: string;
  proofPath: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
};

export type TenantPortalReport = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "new" | "in_progress" | "done" | "rejected";
  ownerNote: string | null;
  createdAt: string;
};

export type TenantPortalData = {
  source: "supabase";
  sourceReason?: string;
  profile: TenantPortalProfile;
  availableRooms: TenantAvailableRoom[];
  bills: TenantPortalBill[];
  payments: TenantPortalPayment[];
  reports: TenantPortalReport[];
};

type TenantRecord = {
  id: string;
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

type PaymentRow = {
  id: string;
  bill_id: string;
  paid_at: string;
  amount: number;
  method: string;
  proof_path: string | null;
  note: string | null;
  verification_status: "pending" | "approved" | "rejected";
  bills:
    | {
        period: string;
      }
    | {
        period: string;
      }[]
    | null;
};

const billStatusLabels: Record<TenantPortalBill["status"], string> = {
  draft: "Draft",
  unpaid: "Belum lunas",
  pending_verification: "Menunggu verifikasi",
  paid: "Lunas",
  overdue: "Terlambat"
};

const paymentStatusLabels: Record<TenantPortalPayment["status"], string> = {
  pending: "Menunggu verifikasi",
  approved: "Terverifikasi",
  rejected: "Ditolak"
};

const reportPriorityLabels: Record<TenantPortalReport["priority"], string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi"
};

const reportStatusLabels: Record<TenantPortalReport["status"], string> = {
  new: "Baru",
  in_progress: "Diproses",
  done: "Selesai",
  rejected: "Ditolak"
};

function emptySupabaseTenantPortalData({
  email,
  name,
  sourceReason
}: {
  email?: string | null;
  name?: string | null;
  sourceReason?: string;
}): TenantPortalData {
  const fallbackEmail = email ?? "-";
  const fallbackName =
    name ?? (email ? email.split("@")[0] : "Akun penghuni");

  return {
    source: "supabase",
    sourceReason,
    profile: {
      tenantId: "",
      roomId: "",
      name: fallbackName,
      email: fallbackEmail,
      phone: "-",
      room: "-",
      rentType: "-",
      moveInDate: "-",
      emergencyContact: "-",
      status: "Belum terhubung"
    },
    availableRooms: [],
    bills: [],
    payments: [],
    reports: []
  };
}

async function getAvailableRoomsForTenantPortal(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data, error } = await supabase
    .from("rooms")
    .select("id,property_id,name,floor,monthly_price,yearly_price")
    .eq("status", "vacant");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((room) => ({
      id: room.id,
      propertyId: room.property_id,
      name: room.name,
      floor: room.floor,
      monthlyPrice: room.monthly_price,
      yearlyPrice: room.yearly_price
    }))
    .sort((firstRoom, secondRoom) =>
      compareNaturalText(firstRoom.name, secondRoom.name)
    ) as TenantAvailableRoom[];
}

function getRoomName(tenant: TenantRecord) {
  if (Array.isArray(tenant.rooms)) {
    return tenant.rooms[0]?.name ?? "-";
  }

  return tenant.rooms?.name ?? "-";
}

function getBillPeriod(payment: PaymentRow) {
  if (Array.isArray(payment.bills)) {
    return payment.bills[0]?.period ?? "-";
  }

  return payment.bills?.period ?? "-";
}

function tenantToProfile(tenant: TenantRecord): TenantPortalProfile {
  return {
    tenantId: tenant.id,
    roomId: tenant.room_id,
    name: tenant.full_name,
    email: tenant.email,
    phone: tenant.phone ?? "-",
    room: getRoomName(tenant),
    rentType: tenant.rent_type === "monthly" ? "Bulanan" : "Tahunan",
    moveInDate: tenant.move_in_date,
    emergencyContact: tenant.emergency_contact ?? "-",
    status:
      tenant.status === "active"
        ? "Aktif"
        : tenant.status === "leaving"
          ? "Akan keluar"
          : "Sudah keluar"
  };
}

export function tenantBillRowsFromData(bills: TenantPortalBill[]) {
  return bills.map((bill) => ({
    title: bill.period,
    meta: `Jatuh tempo ${bill.dueDate}`,
    amount: formatMoney(bill.amount),
    status: billStatusLabels[bill.status]
  }));
}

export function tenantPaymentRowsFromData(payments: TenantPortalPayment[]) {
  return payments.map((payment) => ({
    title: payment.billPeriod,
    meta: `${payment.method} - ${payment.paidAt.slice(0, 10)}`,
    amount: formatMoney(payment.amount),
    status: paymentStatusLabels[payment.status]
  }));
}

export function tenantReportRowsFromData(reports: TenantPortalReport[]) {
  return reports.map((report) => ({
    title: report.title,
    meta: `${reportPriorityLabels[report.priority]} - ${report.createdAt.slice(
      0,
      10
    )}`,
    status: reportStatusLabels[report.status]
  }));
}

export async function getTenantPortalData(): Promise<TenantPortalData> {
  if (!hasSupabaseConfig()) {
    return emptySupabaseTenantPortalData({
      sourceReason: "env Supabase belum terbaca"
    });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return emptySupabaseTenantPortalData({
        sourceReason: "session tenant tidak ada"
      });
    }

    const userEmail = user.email ?? null;
    const userName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select(
        "id,room_id,full_name,email,phone,emergency_contact,move_in_date,rent_type,status,rooms(name)"
      )
      .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
      .limit(1)
      .maybeSingle();

    if (tenantError) {
      return emptySupabaseTenantPortalData({
        email: userEmail,
        name: userName,
        sourceReason: `${tenantError.message}; session=${
          user.email ?? "tidak ada"
        }`
      });
    }

    if (!tenant) {
      let availableRooms: TenantAvailableRoom[] = [];

      try {
        availableRooms = await getAvailableRoomsForTenantPortal(supabase);
      } catch (roomError) {
        return {
          ...emptySupabaseTenantPortalData({
            email: userEmail,
            name: userName,
            sourceReason:
              roomError instanceof Error
                ? `tenant belum memilih kamar; ${roomError.message}`
                : "tenant belum memilih kamar; kamar kosong belum bisa dibaca"
          }),
          availableRooms
        };
      }

      return {
        ...emptySupabaseTenantPortalData({
          email: userEmail,
          name: userName,
          sourceReason: `tenant belum memilih kamar untuk session=${
            user.email ?? "tidak ada"
          }`
        }),
        availableRooms
      };
    }

    const tenantRecord = tenant as unknown as TenantRecord;
    const [
      { data: billsData, error: billsError },
      { data: paymentsData, error: paymentsError },
      { data: reportsData, error: reportsError }
    ] = await Promise.all([
      supabase
        .from("bills")
        .select("id,period,amount,due_date,status,bill_type")
        .eq("tenant_id", tenantRecord.id)
        .order("due_date", { ascending: false }),
      supabase
        .from("payments")
        .select(
          "id,bill_id,paid_at,amount,method,proof_path,note,verification_status,bills!inner(period,tenant_id)"
        )
        .eq("bills.tenant_id", tenantRecord.id)
        .order("paid_at", { ascending: false }),
      supabase
        .from("maintenance_reports")
        .select("id,title,description,priority,status,owner_note,created_at")
        .eq("tenant_id", tenantRecord.id)
        .order("created_at", { ascending: false })
    ]);

    const firstError = billsError ?? paymentsError ?? reportsError;
    if (firstError) {
      return {
        source: "supabase",
        sourceReason: `${firstError.message}; session=${
          user.email ?? "tidak ada"
        }`,
        profile: tenantToProfile(tenantRecord),
        availableRooms: [],
        bills: [],
        payments: [],
        reports: []
      };
    }

    const bills = (billsData ?? []).map((bill) => ({
      id: bill.id,
      period: bill.period,
      amount: bill.amount,
      dueDate: bill.due_date,
      status: bill.status,
      billType: bill.bill_type
    })) as TenantPortalBill[];
    const payments = ((paymentsData ?? []) as unknown as PaymentRow[]).map(
      (payment) => ({
        id: payment.id,
        billId: payment.bill_id,
        billPeriod: getBillPeriod(payment),
        amount: payment.amount,
        method: payment.method,
        paidAt: payment.paid_at,
        proofPath: payment.proof_path,
        note: payment.note,
        status: payment.verification_status
      })
    );
    const reports = (reportsData ?? []).map((report) => ({
      id: report.id,
      title: report.title,
      description: report.description,
      priority: report.priority,
      status: report.status,
      ownerNote: report.owner_note,
      createdAt: report.created_at
    })) as TenantPortalReport[];

    return {
      source: "supabase",
      profile: tenantToProfile(tenantRecord),
      availableRooms: [],
      bills,
      payments,
      reports
    };
  } catch {
    return emptySupabaseTenantPortalData({
      sourceReason: "fetch Supabase gagal"
    });
  }
}

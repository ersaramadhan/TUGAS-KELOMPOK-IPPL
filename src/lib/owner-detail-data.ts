import { formatMoney } from "@/lib/dashboard";
import {
  type OwnerBillRecord,
  type OwnerMaintenanceReportRecord,
  type OwnerPaymentRecord,
  type OwnerRoomRecord,
  type OwnerTenantRecord
} from "@/lib/owner-data";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type DetailMetric = {
  label: string;
  value: string;
  note: string;
  tone: "emerald" | "amber" | "rose" | "slate";
};

export type OwnerRoomDetailRecord = OwnerRoomRecord & {
  property_id: string;
  facilities: string[];
  created_at: string;
};

export type OwnerTenantDetailRecord = Omit<OwnerTenantRecord, "rooms"> & {
  identity_number: string | null;
  created_at: string;
  rooms:
    | {
        name: string;
        floor: string | null;
        monthly_price: number;
        yearly_price: number | null;
        status: OwnerRoomRecord["status"];
      }
    | {
        name: string;
        floor: string | null;
        monthly_price: number;
        yearly_price: number | null;
        status: OwnerRoomRecord["status"];
      }[]
    | null;
};

export type OwnerRoomDetailData = {
  source: "supabase";
  sourceReason?: string;
  room: OwnerRoomDetailRecord | null;
  tenant: OwnerTenantRecord | null;
  bills: OwnerBillRecord[];
  payments: OwnerPaymentRecord[];
  maintenanceReports: OwnerMaintenanceReportRecord[];
  metrics: DetailMetric[];
};

export type OwnerTenantDetailData = {
  source: "supabase";
  sourceReason?: string;
  tenant: OwnerTenantDetailRecord | null;
  bills: OwnerBillRecord[];
  payments: OwnerPaymentRecord[];
  maintenanceReports: OwnerMaintenanceReportRecord[];
  metrics: DetailMetric[];
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

function getBillTenantName(bill: OwnerBillRecord) {
  if (Array.isArray(bill.tenants)) {
    return bill.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return bill.tenants?.full_name ?? "Tanpa penghuni";
}

function getBillRoomName(bill: OwnerBillRecord) {
  if (Array.isArray(bill.rooms)) {
    return bill.rooms[0]?.name ?? "-";
  }

  return bill.rooms?.name ?? "-";
}

function getPaymentBill(payment: OwnerPaymentRecord) {
  if (Array.isArray(payment.bills)) {
    return payment.bills[0] ?? null;
  }

  return payment.bills;
}

function createRoomMetrics(
  room: OwnerRoomDetailRecord | null,
  tenant: OwnerTenantRecord | null,
  bills: OwnerBillRecord[],
  reports: OwnerMaintenanceReportRecord[]
): DetailMetric[] {
  const activeBills = bills.filter((bill) =>
    ["draft", "unpaid", "pending_verification", "overdue"].includes(
      bill.status
    )
  );
  const activeBillTotal = activeBills.reduce(
    (total, bill) => total + bill.amount,
    0
  );
  const activeReports = reports.filter((report) =>
    ["new", "in_progress"].includes(report.status)
  );

  return [
    {
      label: "Status kamar",
      value: room ? roomStatusLabels[room.status] : "-",
      note: tenant?.full_name ?? "Belum ada penghuni aktif",
      tone: room?.status === "occupied" ? "emerald" : "slate"
    },
    {
      label: "Harga bulanan",
      value: room ? formatMoney(room.monthly_price) : formatMoney(0),
      note: room?.yearly_price
        ? `${formatMoney(room.yearly_price)} per tahun`
        : "Harga tahunan belum diisi",
      tone: "slate"
    },
    {
      label: "Tagihan aktif",
      value: formatMoney(activeBillTotal),
      note: `${activeBills.length} tagihan perlu dipantau`,
      tone: activeBills.length ? "amber" : "emerald"
    },
    {
      label: "Laporan aktif",
      value: `${activeReports.length}`,
      note: activeReports.length ? "Butuh tindak lanjut" : "Tidak ada laporan",
      tone: activeReports.length ? "rose" : "emerald"
    }
  ];
}

function createTenantMetrics(
  tenant: OwnerTenantDetailRecord | null,
  bills: OwnerBillRecord[],
  payments: OwnerPaymentRecord[]
): DetailMetric[] {
  const activeBills = bills.filter((bill) =>
    ["draft", "unpaid", "pending_verification", "overdue"].includes(
      bill.status
    )
  );
  const activeBillTotal = activeBills.reduce(
    (total, bill) => total + bill.amount,
    0
  );
  const approvedPayments = payments.filter(
    (payment) => payment.verification_status === "approved"
  );
  const approvedTotal = approvedPayments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  return [
    {
      label: "Status penghuni",
      value: tenant ? tenantStatusLabels[tenant.status] : "-",
      note:
        tenant?.rent_type === "yearly"
          ? "Sewa tahunan"
          : tenant
            ? "Sewa bulanan"
            : "Data tidak ditemukan",
      tone: tenant?.status === "active" ? "emerald" : "amber"
    },
    {
      label: "Kamar",
      value: tenant ? `Kamar ${getTenantRoomName(tenant)}` : "-",
      note: tenant ? `Masuk ${tenant.move_in_date}` : "Belum ada data",
      tone: "slate"
    },
    {
      label: "Tagihan aktif",
      value: formatMoney(activeBillTotal),
      note: `${activeBills.length} tagihan berjalan`,
      tone: activeBills.length ? "amber" : "emerald"
    },
    {
      label: "Pembayaran sah",
      value: formatMoney(approvedTotal),
      note: `${approvedPayments.length} pembayaran disetujui`,
      tone: "emerald"
    }
  ];
}

export function getTenantRoomName(
  tenant: OwnerTenantRecord | OwnerTenantDetailRecord
) {
  if (Array.isArray(tenant.rooms)) {
    return tenant.rooms[0]?.name ?? "-";
  }

  return tenant.rooms?.name ?? "-";
}

export function getPaymentTenantName(payment: OwnerPaymentRecord) {
  const bill = getPaymentBill(payment);

  if (Array.isArray(bill?.tenants)) {
    return bill.tenants[0]?.full_name ?? "Tanpa penghuni";
  }

  return bill?.tenants?.full_name ?? "Tanpa penghuni";
}

export function getPaymentRoomName(payment: OwnerPaymentRecord) {
  const bill = getPaymentBill(payment);

  if (Array.isArray(bill?.rooms)) {
    return bill.rooms[0]?.name ?? "-";
  }

  return bill?.rooms?.name ?? "-";
}

export function getBillSummary(bill: OwnerBillRecord) {
  return `Kamar ${getBillRoomName(bill)} - ${getBillTenantName(bill)} - ${
    bill.period
  }`;
}

export async function getOwnerRoomDetailData(
  roomId: string
): Promise<OwnerRoomDetailData> {
  if (!hasSupabaseConfig()) {
    return {
      source: "supabase",
      sourceReason: "env Supabase belum terbaca",
      room: null,
      tenant: null,
      bills: [],
      payments: [],
      maintenanceReports: [],
      metrics: createRoomMetrics(null, null, [], [])
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const reasons: string[] = [];

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select(
        "id,property_id,name,floor,monthly_price,yearly_price,status,facilities,internal_note,created_at"
      )
      .eq("id", roomId)
      .maybeSingle();

    if (roomError) {
      return {
        source: "supabase",
        sourceReason: `${roomError.message}; session=${
          user?.email ?? "tidak ada"
        }`,
        room: null,
        tenant: null,
        bills: [],
        payments: [],
        maintenanceReports: [],
        metrics: createRoomMetrics(null, null, [], [])
      };
    }

    if (!roomData) {
      return {
        source: "supabase",
        sourceReason: `Kamar tidak ditemukan; session=${
          user?.email ?? "tidak ada"
        }`,
        room: null,
        tenant: null,
        bills: [],
        payments: [],
        maintenanceReports: [],
        metrics: createRoomMetrics(null, null, [], [])
      };
    }

    const [
      tenantResult,
      billsResult,
      paymentsResult,
      maintenanceReportsResult
    ] = await Promise.all([
      supabase
        .from("tenants")
        .select(
          "id,property_id,room_id,full_name,email,phone,emergency_contact,move_in_date,rent_type,status,rooms(name)"
        )
        .eq("room_id", roomId)
        .in("status", ["active", "leaving"])
        .limit(1)
        .maybeSingle(),
      supabase
        .from("bills")
        .select(
          "id,tenant_id,room_id,period,bill_type,amount,due_date,status,correction_note,tenants(full_name),rooms(name)"
        )
        .eq("room_id", roomId)
        .order("due_date", { ascending: false }),
      supabase
        .from("payments")
        .select(
          "id,bill_id,paid_at,amount,method,proof_path,note,verification_status,bills!inner(id,tenant_id,room_id,period,amount,status,tenants(full_name),rooms(name))"
        )
        .eq("bills.room_id", roomId)
        .order("paid_at", { ascending: false }),
      supabase
        .from("maintenance_reports")
        .select(
          "id,tenant_id,room_id,title,description,photo_path,priority,status,owner_note,created_at,tenants(full_name),rooms(name)"
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
    ]);

    if (tenantResult.error) {
      reasons.push(`penghuni: ${tenantResult.error.message}`);
    }
    if (billsResult.error) {
      reasons.push(`tagihan: ${billsResult.error.message}`);
    }
    if (paymentsResult.error) {
      reasons.push(`pembayaran: ${paymentsResult.error.message}`);
    }
    if (maintenanceReportsResult.error) {
      reasons.push(`laporan: ${maintenanceReportsResult.error.message}`);
    }

    const room = roomData as OwnerRoomDetailRecord;
    const tenant = tenantResult.data as unknown as OwnerTenantRecord | null;
    const bills = (billsResult.data ?? []) as unknown as OwnerBillRecord[];
    const payments = (paymentsResult.data ??
      []) as unknown as OwnerPaymentRecord[];
    const maintenanceReports = (maintenanceReportsResult.data ??
      []) as unknown as OwnerMaintenanceReportRecord[];

    return {
      source: "supabase",
      sourceReason: reasons.length ? reasons.join("; ") : undefined,
      room,
      tenant,
      bills,
      payments,
      maintenanceReports,
      metrics: createRoomMetrics(room, tenant, bills, maintenanceReports)
    };
  } catch {
    return {
      source: "supabase",
      sourceReason: "fetch Supabase gagal",
      room: null,
      tenant: null,
      bills: [],
      payments: [],
      maintenanceReports: [],
      metrics: createRoomMetrics(null, null, [], [])
    };
  }
}

export async function getOwnerTenantDetailData(
  tenantId: string
): Promise<OwnerTenantDetailData> {
  if (!hasSupabaseConfig()) {
    return {
      source: "supabase",
      sourceReason: "env Supabase belum terbaca",
      tenant: null,
      bills: [],
      payments: [],
      maintenanceReports: [],
      metrics: createTenantMetrics(null, [], [])
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const reasons: string[] = [];

    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .select(
        "id,profile_id,property_id,room_id,full_name,email,phone,identity_number,emergency_contact,move_in_date,rent_type,status,created_at,rooms(name,floor,monthly_price,yearly_price,status)"
      )
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantError) {
      return {
        source: "supabase",
        sourceReason: `${tenantError.message}; session=${
          user?.email ?? "tidak ada"
        }`,
        tenant: null,
        bills: [],
        payments: [],
        maintenanceReports: [],
        metrics: createTenantMetrics(null, [], [])
      };
    }

    if (!tenantData) {
      return {
        source: "supabase",
        sourceReason: `Penghuni tidak ditemukan; session=${
          user?.email ?? "tidak ada"
        }`,
        tenant: null,
        bills: [],
        payments: [],
        maintenanceReports: [],
        metrics: createTenantMetrics(null, [], [])
      };
    }

    const [billsResult, paymentsResult, maintenanceReportsResult] =
      await Promise.all([
        supabase
          .from("bills")
          .select(
            "id,tenant_id,room_id,period,bill_type,amount,due_date,status,correction_note,tenants(full_name),rooms(name)"
          )
          .eq("tenant_id", tenantId)
          .order("due_date", { ascending: false }),
        supabase
          .from("payments")
          .select(
            "id,bill_id,paid_at,amount,method,proof_path,note,verification_status,bills!inner(id,tenant_id,room_id,period,amount,status,tenants(full_name),rooms(name))"
          )
          .eq("bills.tenant_id", tenantId)
          .order("paid_at", { ascending: false }),
        supabase
          .from("maintenance_reports")
          .select(
            "id,tenant_id,room_id,title,description,photo_path,priority,status,owner_note,created_at,tenants(full_name),rooms(name)"
          )
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
      ]);

    if (billsResult.error) {
      reasons.push(`tagihan: ${billsResult.error.message}`);
    }
    if (paymentsResult.error) {
      reasons.push(`pembayaran: ${paymentsResult.error.message}`);
    }
    if (maintenanceReportsResult.error) {
      reasons.push(`laporan: ${maintenanceReportsResult.error.message}`);
    }

    const tenant = tenantData as unknown as OwnerTenantDetailRecord;
    const bills = (billsResult.data ?? []) as unknown as OwnerBillRecord[];
    const payments = (paymentsResult.data ??
      []) as unknown as OwnerPaymentRecord[];
    const maintenanceReports = (maintenanceReportsResult.data ??
      []) as unknown as OwnerMaintenanceReportRecord[];

    return {
      source: "supabase",
      sourceReason: reasons.length ? reasons.join("; ") : undefined,
      tenant,
      bills,
      payments,
      maintenanceReports,
      metrics: createTenantMetrics(tenant, bills, payments)
    };
  } catch {
    return {
      source: "supabase",
      sourceReason: "fetch Supabase gagal",
      tenant: null,
      bills: [],
      payments: [],
      maintenanceReports: [],
      metrics: createTenantMetrics(null, [], [])
    };
  }
}

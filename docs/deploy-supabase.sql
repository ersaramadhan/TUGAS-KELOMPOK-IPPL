-- KosPilot deploy script for Supabase.
-- Run this once in Supabase SQL Editor before deploying the app.
-- This file combines schema, grants, RLS policies, storage buckets, and auth trigger.
-- It intentionally excludes diagnostic-only SQL files.

-- ============================================================
-- 01. Schema
-- Source: docs/supabase-schema.sql
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('owner', 'tenant')),
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text,
  payment_account text,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  floor text,
  monthly_price integer not null check (monthly_price > 0),
  yearly_price integer check (yearly_price is null or yearly_price > 0),
  status text not null check (status in ('vacant', 'occupied', 'maintenance', 'inactive')),
  facilities text[] not null default '{}',
  internal_note text,
  created_at timestamptz not null default now(),
  unique (property_id, name)
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text,
  identity_number text,
  emergency_contact text,
  move_in_date date not null,
  rent_type text not null check (rent_type in ('monthly', 'yearly')),
  status text not null check (status in ('active', 'leaving', 'left')),
  created_at timestamptz not null default now()
);

create unique index if not exists tenants_one_active_per_room
  on public.tenants(room_id)
  where status = 'active';

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict,
  period text not null,
  bill_type text not null check (bill_type in ('monthly', 'yearly')),
  amount integer not null check (amount > 0),
  due_date date not null,
  status text not null check (
    status in ('draft', 'unpaid', 'pending_verification', 'paid', 'overdue')
  ),
  correction_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  paid_at timestamptz not null,
  amount integer not null check (amount > 0),
  method text not null,
  proof_path text,
  note text,
  verification_status text not null check (
    verification_status in ('pending', 'approved', 'rejected')
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  expense_date date not null,
  category text not null check (
    category in ('electricity', 'water', 'internet', 'maintenance', 'cleaning', 'repair', 'other')
  ),
  amount integer not null check (amount > 0),
  description text not null,
  proof_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict,
  title text not null,
  description text not null,
  photo_path text,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null check (status in ('new', 'in_progress', 'done', 'rejected')),
  owner_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.rooms enable row level security;
alter table public.tenants enable row level security;
alter table public.bills enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.maintenance_reports enable row level security;
alter table public.activity_logs enable row level security;

-- ============================================================
-- 01b. Shared auth helper functions
-- Sources: tenant self-service room selection
-- ============================================================

create or replace function public.current_user_has_role(target_role text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = target_role
  );
$$;

grant execute on function public.current_user_has_role(text)
to authenticated;

-- ============================================================
-- 02. Register and settings policies
-- Sources: register-policies.sql, settings-policies.sql
-- ============================================================

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.properties to authenticated;

drop policy if exists "user can read own profile" on public.profiles;
drop policy if exists "user can insert own profile during register" on public.profiles;
drop policy if exists "user can update own profile" on public.profiles;
drop policy if exists "owner can read own property during register" on public.properties;
drop policy if exists "owner can create property during register" on public.properties;
drop policy if exists "owner can read own profile" on public.profiles;
drop policy if exists "owner can insert own profile" on public.profiles;
drop policy if exists "owner can update own profile" on public.profiles;
drop policy if exists "owner can read tenant signup profiles" on public.profiles;
drop policy if exists "owner can read own property settings" on public.properties;
drop policy if exists "owner can insert own property settings" on public.properties;
drop policy if exists "owner can update own property settings" on public.properties;

create policy "user can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "user can insert own profile during register"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and role in ('owner', 'tenant'));

create policy "user can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role in ('owner', 'tenant'));

create policy "owner can read own property during register"
on public.properties
for select
to authenticated
using (owner_id = auth.uid());

create policy "owner can create property during register"
on public.properties
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'owner'
  )
);

create policy "owner can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "owner can insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and role = 'owner');

create policy "owner can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = 'owner');

create policy "owner can read tenant signup profiles"
on public.profiles
for select
to authenticated
using (
  role = 'tenant'
  and public.current_user_has_role('owner')
);

create policy "owner can read own property settings"
on public.properties
for select
to authenticated
using (owner_id = auth.uid());

create policy "owner can insert own property settings"
on public.properties
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "owner can update own property settings"
on public.properties
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- ============================================================
-- 03. Owner helper functions
-- Sources: tenants, bills, payments, maintenance policies
-- ============================================================

create or replace function public.owner_owns_property(target_property_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties p
    where p.id = target_property_id
      and p.owner_id = auth.uid()
  );
$$;

grant execute on function public.owner_owns_property(uuid)
to authenticated;

create or replace function public.room_belongs_to_property(
  target_room_id uuid,
  target_property_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and r.property_id = target_property_id
  );
$$;

grant execute on function public.room_belongs_to_property(uuid, uuid)
to authenticated;

create or replace function public.owner_can_access_tenant_bill(
  target_tenant_id uuid,
  target_room_id uuid default null
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenants t
    join public.properties p on p.id = t.property_id
    where t.id = target_tenant_id
      and (target_room_id is null or t.room_id = target_room_id)
      and p.owner_id = auth.uid()
  );
$$;

grant execute on function public.owner_can_access_tenant_bill(uuid, uuid)
to authenticated;

create or replace function public.owner_can_access_bill(target_bill_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bills b
    join public.tenants t on t.id = b.tenant_id
    join public.properties p on p.id = t.property_id
    where b.id = target_bill_id
      and p.owner_id = auth.uid()
  );
$$;

grant execute on function public.owner_can_access_bill(uuid)
to authenticated;

create or replace function public.owner_sync_bill_status_from_payment(
  target_bill_id uuid,
  target_payment_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_bill_status text;
begin
  if target_payment_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Status verifikasi pembayaran tidak valid.';
  end if;

  if not public.owner_can_access_bill(target_bill_id) then
    raise exception 'Tagihan tidak ditemukan atau tidak dimiliki owner login.';
  end if;

  next_bill_status := case target_payment_status
    when 'approved' then 'paid'
    when 'pending' then 'pending_verification'
    else 'unpaid'
  end;

  update public.bills
  set status = next_bill_status
  where id = target_bill_id;

  return next_bill_status;
end;
$$;

grant execute on function public.owner_sync_bill_status_from_payment(uuid, text)
to authenticated;

create or replace function public.owner_can_access_maintenance_report(
  target_report_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.maintenance_reports mr
    join public.tenants t on t.id = mr.tenant_id
    join public.properties p on p.id = t.property_id
    where mr.id = target_report_id
      and p.owner_id = auth.uid()
  );
$$;

grant execute on function public.owner_can_access_maintenance_report(uuid)
to authenticated;

create or replace function public.owner_can_manage_maintenance_payload(
  target_tenant_id uuid,
  target_room_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenants t
    join public.properties p on p.id = t.property_id
    where t.id = target_tenant_id
      and t.room_id = target_room_id
      and p.owner_id = auth.uid()
  );
$$;

grant execute on function public.owner_can_manage_maintenance_payload(uuid, uuid)
to authenticated;

-- ============================================================
-- 04. Owner module policies
-- Sources: rooms, tenants, bills, payments, expenses, maintenance reports
-- ============================================================

grant select, insert, update, delete on public.rooms to authenticated;
grant select, insert, update, delete on public.tenants to authenticated;
grant select, insert, update, delete on public.bills to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.maintenance_reports to authenticated;
grant select on public.properties to authenticated;
grant select on public.rooms to authenticated;
grant select on public.tenants to authenticated;

drop policy if exists "owner can insert own rooms" on public.rooms;
drop policy if exists "owner can update own rooms" on public.rooms;
drop policy if exists "owner can delete own rooms" on public.rooms;
drop policy if exists "owner can read own tenants" on public.tenants;
drop policy if exists "owner can insert own tenants" on public.tenants;
drop policy if exists "owner can update own tenants" on public.tenants;
drop policy if exists "owner can delete own tenants" on public.tenants;
drop policy if exists "owner can read own bills" on public.bills;
drop policy if exists "owner can insert own bills" on public.bills;
drop policy if exists "owner can update own bills" on public.bills;
drop policy if exists "owner can delete own bills" on public.bills;
drop policy if exists "owner can read own payments" on public.payments;
drop policy if exists "owner can insert own payments" on public.payments;
drop policy if exists "owner can update own payments" on public.payments;
drop policy if exists "owner can delete own payments" on public.payments;
drop policy if exists "owner can update bills from payments" on public.bills;
drop policy if exists "owner can read own expenses" on public.expenses;
drop policy if exists "owner can insert own expenses" on public.expenses;
drop policy if exists "owner can update own expenses" on public.expenses;
drop policy if exists "owner can delete own expenses" on public.expenses;
drop policy if exists "owner can read own maintenance reports" on public.maintenance_reports;
drop policy if exists "owner can insert own maintenance reports" on public.maintenance_reports;
drop policy if exists "owner can update own maintenance reports" on public.maintenance_reports;
drop policy if exists "owner can delete own maintenance reports" on public.maintenance_reports;

create policy "owner can insert own rooms"
on public.rooms
for insert
to authenticated
with check (public.owner_owns_property(rooms.property_id));

create policy "owner can update own rooms"
on public.rooms
for update
to authenticated
using (public.owner_owns_property(rooms.property_id))
with check (public.owner_owns_property(rooms.property_id));

create policy "owner can delete own rooms"
on public.rooms
for delete
to authenticated
using (public.owner_owns_property(rooms.property_id));

create policy "owner can read own tenants"
on public.tenants
for select
to authenticated
using (public.owner_owns_property(tenants.property_id));

create policy "owner can insert own tenants"
on public.tenants
for insert
to authenticated
with check (
  public.owner_owns_property(tenants.property_id)
  and public.room_belongs_to_property(tenants.room_id, tenants.property_id)
);

create policy "owner can update own tenants"
on public.tenants
for update
to authenticated
using (public.owner_owns_property(tenants.property_id))
with check (
  public.owner_owns_property(tenants.property_id)
  and public.room_belongs_to_property(tenants.room_id, tenants.property_id)
);

create policy "owner can delete own tenants"
on public.tenants
for delete
to authenticated
using (public.owner_owns_property(tenants.property_id));

create policy "owner can read own bills"
on public.bills
for select
to authenticated
using (public.owner_can_access_tenant_bill(bills.tenant_id));

create policy "owner can insert own bills"
on public.bills
for insert
to authenticated
with check (public.owner_can_access_tenant_bill(bills.tenant_id, bills.room_id));

create policy "owner can update own bills"
on public.bills
for update
to authenticated
using (public.owner_can_access_tenant_bill(bills.tenant_id))
with check (public.owner_can_access_tenant_bill(bills.tenant_id, bills.room_id));

create policy "owner can delete own bills"
on public.bills
for delete
to authenticated
using (public.owner_can_access_tenant_bill(bills.tenant_id));

create policy "owner can read own payments"
on public.payments
for select
to authenticated
using (public.owner_can_access_bill(payments.bill_id));

create policy "owner can insert own payments"
on public.payments
for insert
to authenticated
with check (public.owner_can_access_bill(payments.bill_id));

create policy "owner can update own payments"
on public.payments
for update
to authenticated
using (public.owner_can_access_bill(payments.bill_id))
with check (public.owner_can_access_bill(payments.bill_id));

create policy "owner can delete own payments"
on public.payments
for delete
to authenticated
using (public.owner_can_access_bill(payments.bill_id));

create policy "owner can update bills from payments"
on public.bills
for update
to authenticated
using (public.owner_can_access_bill(bills.id))
with check (public.owner_can_access_bill(bills.id));

create policy "owner can read own expenses"
on public.expenses
for select
to authenticated
using (public.owner_owns_property(expenses.property_id));

create policy "owner can insert own expenses"
on public.expenses
for insert
to authenticated
with check (public.owner_owns_property(expenses.property_id));

create policy "owner can update own expenses"
on public.expenses
for update
to authenticated
using (public.owner_owns_property(expenses.property_id))
with check (public.owner_owns_property(expenses.property_id));

create policy "owner can delete own expenses"
on public.expenses
for delete
to authenticated
using (public.owner_owns_property(expenses.property_id));

create policy "owner can read own maintenance reports"
on public.maintenance_reports
for select
to authenticated
using (public.owner_can_access_maintenance_report(maintenance_reports.id));

create policy "owner can insert own maintenance reports"
on public.maintenance_reports
for insert
to authenticated
with check (
  public.owner_can_manage_maintenance_payload(
    maintenance_reports.tenant_id,
    maintenance_reports.room_id
  )
);

create policy "owner can update own maintenance reports"
on public.maintenance_reports
for update
to authenticated
using (public.owner_can_access_maintenance_report(maintenance_reports.id))
with check (
  public.owner_can_manage_maintenance_payload(
    maintenance_reports.tenant_id,
    maintenance_reports.room_id
  )
);

create policy "owner can delete own maintenance reports"
on public.maintenance_reports
for delete
to authenticated
using (public.owner_can_access_maintenance_report(maintenance_reports.id));

-- ============================================================
-- 05. Tenant portal policies
-- Source: tenant-portal-policies.sql
-- ============================================================

grant select on public.profiles to authenticated;
grant select on public.properties to authenticated;
grant select, update on public.rooms to authenticated;
grant select, insert on public.tenants to authenticated;
grant select, update on public.bills to authenticated;
grant select, insert on public.payments to authenticated;
grant select, insert on public.maintenance_reports to authenticated;

create or replace function public.is_current_tenant(target_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenants t
    where t.id = target_tenant_id
      and (
        t.profile_id = auth.uid()
        or t.email = (auth.jwt() ->> 'email')
      )
  );
$$;

grant execute on function public.is_current_tenant(uuid)
to authenticated;

create or replace function public.current_tenant_can_access_room(
  target_room_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenants t
    where t.room_id = target_room_id
      and (
        t.profile_id = auth.uid()
        or t.email = (auth.jwt() ->> 'email')
      )
  );
$$;

grant execute on function public.current_tenant_can_access_room(uuid)
to authenticated;

create or replace function public.current_tenant_can_access_bill(
  target_bill_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bills b
    join public.tenants t on t.id = b.tenant_id
    where b.id = target_bill_id
      and (
        t.profile_id = auth.uid()
        or t.email = (auth.jwt() ->> 'email')
      )
  );
$$;

grant execute on function public.current_tenant_can_access_bill(uuid)
to authenticated;

create or replace function public.current_tenant_owns_report_room(
  target_tenant_id uuid,
  target_room_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenants t
    where t.id = target_tenant_id
      and t.room_id = target_room_id
      and (
        t.profile_id = auth.uid()
        or t.email = (auth.jwt() ->> 'email')
      )
  );
$$;

grant execute on function public.current_tenant_owns_report_room(uuid, uuid)
to authenticated;

create or replace function public.claim_tenant_room(
  target_room_id uuid,
  target_rent_type text default 'monthly'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile record;
  selected_room record;
  new_tenant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Session login tidak ditemukan.';
  end if;

  if target_rent_type not in ('monthly', 'yearly') then
    raise exception 'Tipe sewa tidak valid.';
  end if;

  select p.id, p.full_name, p.email, p.phone, p.role
  into current_profile
  from public.profiles p
  where p.id = auth.uid()
    and p.role = 'tenant';

  if current_profile.id is null then
    raise exception 'Akun ini bukan tenant.';
  end if;

  if exists (
    select 1
    from public.tenants t
    where t.status = 'active'
      and (
        t.profile_id = auth.uid()
        or lower(t.email) = lower(coalesce(auth.jwt() ->> 'email', current_profile.email))
      )
  ) then
    raise exception 'Akun ini sudah terhubung ke kamar aktif.';
  end if;

  select r.id, r.property_id, r.status, r.yearly_price
  into selected_room
  from public.rooms r
  where r.id = target_room_id
  for update;

  if selected_room.id is null or selected_room.status <> 'vacant' then
    raise exception 'Kamar tidak tersedia.';
  end if;

  if target_rent_type = 'yearly' and selected_room.yearly_price is null then
    raise exception 'Sewa tahunan belum tersedia untuk kamar ini.';
  end if;

  if exists (
    select 1
    from public.tenants t
    where t.room_id = target_room_id
      and t.status = 'active'
  ) then
    raise exception 'Kamar sudah ditempati.';
  end if;

  insert into public.tenants (
    profile_id,
    property_id,
    room_id,
    full_name,
    email,
    phone,
    move_in_date,
    rent_type,
    status
  )
  values (
    current_profile.id,
    selected_room.property_id,
    selected_room.id,
    current_profile.full_name,
    current_profile.email,
    current_profile.phone,
    current_date,
    target_rent_type,
    'active'
  )
  returning id into new_tenant_id;

  update public.rooms
  set status = 'occupied'
  where id = selected_room.id;

  return new_tenant_id;
end;
$$;

grant execute on function public.claim_tenant_room(uuid, text)
to authenticated;

drop policy if exists "tenant can read own tenant row" on public.tenants;
drop policy if exists "tenant can read own room" on public.rooms;
drop policy if exists "tenant profile can read vacant rooms" on public.rooms;
drop policy if exists "tenant can read own bills" on public.bills;
drop policy if exists "tenant can update own bill after proof" on public.bills;
drop policy if exists "tenant can read own payments" on public.payments;
drop policy if exists "tenant can insert own payments" on public.payments;
drop policy if exists "tenant can read own maintenance reports" on public.maintenance_reports;
drop policy if exists "tenant can insert own maintenance reports" on public.maintenance_reports;

create policy "tenant can read own tenant row"
on public.tenants
for select
to authenticated
using (public.is_current_tenant(tenants.id));

create policy "tenant can read own room"
on public.rooms
for select
to authenticated
using (public.current_tenant_can_access_room(rooms.id));

create policy "tenant profile can read vacant rooms"
on public.rooms
for select
to authenticated
using (
  status = 'vacant'
  and public.current_user_has_role('tenant')
);

create policy "tenant can read own bills"
on public.bills
for select
to authenticated
using (public.is_current_tenant(bills.tenant_id));

create policy "tenant can update own bill after proof"
on public.bills
for update
to authenticated
using (public.is_current_tenant(bills.tenant_id))
with check (public.is_current_tenant(bills.tenant_id));

create policy "tenant can read own payments"
on public.payments
for select
to authenticated
using (public.current_tenant_can_access_bill(payments.bill_id));

create policy "tenant can insert own payments"
on public.payments
for insert
to authenticated
with check (public.current_tenant_can_access_bill(payments.bill_id));

create policy "tenant can read own maintenance reports"
on public.maintenance_reports
for select
to authenticated
using (public.is_current_tenant(maintenance_reports.tenant_id));

create policy "tenant can insert own maintenance reports"
on public.maintenance_reports
for insert
to authenticated
with check (
  public.current_tenant_owns_report_room(
    maintenance_reports.tenant_id,
    maintenance_reports.room_id
  )
);

-- ============================================================
-- 06. Activity logs policies
-- Source: activity-logs-policies.sql
-- ============================================================

grant select, insert on public.activity_logs to authenticated;
grant select on public.properties to authenticated;
grant select on public.tenants to authenticated;

drop policy if exists "owner can read own activity logs" on public.activity_logs;
drop policy if exists "owner can insert own activity logs" on public.activity_logs;
drop policy if exists "tenant can insert own property activity logs" on public.activity_logs;

create policy "owner can read own activity logs"
on public.activity_logs
for select
to authenticated
using (public.owner_owns_property(activity_logs.property_id));

create policy "owner can insert own activity logs"
on public.activity_logs
for insert
to authenticated
with check (public.owner_owns_property(activity_logs.property_id));

create policy "tenant can insert own property activity logs"
on public.activity_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tenants t
    where t.property_id = activity_logs.property_id
      and (
        t.profile_id = auth.uid()
        or t.email = (auth.jwt() ->> 'email')
      )
  )
);

-- ============================================================
-- 07. Storage buckets and policies
-- Source: storage-buckets-policies.sql
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'payment-proofs',
    'payment-proofs',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'expense-proofs',
    'expense-proofs',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'report-photos',
    'report-photos',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated can read app storage files" on storage.objects;
drop policy if exists "authenticated can upload app storage files" on storage.objects;
drop policy if exists "authenticated can update app storage files" on storage.objects;
drop policy if exists "authenticated can delete app storage files" on storage.objects;

create policy "authenticated can read app storage files"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('payment-proofs', 'expense-proofs', 'report-photos')
);

create policy "authenticated can upload app storage files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('payment-proofs', 'expense-proofs', 'report-photos')
);

create policy "authenticated can update app storage files"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('payment-proofs', 'expense-proofs', 'report-photos')
)
with check (
  bucket_id in ('payment-proofs', 'expense-proofs', 'report-photos')
);

create policy "authenticated can delete app storage files"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('payment-proofs', 'expense-proofs', 'report-photos')
);

-- ============================================================
-- 08. Auth register trigger
-- Source: register-auth-trigger.sql
-- ============================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  requested_full_name text;
  requested_phone text;
  requested_property_name text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'tenant');
  requested_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
  requested_phone := nullif(new.raw_user_meta_data->>'phone', '');
  requested_property_name := nullif(new.raw_user_meta_data->>'property_name', '');

  if requested_role not in ('owner', 'tenant') then
    requested_role := 'tenant';
  end if;

  insert into public.profiles (id, full_name, email, role, phone)
  values (
    new.id,
    requested_full_name,
    new.email,
    requested_role,
    requested_phone
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    phone = excluded.phone;

  if requested_role = 'owner' and requested_property_name is not null then
    insert into public.properties (owner_id, name)
    values (new.id, requested_property_name)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

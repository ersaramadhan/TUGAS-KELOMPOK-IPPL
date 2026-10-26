grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.properties to authenticated;
grant select on public.rooms to authenticated;
grant select on public.tenants to authenticated;
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

drop policy if exists "tenant can read own tenant row" on public.tenants;
drop policy if exists "tenant can read own room" on public.rooms;
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

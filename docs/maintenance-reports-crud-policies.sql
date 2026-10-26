grant usage on schema public to authenticated;
grant select, insert, update, delete on public.maintenance_reports to authenticated;
grant select on public.properties to authenticated;
grant select on public.rooms to authenticated;
grant select on public.tenants to authenticated;

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

drop policy if exists "owner can read own maintenance reports" on public.maintenance_reports;
drop policy if exists "owner can insert own maintenance reports" on public.maintenance_reports;
drop policy if exists "owner can update own maintenance reports" on public.maintenance_reports;
drop policy if exists "owner can delete own maintenance reports" on public.maintenance_reports;

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

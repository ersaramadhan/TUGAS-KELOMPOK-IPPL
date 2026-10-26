grant usage on schema public to authenticated;
grant select, insert, update, delete on public.bills to authenticated;
grant select on public.properties to authenticated;
grant select on public.rooms to authenticated;
grant select on public.tenants to authenticated;

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

drop policy if exists "owner can read own bills" on public.bills;
drop policy if exists "owner can insert own bills" on public.bills;
drop policy if exists "owner can update own bills" on public.bills;
drop policy if exists "owner can delete own bills" on public.bills;

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

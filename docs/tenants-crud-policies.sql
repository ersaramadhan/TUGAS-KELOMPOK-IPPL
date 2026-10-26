grant usage on schema public to authenticated;
grant select, insert, update, delete on public.tenants to authenticated;
grant select on public.properties to authenticated;
grant select on public.rooms to authenticated;

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

drop policy if exists "owner can read own tenants" on public.tenants;
drop policy if exists "owner can insert own tenants" on public.tenants;
drop policy if exists "owner can update own tenants" on public.tenants;
drop policy if exists "owner can delete own tenants" on public.tenants;

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

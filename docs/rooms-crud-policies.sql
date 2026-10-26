grant usage on schema public to authenticated;
grant select, insert, update, delete on public.rooms to authenticated;
grant select on public.properties to authenticated;

drop policy if exists "owner can insert own rooms" on public.rooms;
drop policy if exists "owner can update own rooms" on public.rooms;
drop policy if exists "owner can delete own rooms" on public.rooms;

create policy "owner can insert own rooms"
on public.rooms
for insert
to authenticated
with check (
  exists (
    select 1
    from public.properties p
    where p.id = rooms.property_id
      and p.owner_id = auth.uid()
  )
);

create policy "owner can update own rooms"
on public.rooms
for update
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = rooms.property_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = rooms.property_id
      and p.owner_id = auth.uid()
  )
);

create policy "owner can delete own rooms"
on public.rooms
for delete
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = rooms.property_id
      and p.owner_id = auth.uid()
  )
);

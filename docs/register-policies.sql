grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.properties to authenticated;

drop policy if exists "user can read own profile" on public.profiles;
drop policy if exists "user can insert own profile during register" on public.profiles;
drop policy if exists "user can update own profile" on public.profiles;
drop policy if exists "owner can read own property during register" on public.properties;
drop policy if exists "owner can create property during register" on public.properties;

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

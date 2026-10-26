grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.properties to authenticated;

drop policy if exists "owner can read own profile" on public.profiles;
drop policy if exists "owner can insert own profile" on public.profiles;
drop policy if exists "owner can update own profile" on public.profiles;
drop policy if exists "owner can read own property settings" on public.properties;
drop policy if exists "owner can insert own property settings" on public.properties;
drop policy if exists "owner can update own property settings" on public.properties;

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

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, update on public.rooms to authenticated;
grant select, insert on public.tenants to authenticated;

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

drop policy if exists "owner can read tenant signup profiles" on public.profiles;
drop policy if exists "tenant profile can read vacant rooms" on public.rooms;

create policy "owner can read tenant signup profiles"
on public.profiles
for select
to authenticated
using (
  role = 'tenant'
  and public.current_user_has_role('owner')
);

create policy "tenant profile can read vacant rooms"
on public.rooms
for select
to authenticated
using (
  status = 'vacant'
  and public.current_user_has_role('tenant')
);

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

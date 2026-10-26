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

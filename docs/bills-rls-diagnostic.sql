-- Jalankan di Supabase SQL Editor untuk mengecek kenapa insert tagihan ditolak RLS.
-- Ganti email di bawah dengan email owner yang sedang login di aplikasi.

select
  p.id as property_id,
  p.name as property_name,
  owner_profile.id as owner_id,
  owner_profile.email as owner_email,
  t.id as tenant_id,
  t.full_name as tenant_name,
  t.email as tenant_email,
  t.room_id as tenant_room_id,
  r.id as room_id,
  r.name as room_name,
  r.property_id as room_property_id,
  t.property_id = p.id as tenant_property_match,
  r.property_id = p.id as room_property_match,
  t.room_id = r.id as tenant_room_match
from public.properties p
join public.profiles owner_profile on owner_profile.id = p.owner_id
left join public.tenants t on t.property_id = p.id
left join public.rooms r on r.id = t.room_id
where owner_profile.email = 'adam@admin.kospilot'
order by r.name;

select
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'bills'
order by policyname;

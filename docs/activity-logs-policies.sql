grant usage on schema public to authenticated;
grant select, insert on public.activity_logs to authenticated;
grant select on public.properties to authenticated;
grant select on public.tenants to authenticated;

drop policy if exists "owner can read own activity logs" on public.activity_logs;
drop policy if exists "owner can insert own activity logs" on public.activity_logs;
drop policy if exists "tenant can insert own property activity logs" on public.activity_logs;

create policy "owner can read own activity logs"
on public.activity_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = activity_logs.property_id
      and p.owner_id = auth.uid()
  )
);

create policy "owner can insert own activity logs"
on public.activity_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.properties p
    where p.id = activity_logs.property_id
      and p.owner_id = auth.uid()
  )
);

create policy "tenant can insert own property activity logs"
on public.activity_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tenants t
    where t.property_id = activity_logs.property_id
      and (
        t.profile_id = auth.uid()
        or t.email = (auth.jwt() ->> 'email')
      )
  )
);

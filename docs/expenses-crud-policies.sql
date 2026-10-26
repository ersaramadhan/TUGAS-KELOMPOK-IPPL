grant usage on schema public to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select on public.properties to authenticated;

drop policy if exists "owner can read own expenses" on public.expenses;
drop policy if exists "owner can insert own expenses" on public.expenses;
drop policy if exists "owner can update own expenses" on public.expenses;
drop policy if exists "owner can delete own expenses" on public.expenses;

create policy "owner can read own expenses"
on public.expenses
for select
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = expenses.property_id
      and p.owner_id = auth.uid()
  )
);

create policy "owner can insert own expenses"
on public.expenses
for insert
to authenticated
with check (
  exists (
    select 1
    from public.properties p
    where p.id = expenses.property_id
      and p.owner_id = auth.uid()
  )
);

create policy "owner can update own expenses"
on public.expenses
for update
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = expenses.property_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = expenses.property_id
      and p.owner_id = auth.uid()
  )
);

create policy "owner can delete own expenses"
on public.expenses
for delete
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = expenses.property_id
      and p.owner_id = auth.uid()
  )
);

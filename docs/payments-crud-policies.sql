grant usage on schema public to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, update on public.bills to authenticated;
grant select on public.properties to authenticated;
grant select on public.rooms to authenticated;
grant select on public.tenants to authenticated;

create or replace function public.owner_can_access_bill(target_bill_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bills b
    join public.tenants t on t.id = b.tenant_id
    join public.properties p on p.id = t.property_id
    where b.id = target_bill_id
      and p.owner_id = auth.uid()
  );
$$;

grant execute on function public.owner_can_access_bill(uuid)
to authenticated;

create or replace function public.owner_sync_bill_status_from_payment(
  target_bill_id uuid,
  target_payment_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_bill_status text;
begin
  if target_payment_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Status verifikasi pembayaran tidak valid.';
  end if;

  if not public.owner_can_access_bill(target_bill_id) then
    raise exception 'Tagihan tidak ditemukan atau tidak dimiliki owner login.';
  end if;

  next_bill_status := case target_payment_status
    when 'approved' then 'paid'
    when 'pending' then 'pending_verification'
    else 'unpaid'
  end;

  update public.bills
  set status = next_bill_status
  where id = target_bill_id;

  return next_bill_status;
end;
$$;

grant execute on function public.owner_sync_bill_status_from_payment(uuid, text)
to authenticated;

drop policy if exists "owner can read own payments" on public.payments;
drop policy if exists "owner can insert own payments" on public.payments;
drop policy if exists "owner can update own payments" on public.payments;
drop policy if exists "owner can delete own payments" on public.payments;
drop policy if exists "owner can update bills from payments" on public.bills;

create policy "owner can read own payments"
on public.payments
for select
to authenticated
using (public.owner_can_access_bill(payments.bill_id));

create policy "owner can insert own payments"
on public.payments
for insert
to authenticated
with check (public.owner_can_access_bill(payments.bill_id));

create policy "owner can update own payments"
on public.payments
for update
to authenticated
using (public.owner_can_access_bill(payments.bill_id))
with check (public.owner_can_access_bill(payments.bill_id));

create policy "owner can delete own payments"
on public.payments
for delete
to authenticated
using (public.owner_can_access_bill(payments.bill_id));

create policy "owner can update bills from payments"
on public.bills
for update
to authenticated
using (public.owner_can_access_bill(bills.id))
with check (public.owner_can_access_bill(bills.id));

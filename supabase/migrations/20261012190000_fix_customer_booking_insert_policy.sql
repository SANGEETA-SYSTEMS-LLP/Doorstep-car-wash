create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select customer.id
  from public.customers as customer
  where customer.user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_customer_id() from public;
grant execute on function public.current_customer_id() to authenticated;

drop policy if exists customers_insert_own_bookings
  on public.bookings;

create policy customers_insert_own_bookings
  on public.bookings
  for insert
  to authenticated
  with check (
    customer_id = (select public.current_customer_id())
  );

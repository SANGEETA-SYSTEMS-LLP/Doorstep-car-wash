drop policy if exists customers_insert_own_bookings
  on public.bookings;

create policy customers_insert_own_bookings
  on public.bookings
  for insert
  to authenticated
  with check (
    customer_id = (select auth.uid())
  );

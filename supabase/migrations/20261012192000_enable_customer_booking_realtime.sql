drop policy if exists customers_select_own_bookings
  on public.bookings;

create policy customers_select_own_bookings
  on public.bookings
  for select
  to authenticated
  using (
    customer_id = (select public.current_customer_id())
  );

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookings'
  ) then
    alter publication supabase_realtime
      add table public.bookings;
  end if;
end;
$$;

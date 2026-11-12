-- Targeted repair: requires public.customers and public.bookings. Safe to rerun.
BEGIN;
create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  booking_number text,
  event_type text not null,
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists customer_notifications_customer_created_idx
  on public.customer_notifications (customer_id, created_at desc);

alter table public.customer_notifications enable row level security;

drop policy if exists "Customers can read their own notifications"
  on public.customer_notifications;
create policy "Customers can read their own notifications"
  on public.customer_notifications
  for select
  to authenticated
  using (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_notifications.customer_id AND c.user_id = (SELECT auth.uid())));

drop policy if exists "Customers can mark their own notifications read"
  on public.customer_notifications;
create policy "Customers can mark their own notifications read"
  on public.customer_notifications
  for update
  to authenticated
  using (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_notifications.customer_id AND c.user_id = (SELECT auth.uid()))
    and read_at is null
  )
  with check (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_notifications.customer_id AND c.user_id = (SELECT auth.uid()))
    and read_at is not null
  );

grant select on public.customer_notifications to authenticated;
revoke update on public.customer_notifications from anon, authenticated;
grant update (read_at) on public.customer_notifications to authenticated;
revoke insert, delete on public.customer_notifications from anon, authenticated;

create or replace function public.create_customer_booking_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  notification_title text;
  notification_message text;
  notification_type text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  notification_type := coalesce(new.status::text, 'booking_update');
  notification_title := case new.status::text
    when 'pending' then 'Booking received'
    when 'payment_completed' then 'Payment confirmed'
    when 'finding_washer' then 'Finding your washer'
    when 'washer_assigned' then 'Washer assigned'
    when 'washer_on_the_way' then 'Washer on the way'
    when 'washer_arrived' then 'Washer has arrived'
    when 'otp_verified' then 'Service verified'
    when 'service_started' then 'Service started'
    when 'service_completed' then 'Service completed'
    when 'completed' then 'Booking complete'
    when 'customer_approved' then 'Extra charge approved'
    when 'customer_rejected' then 'Extra charge declined'
    when 'customer_confirmed' then 'Booking complete'
    when 'rejected' then 'Booking update'
    when 'expired' then 'Booking update'
    when 'cancelled' then 'Booking cancelled'
    when 'payment_failed' then 'Payment unsuccessful'
    else 'Booking update'
  end;

  notification_message := case new.status::text
    when 'pending' then 'Your booking has been received. We will keep you updated.'
    when 'payment_completed' then 'Your payment was successful.'
    when 'finding_washer' then 'We are finding a washer for your booking.'
    when 'washer_assigned' then 'A washer has been assigned to your booking.'
    when 'washer_on_the_way' then 'Your washer is on the way to your location.'
    when 'washer_arrived' then 'Your washer has arrived at your location.'
    when 'otp_verified' then 'Your service verification is complete.'
    when 'service_started' then 'Your car wash service has started.'
    when 'service_completed' then 'Your service is complete and awaiting final review.'
    when 'completed' then 'Your booking is complete. Thank you!'
    when 'customer_approved' then 'You approved the additional service charge.'
    when 'customer_rejected' then 'You declined the additional service charge.'
    when 'customer_confirmed' then 'Your booking is complete. Thank you!'
    when 'rejected' then 'We could not assign a washer to this booking. Please check your booking for details.'
    when 'expired' then 'The washer assignment window expired. Please check your booking for the latest update.'
    when 'cancelled' then 'Your booking has been cancelled.'
    when 'payment_failed' then 'Your payment could not be completed. Please review your booking.'
    else 'Your booking status changed to ' ||
      replace(coalesce(new.status::text, 'updated'), '_', ' ') || '.'
  end;

  insert into public.customer_notifications (
    customer_id,
    booking_id,
    booking_number,
    event_type,
    title,
    message
  )
  values (
    new.customer_id,
    new.id,
    new.booking_number,
    notification_type,
    notification_title,
    case
      when new.booking_number is not null
        then 'Booking ' || new.booking_number || ': ' || notification_message
      else notification_message
    end
  );

  return new;
end;
$$;

drop trigger if exists bookings_create_customer_notification
  on public.bookings;
drop trigger if exists bookings_create_customer_notification_insert
  on public.bookings;
create trigger bookings_create_customer_notification_insert
  after insert on public.bookings
  for each row execute function public.create_customer_booking_notification();

drop trigger if exists bookings_create_customer_notification_status
  on public.bookings;
create trigger bookings_create_customer_notification_status
  after update of status on public.bookings
  for each row execute function public.create_customer_booking_notification();

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
      and tablename = 'customer_notifications'
  ) then
    alter publication supabase_realtime
      add table public.customer_notifications;
  end if;
end;
$$;

REVOKE ALL ON FUNCTION public.create_customer_booking_notification() FROM PUBLIC;
COMMIT;
NOTIFY pgrst, 'reload schema';



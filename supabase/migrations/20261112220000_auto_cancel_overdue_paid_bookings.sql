-- Automatically cancel a paid booking when the scheduled start plus its
-- package duration and the standard 30-minute scheduling buffer have passed.
-- Full captured payment is sent back to the original payment method.
create or replace function public.cancel_overdue_paid_service_bookings()
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare
  item record;
  cancelled_count integer := 0;
  paid_paise bigint;
begin
  for item in
    select b.id, b.customer_id, b.assigned_washer_id, b.status, b.platform_fee,
           p.id as payment_id, p.amount
      from public.bookings b
      join public.service_packages package on package.id=b.package_id
      join public.payments p on p.booking_id=b.id and p.status='paid'
        and lower(coalesce(p.provider,''))='razorpay'
        and nullif(p.provider_payment_id,'') is not null
     where b.status::text in ('payment_completed','washer_assigned','washer_on_the_way',
           'washer_arrived','otp_verified','service_started','service_completed')
       and b.service_validated_at is null
       and b.scheduled_date is not null and b.scheduled_start_time is not null
       and (((b.scheduled_date + b.scheduled_start_time) at time zone 'Asia/Kolkata')
           + make_interval(mins => coalesce(package.duration_minutes,60) + 30)) <= now()
       and not exists(select 1 from public.booking_cancellations c where c.booking_id=b.id)
       -- Payment-completed bookings with an unaccepted offer also expire after
       -- their service window, but only after at least one offer expired and
       -- there is no active offer or accepted washer remaining.
       and (b.status::text <> 'payment_completed' or (
         b.assigned_washer_id is null
         and exists(select 1 from public.booking_assignments expired_offer
           where expired_offer.booking_id=b.id and expired_offer.status in ('expired','rejected')
             and expired_offer.expires_at <= now())
         and not exists(select 1 from public.booking_assignments active_offer
           where active_offer.booking_id=b.id and active_offer.status='pending'
             and active_offer.expires_at > now())
         and not exists(select 1 from public.booking_assignments accepted_offer
           where accepted_offer.booking_id=b.id and accepted_offer.status='accepted')
       ))
     order by b.scheduled_date, b.scheduled_start_time
     limit 200
     for update of b skip locked
  loop
    paid_paise := round(item.amount * 100)::bigint;
    insert into public.booking_cancellations (
      booking_id, customer_id, payment_id, refund_amount_paise,
      platform_fee_paise, status, provider_status
    ) values (
      item.id, item.customer_id, item.payment_id, paid_paise,
      0, 'refund_pending', 'auto_service_deadline_exceeded'
    ) on conflict (booking_id) do nothing;

    if not found then continue; end if;

    update public.bookings set status='cancelled', updated_at=now()
      where id=item.id and service_validated_at is null;
    if not found then
      delete from public.booking_cancellations where booking_id=item.id
        and provider_status='auto_service_deadline_exceeded';
      continue;
    end if;

    update public.booking_assignments set status='cancelled', responded_at=now(),
      rejection_reason='Booking auto-cancelled because the paid service deadline passed.'
      where booking_id=item.id and status in ('pending','accepted');

    if item.assigned_washer_id is not null then
      update public.washers w set status='available', updated_at=now()
       where w.id=item.assigned_washer_id and w.status='busy'
         and not exists(select 1 from public.bookings other
          where other.assigned_washer_id=w.id and other.id<>item.id
            and other.status::text in ('washer_assigned','washer_on_the_way','washer_arrived',
              'otp_verified','service_started','service_completed'));
    end if;
    cancelled_count := cancelled_count + 1;
  end loop;
  return cancelled_count;
end $$;

revoke all on function public.cancel_overdue_paid_service_bookings() from public,anon,authenticated;
grant execute on function public.cancel_overdue_paid_service_bookings() to service_role;

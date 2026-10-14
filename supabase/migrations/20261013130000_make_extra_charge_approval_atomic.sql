alter table public.extra_charge_requests
  add column if not exists customer_responded_at timestamptz,
  add column if not exists supervisor_id uuid references auth.users(id) on delete set null,
  add column if not exists supervisor_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.bookings
  add column if not exists extra_charge numeric(10, 2) not null default 0;

create or replace function public.respond_extra_charge(
  p_request_id uuid,
  p_booking_id uuid,
  p_customer_user_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
  v_request public.extra_charge_requests%rowtype;
  v_booking public.bookings%rowtype;
  v_extra numeric;
  v_total numeric;
begin
  if p_action not in ('approve', 'reject') then
    raise exception 'Invalid action.' using errcode = '22023';
  end if;

  select id into v_customer_id
    from public.customers
   where user_id = p_customer_user_id;
  if not found then
    raise exception 'Customer profile not found.' using errcode = '42501';
  end if;

  select * into v_request
    from public.extra_charge_requests
   where id = p_request_id
   for update;
  if not found then
    raise exception 'Extra charge request not found.' using errcode = 'P0002';
  end if;

  select * into v_booking
    from public.bookings
   where id = v_request.booking_id
   for update;
  if not found or v_booking.customer_id <> v_customer_id then
    raise exception 'Booking not found.' using errcode = '42501';
  end if;

  if v_request.booking_id <> p_booking_id then
    raise exception 'Extra charge request does not belong to this booking.' using errcode = '42501';
  end if;

  if v_request.status is distinct from 'approved' then
    raise exception 'Extra charge is no longer awaiting customer approval.' using errcode = '40001';
  end if;

  if p_action = 'reject' then
    update public.extra_charge_requests
       set status = 'customer_rejected',
           customer_responded_at = now(),
           updated_at = now()
     where id = p_request_id
     returning * into v_request;
    return jsonb_build_object('approved', false, 'request', to_jsonb(v_request));
  end if;

  if v_request.requested_amount is null or v_request.requested_amount <= 0 then
    raise exception 'Extra charge amount is invalid.' using errcode = '22023';
  end if;

  update public.bookings
     set extra_charge = coalesce(extra_charge, 0) + v_request.requested_amount,
         total_amount = coalesce(total_amount, 0) + v_request.requested_amount,
         updated_at = now()
   where id = v_booking.id
   returning extra_charge, total_amount into v_extra, v_total;

  update public.extra_charge_requests
     set status = 'customer_approved',
         customer_responded_at = now(),
         updated_at = now()
   where id = p_request_id
   returning * into v_request;

  return jsonb_build_object(
    'approved', true,
    'extraCharge', v_extra,
    'totalAmount', v_total,
    'request', to_jsonb(v_request)
  );
end;
$$;

revoke all on function public.respond_extra_charge(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.respond_extra_charge(uuid, uuid, uuid, text) to service_role;

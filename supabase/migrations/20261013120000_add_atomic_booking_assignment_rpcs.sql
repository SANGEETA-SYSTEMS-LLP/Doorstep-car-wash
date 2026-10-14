create function public.booking_washer_is_eligible(
  p_booking_id uuid,
  p_washer_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking record;
  v_washer record;
  v_location record;
  v_package record;
  v_distance_km double precision;
  v_conflict boolean;
begin
  select id, status, assigned_washer_id, package_id, scheduled_date,
         scheduled_start_time, latitude, longitude
    into v_booking
    from public.bookings
   where id = p_booking_id;

  if not found
     or v_booking.assigned_washer_id is not null
     or v_booking.status not in ('pending', 'confirmed', 'finding_washer', 'support_escalated')
     or v_booking.scheduled_date is null
     or v_booking.scheduled_start_time is null
     or v_booking.latitude is null
     or v_booking.longitude is null then
    return false;
  end if;

  select id, status, is_active, service_radius_km
    into v_washer
    from public.washers
   where id = p_washer_id;

  if not found or not v_washer.is_active or v_washer.status <> 'available' then
    return false;
  end if;

  select latitude, longitude, updated_at
    into v_location
    from public.washer_locations
   where washer_id = p_washer_id;

  if not found
     or v_location.updated_at is null
     or v_location.latitude is null
     or v_location.longitude is null
     or v_location.latitude not between -90 and 90
     or v_location.longitude not between -180 and 180
     or v_location.updated_at < now() - interval '15 minutes' then
    return false;
  end if;

  v_distance_km := 2 * 6371 * asin(sqrt(least(1::double precision, greatest(0::double precision,
    power(sin(radians((v_location.latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_location.latitude)) *
    power(sin(radians((v_location.longitude - v_booking.longitude) / 2)), 2)
  ))));

  if v_distance_km > coalesce(nullif(v_washer.service_radius_km, 0), 5) then
    return false;
  end if;

  select service_id, duration_minutes
    into v_package
    from public.service_packages
   where id = v_booking.package_id;

  if found and v_package.service_id is not null and not exists (
    select 1 from public.washer_skills
     where washer_id = p_washer_id
       and service_id = v_package.service_id
  ) then
    return false;
  end if;

  select exists (
    select 1
      from public.bookings existing
      left join public.service_packages existing_package
        on existing_package.id = existing.package_id
     where existing.assigned_washer_id = p_washer_id
       and existing.id <> p_booking_id
       and existing.status in (
         'washer_assigned', 'washer_on_the_way', 'washer_arrived',
         'otp_verified', 'service_started', 'service_completed'
       )
       and existing.scheduled_date is not null
       and existing.scheduled_start_time is not null
       and (
         v_booking.scheduled_date::date + v_booking.scheduled_start_time::time
       ) < (
         existing.scheduled_date::date + existing.scheduled_start_time::time
         + make_interval(mins => coalesce(existing_package.duration_minutes, 60))
       )
       and (
         existing.scheduled_date::date + existing.scheduled_start_time::time
       ) < (
         v_booking.scheduled_date::date + v_booking.scheduled_start_time::time
         + make_interval(mins => coalesce(v_package.duration_minutes, 60))
       )
  ) into v_conflict;

  return not v_conflict;
end;
$$;

create function public.accept_booking_assignment(p_assignment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_washer_id uuid;
  v_assignment public.booking_assignments%rowtype;
  v_booking public.bookings%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  select id into v_washer_id
    from public.washers
   where user_id = v_user_id
     and is_active = true;
  if not found then
    raise exception 'Active washer profile not found.' using errcode = '42501';
  end if;

  select * into v_assignment
    from public.booking_assignments
   where id = p_assignment_id
   for update;
  if not found or v_assignment.washer_id <> v_washer_id then
    raise exception 'Assignment not found.' using errcode = '42501';
  end if;
  if v_assignment.status <> 'pending'
     or v_assignment.expires_at is null
     or v_assignment.expires_at <= now() then
    raise exception 'Assignment is no longer available.' using errcode = '40001';
  end if;

  perform 1
    from public.washers
   where id = v_washer_id
   for update;

  select * into v_booking
    from public.bookings
   where id = v_assignment.booking_id
   for update;
  if not found or not public.booking_washer_is_eligible(v_booking.id, v_washer_id) then
    raise exception 'Booking is no longer eligible for this washer.' using errcode = '40001';
  end if;

  update public.bookings
     set assigned_washer_id = v_washer_id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   where id = v_booking.id
   returning * into v_booking;

  update public.booking_assignments
     set status = 'accepted',
         responded_at = now()
   where id = v_assignment.id
   returning * into v_assignment;

  return jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'assignment', to_jsonb(v_assignment)
  );
end;
$$;

create function public.supervisor_assign_washer(
  p_booking_id uuid,
  p_washer_id uuid,
  p_supervisor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_booking public.bookings%rowtype;
  v_assignment public.booking_assignments%rowtype;
  v_has_assignment boolean := false;
  v_location record;
  v_distance_km double precision;
  v_attempt_number integer;
begin
  select role into v_role
    from public.profiles
   where id = p_supervisor_id;
  if v_role not in ('supervisor', 'sub_admin', 'super_admin') then
    raise exception 'Supervisor permission required.' using errcode = '42501';
  end if;

  select * into v_assignment
    from public.booking_assignments
   where booking_id = p_booking_id
     and washer_id = p_washer_id
   for update;
  v_has_assignment := found;

  perform 1
    from public.washers
   where id = p_washer_id
   for update;
  if not found then
    raise exception 'Washer not found.' using errcode = 'P0002';
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id
   for update;
  if not found then
    raise exception 'Booking not found.' using errcode = 'P0002';
  end if;

  if not public.booking_washer_is_eligible(p_booking_id, p_washer_id) then
    raise exception 'Washer is no longer eligible for this booking.' using errcode = '40001';
  end if;

  select latitude, longitude into v_location
    from public.washer_locations
   where washer_id = p_washer_id;
  v_distance_km := 2 * 6371 * asin(sqrt(
    power(sin(radians((v_location.latitude - v_booking.latitude) / 2)), 2) +
    cos(radians(v_booking.latitude)) * cos(radians(v_location.latitude)) *
    power(sin(radians((v_location.longitude - v_booking.longitude) / 2)), 2)
  ));

  update public.bookings
     set assigned_washer_id = p_washer_id,
         status = 'washer_assigned',
         requires_supervisor = false,
         updated_at = now()
   where id = p_booking_id
   returning * into v_booking;

  if v_has_assignment then
    update public.booking_assignments
       set status = 'accepted',
           responded_at = now(),
           rejection_reason = null
     where id = v_assignment.id
     returning * into v_assignment;
  else
    select coalesce(max(attempt_number), 0) + 1
      into v_attempt_number
      from public.booking_assignments
     where booking_id = p_booking_id;

    insert into public.booking_assignments (
      booking_id, washer_id, status, distance_km, attempt_number,
      offered_at, expires_at, responded_at, rejection_reason
    ) values (
      p_booking_id, p_washer_id, 'accepted', round(v_distance_km::numeric, 2),
      v_attempt_number, now(), now(), now(), null
    )
    returning * into v_assignment;
  end if;

  return jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'assignment', to_jsonb(v_assignment)
  );
end;
$$;

revoke all on function public.booking_washer_is_eligible(uuid, uuid) from public, anon, authenticated;
revoke all on function public.accept_booking_assignment(uuid) from public, anon;
revoke all on function public.supervisor_assign_washer(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.accept_booking_assignment(uuid) to authenticated;
grant execute on function public.booking_washer_is_eligible(uuid, uuid) to service_role;
grant execute on function public.supervisor_assign_washer(uuid, uuid, uuid) to service_role;

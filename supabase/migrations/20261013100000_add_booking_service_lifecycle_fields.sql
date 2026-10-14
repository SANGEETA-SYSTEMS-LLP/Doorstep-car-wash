alter table public.bookings
  add column if not exists service_otp_hash text,
  add column if not exists service_otp_expires_at timestamptz,
  add column if not exists washer_arrived_at timestamptz,
  add column if not exists otp_verified_at timestamptz,
  add column if not exists service_started_at timestamptz,
  add column if not exists service_completed_at timestamptz,
  add column if not exists service_validated_at timestamptz,
  add column if not exists service_validated_by uuid,
  add column if not exists service_validated_role text,
  add column if not exists completed_at timestamptz;

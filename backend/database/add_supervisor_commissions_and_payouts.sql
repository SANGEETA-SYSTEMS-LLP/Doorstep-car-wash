-- Supervisor commission mirrors the package rate on the amount remaining
-- after platform fee and GST. Those two charge amounts remain with the admin.
BEGIN;

CREATE TABLE IF NOT EXISTS public.supervisor_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
  supervisor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  washer_id uuid NOT NULL REFERENCES public.washers(id) ON DELETE RESTRICT,
  gross_amount numeric(12,2) NOT NULL CHECK (gross_amount >= 0),
  platform_fee_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee_amount >= 0),
  gst_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
  commission_base_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (commission_base_amount >= 0),
  supervisor_amount numeric(12,2) NOT NULL CHECK (supervisor_amount >= 0),
  commission_percent numeric(5,2) NOT NULL CHECK (commission_percent BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','settled')),
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supervisor_earnings_payable_idx
  ON public.supervisor_earnings (supervisor_id, status, created_at);
ALTER TABLE public.supervisor_earnings
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee_amount >= 0),
  ADD COLUMN IF NOT EXISTS gst_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
  ADD COLUMN IF NOT EXISTS commission_base_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (commission_base_amount >= 0);
-- Recalculate unpaid supervisor earnings created under the earlier formula.
UPDATE public.supervisor_earnings earning
   SET platform_fee_amount = greatest(coalesce(booking.platform_fee, 0), 0),
       gst_amount = greatest(coalesce(booking.tax_amount, 0), 0),
       commission_base_amount = greatest(coalesce(booking.total_amount, 0)
         - greatest(coalesce(booking.platform_fee, 0), 0)
         - greatest(coalesce(booking.tax_amount, 0), 0), 0),
       supervisor_amount = round(greatest(coalesce(booking.total_amount, 0)
         - greatest(coalesce(booking.platform_fee, 0), 0)
         - greatest(coalesce(booking.tax_amount, 0), 0), 0) * earning.commission_percent / 100, 2)
  FROM public.bookings booking
 WHERE booking.id = earning.booking_id AND earning.status = 'pending'
   AND earning.payout_operation_id IS NULL;

CREATE TABLE IF NOT EXISTS public.supervisor_payout_accounts (
  supervisor_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  fund_account_id text,
  destination_encrypted text,
  account_label text NOT NULL,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supervisor_payout_account_has_destination
    CHECK (fund_account_id IS NOT NULL OR destination_encrypted IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.supervisor_payout_operations (
  id uuid PRIMARY KEY,
  supervisor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','pending','processed','failed','reversed','cancelled')),
  provider_id text UNIQUE,
  provider_status text,
  provider_request jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.supervisor_earnings
  ADD COLUMN IF NOT EXISTS payout_operation_id uuid REFERENCES public.supervisor_payout_operations(id);

CREATE OR REPLACE FUNCTION public.reserve_supervisor_payout(
  p_id uuid, p_supervisor_id uuid, p_actor uuid, p_reason text, p_account_number text
) RETURNS public.supervisor_payout_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE v_operation public.supervisor_payout_operations%rowtype; v_amount bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role IN ('accountant','super_admin') AND is_active = true) THEN
    RAISE EXCEPTION 'Finance role required.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_supervisor_id AND role = 'supervisor' AND is_active = true) THEN
    RAISE EXCEPTION 'Active supervisor not found.';
  END IF;
  SELECT * INTO v_operation FROM public.supervisor_payout_operations WHERE id = p_id;
  IF FOUND THEN
    IF v_operation.supervisor_id <> p_supervisor_id THEN RAISE EXCEPTION 'Payout request ID is already used.'; END IF;
    RETURN v_operation;
  END IF;
  PERFORM id FROM public.supervisor_earnings WHERE supervisor_id = p_supervisor_id AND status = 'pending' AND payout_operation_id IS NULL FOR UPDATE;
  SELECT round(sum(supervisor_amount) * 100)::bigint INTO v_amount FROM public.supervisor_earnings
   WHERE supervisor_id = p_supervisor_id AND status = 'pending' AND payout_operation_id IS NULL;
  IF coalesce(v_amount, 0) < 100 THEN RAISE EXCEPTION 'No eligible supervisor earnings are available.'; END IF;
  INSERT INTO public.supervisor_payout_operations(id, supervisor_id, amount_paise, reason, created_by,
    provider_request) VALUES (p_id, p_supervisor_id, v_amount, p_reason, p_actor,
      jsonb_build_object('account_number', p_account_number)) RETURNING * INTO v_operation;
  UPDATE public.supervisor_earnings SET payout_operation_id = p_id
   WHERE supervisor_id = p_supervisor_id AND status = 'pending' AND payout_operation_id IS NULL;
  RETURN v_operation;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reconcile_supervisor_payout(
  p_id uuid, p_provider_id text, p_status text
) RETURNS public.supervisor_payout_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
DECLARE v_operation public.supervisor_payout_operations%rowtype; v_status text;
BEGIN
  SELECT * INTO v_operation FROM public.supervisor_payout_operations WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Supervisor payout not found.'; END IF;
  v_status := CASE lower(p_status)
    WHEN 'pending' THEN 'pending' WHEN 'queued' THEN 'pending' WHEN 'processing' THEN 'pending' WHEN 'initiated' THEN 'pending'
    WHEN 'processed' THEN 'processed' WHEN 'failed' THEN 'failed' WHEN 'reversed' THEN 'reversed'
    WHEN 'cancelled' THEN 'failed' WHEN 'rejected' THEN 'failed' ELSE NULL END;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Unsupported payout status.'; END IF;
  IF v_operation.status IN ('processed','reversed','cancelled') THEN RETURN v_operation; END IF;
  UPDATE public.supervisor_payout_operations SET provider_id = coalesce(provider_id, p_provider_id),
    provider_status = p_status, status = v_status, updated_at = now(),
    processed_at = CASE WHEN v_status = 'processed' THEN coalesce(processed_at, now()) ELSE processed_at END
   WHERE id = p_id RETURNING * INTO v_operation;
  IF v_status = 'processed' THEN
    UPDATE public.supervisor_earnings SET status = 'settled', settled_at = coalesce(settled_at, now()) WHERE payout_operation_id = p_id;
  ELSIF v_status IN ('failed','reversed') THEN
    UPDATE public.supervisor_earnings SET payout_operation_id = NULL WHERE payout_operation_id = p_id AND status = 'pending';
  END IF;
  RETURN v_operation;
END;
$function$;

REVOKE ALL ON FUNCTION public.reserve_supervisor_payout(uuid,uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reconcile_supervisor_payout(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_supervisor_payout(uuid,uuid,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_supervisor_payout(uuid,text,text) TO service_role;

ALTER TABLE public.supervisor_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisor_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisor_payout_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_earnings, public.supervisor_payout_accounts, public.supervisor_payout_operations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.supervisor_earnings, public.supervisor_payout_accounts, public.supervisor_payout_operations TO service_role;

COMMIT;

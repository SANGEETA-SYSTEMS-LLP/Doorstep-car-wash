-- Required supervisor home/service pin used to scope operations to a 7 km area.
BEGIN;

CREATE TABLE IF NOT EXISTS public.supervisor_service_areas (
  supervisor_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  address text NOT NULL CHECK (char_length(btrim(address)) BETWEEN 10 AND 500),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supervisor_service_areas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_service_areas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supervisor_service_areas TO service_role;

COMMIT;

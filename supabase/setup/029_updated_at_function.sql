-- =========================================================
-- FILE: 029_updated_at_function.sql
-- MODULE: Common
-- PURPOSE: Automatically maintain updated_at timestamps
-- RUN AFTER: All main tables
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;



-- =========================================================
-- FILE: 017_booking_sequence.sql
-- MODULE: Booking
-- PURPOSE: Sequence used for human-readable booking numbers
-- RUN AFTER: 016_washer_skills.sql
-- =========================================================

CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq
START WITH 10001
INCREMENT BY 1
MINVALUE 10001
NO MAXVALUE
CACHE 1;



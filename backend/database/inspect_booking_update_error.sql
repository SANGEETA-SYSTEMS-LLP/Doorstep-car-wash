-- Read-only: find database functions introducing the invalid booking status.
SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_functiondef(p.oid) AS function_sql
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.prosrc ILIKE '%booking_update%';

-- Check whether payment_method exists on bookings and payments, and inspect
-- the status column types/defaults used by booking writes.
SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('bookings', 'payments', 'booking_status_history')
  AND column_name IN ('payment_method', 'status')
ORDER BY table_name, column_name;

-- List enum labels and CHECK constraints that define valid booking statuses.
SELECT c.relname AS table_name, a.attname AS column_name,
       t.typname AS enum_type, e.enumlabel AS allowed_value
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_type t ON t.oid = a.atttypid
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('bookings', 'booking_status_history')
  AND a.attname = 'status'
  AND NOT a.attisdropped
ORDER BY c.relname, e.enumsortorder;

SELECT c.relname AS table_name, con.conname AS constraint_name,
       pg_get_constraintdef(con.oid) AS constraint_sql
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('bookings', 'booking_status_history')
  AND con.contype = 'c'
  AND pg_get_constraintdef(con.oid) ILIKE '%status%'
ORDER BY c.relname, con.conname;

-- Identify the triggers called during booking creation and notification writes.
SELECT c.relname AS table_name, t.tgname AS trigger_name,
       p.proname AS function_name, pg_get_triggerdef(t.oid) AS trigger_sql,
       pg_get_functiondef(p.oid) AS function_sql
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public' AND NOT t.tgisinternal
  AND c.relname IN ('bookings', 'booking_status_history', 'notifications', 'customer_notifications')
ORDER BY c.relname, t.tgname;

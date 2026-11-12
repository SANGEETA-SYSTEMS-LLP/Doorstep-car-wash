-- =========================================================
-- FILE: 030_updated_at_triggers.sql
-- MODULE: Common
-- PURPOSE: Attach updated_at function to relevant tables
-- RUN AFTER: 029_updated_at_function.sql
-- =========================================================


-- PROFILES
DROP TRIGGER IF EXISTS profiles_updated_at
ON public.profiles;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- CUSTOMERS
DROP TRIGGER IF EXISTS customers_updated_at
ON public.customers;

CREATE TRIGGER customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- SOCIETIES
DROP TRIGGER IF EXISTS societies_updated_at
ON public.societies;

CREATE TRIGGER societies_updated_at
BEFORE UPDATE ON public.societies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- SERVICE ZONES
DROP TRIGGER IF EXISTS service_zones_updated_at
ON public.service_zones;

CREATE TRIGGER service_zones_updated_at
BEFORE UPDATE ON public.service_zones
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- CUSTOMER ADDRESSES
DROP TRIGGER IF EXISTS customer_addresses_updated_at
ON public.customer_addresses;

CREATE TRIGGER customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- VEHICLES
DROP TRIGGER IF EXISTS vehicles_updated_at
ON public.vehicles;

CREATE TRIGGER vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- SERVICES
DROP TRIGGER IF EXISTS services_updated_at
ON public.services;

CREATE TRIGGER services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- SERVICE PACKAGES
DROP TRIGGER IF EXISTS service_packages_updated_at
ON public.service_packages;

CREATE TRIGGER service_packages_updated_at
BEFORE UPDATE ON public.service_packages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- WASHERS
DROP TRIGGER IF EXISTS washers_updated_at
ON public.washers;

CREATE TRIGGER washers_updated_at
BEFORE UPDATE ON public.washers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- BOOKINGS
DROP TRIGGER IF EXISTS bookings_updated_at
ON public.bookings;

CREATE TRIGGER bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- EXTRA CHARGE REQUESTS
DROP TRIGGER IF EXISTS extra_charge_requests_updated_at
ON public.extra_charge_requests;

CREATE TRIGGER extra_charge_requests_updated_at
BEFORE UPDATE ON public.extra_charge_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- PAYMENTS
DROP TRIGGER IF EXISTS payments_updated_at
ON public.payments;

CREATE TRIGGER payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();



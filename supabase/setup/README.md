# Fresh-install baseline

Run `001_extensions.sql` through `051_supervisor_manual_assignment.sql` in filename order on a new, empty Supabase database only. The baseline creates the project enums, profiles, customer/address/vehicle records, service catalog, washers, bookings, payments, earnings, RLS, starter catalog, and initial functions. The timestamped migrations then upgrade that baseline to the current application contract.

For the full run order and existing-database guidance, see [`../README.md`](../README.md). Never replay these files on a live database.

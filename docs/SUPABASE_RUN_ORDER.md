# Supabase SQL run order

The complete database source is restored and maintained under [`supabase/`](../supabase/README.md).

For a **new empty Supabase project**:

1. Run `supabase/setup/*.sql` in numeric order (001–051).
2. Run `supabase/migrations/*.sql` in filename order.
3. Run `supabase/verification/verify_installation.sql`.
4. Run `supabase/verification/verify_application_contract.sql`.
5. Keep the app offline until all security/workflow SQL has succeeded; then configure authorized staff accounts and provider credentials.

Optionally generate and run `supabase/FRESH_INSTALL.sql` as one file on a new empty project only. Stop on the first error.

For an existing database, do not run the baseline or combined fresh installer. Compare the deployed schema and migration history, back up the database, and apply only reviewed missing forward migrations. One-off scripts that are not in the install chain are under `supabase/operations/` and must be reviewed individually.

SQL has not been applied to hosted Supabase as part of this work.

# Supabase run order

Start with [the setup instructions](../supabase/README.md).

1. For a NEW EMPTY database, run all SQL files in supabase/setup in numeric filename order (001–100).
2. Run verification/verify_installation.sql.
3. Run verification/verify_application_contract.sql.

[Every file explained](../supabase/setup/README.md). Stop on the first error; complete all security files before using the app.

For an existing database, do not replay fresh setup. Compare its schema and apply appropriate forward migrations. The former large files are preserved in database-history/large-setup-before-split-20261015. No hosted database was modified.

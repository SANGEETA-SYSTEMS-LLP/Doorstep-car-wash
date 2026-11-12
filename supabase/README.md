# Car wash database setup

This folder contains the repeatable schema source used by the current app.

## New empty Supabase project

1. Open a database backup/versioned project before making changes.
2. Run every `setup/*.sql` file in numeric filename order (001–051).
3. Run every `migrations/*.sql` file in filename order. The timestamped migrations first apply the preserved application upgrades through 15 October, then current booking, customer, washer, supervisor, payment and finance upgrades.
4. Run `verification/verify_installation.sql` and `verification/verify_application_contract.sql`.
5. Keep the application offline until all security and workflow migrations have completed. Create staff roles by an authorized operator; do not edit account role rows to seed a super admin without verifying the account identity.

To create one combined SQL file after editing the source files, run from the repository root:

```powershell
node supabase/tools/build-fresh-install.mjs
```

It writes `supabase/FRESH_INSTALL.sql`. Use that output only on a brand-new empty project. Stop on the first SQL error.

## Existing Supabase project

Do not run `setup/` or `FRESH_INSTALL.sql` on an existing project. Compare the deployed schema and migration history, back up the database, and apply only migrations that have not already run. Some scripts deliberately fail when they detect duplicate active payments or duplicate offer use; reconcile the records instead of deleting financial/history rows.

All SQL source is kept under this `supabase/` directory. `archive/` preserves the reviewed prior baseline, `operations/` holds one-off diagnostics/repairs that must not be replayed as part of installation, and `migrations/` is the single ordered application-upgrade path. `backend/database/README.md` is only a pointer for IDE users; it contains no SQL scripts.

No SQL in this work has been applied to a hosted Supabase database. The SQL targets the project code contracts; verify staging and provider-specific workflows before production.

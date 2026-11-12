# Backend database SQL reference

All database SQL has one home: [`supabase/`](../../supabase/README.md). Use `supabase/setup/`, then `supabase/migrations/`, and finally `supabase/verification/` for a new empty database. The generated one-file installer is `supabase/FRESH_INSTALL.sql`.

The older `backend/database/` path is retained only as this pointer because it appears in IDE links and historical documentation. Do not place or run separate SQL copies here. For existing databases, inspect deployed schema/data and migration history, back up, and apply only appropriate missing forward migrations. No SQL was applied to hosted Supabase.

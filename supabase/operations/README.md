# One-off database operations

These SQL files are not part of `FRESH_INSTALL.sql` or the ordered migration chain. Do not run them all or apply them alphabetically.

- `inspect_booking_update_error.sql` is read-only diagnostic SQL.
- `repair_account_roles.sql`, `repair_initial_super_admin_account.sql`, and `repair_booking_notification_trigger.sql` are targeted repairs. Confirm the intended accounts/schema before running them.
- `remove_retired_399_packages.sql` deletes catalog rows; review production bookings and references before use.
- `configure_one_time_exterior_wash_tiers.sql` and `repair_uniform_service_package_price.sql` alter catalog pricing; review the resulting prices first.
- `rollback_customer_payment_preferences.sql` removes a column and can discard saved preferences.

The current installation and application-upgrade source is in `../setup/` and `../migrations/`. Historical SQL is retained in `../archive/` for reference, not execution.
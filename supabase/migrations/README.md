# Ordered application migrations

Apply `.sql` files in lexicographic filename order after `setup/` on a new empty database. The earlier timestamps preserve established upgrade order; the `20261016*` files apply current application features, with the consolidated payment/supervisor RPC migration last.

For existing projects, check applied history and apply only missing migrations. Scripts that stop on duplicate payment or promotion records require reconciliation before retrying; do not remove financial or customer history to force success. One-off scripts in `../operations/` are not part of this run order.

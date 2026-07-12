# HRUSHE Production Migration Runbook - 2026-07-12

## Scope

Backend-only hardening for phone normalization, money paise backfill, inventory consistency, and payment reconciliation. Do not run apply/repair steps until a MongoDB backup has completed and the backup restore path has been verified.

## Required Backup

1. Pause non-essential admin mutations during the migration window.
2. Create a full MongoDB backup with the production provider snapshot tool or `mongodump`.
3. Record backup id, timestamp, database name, and operator.
4. Confirm restore access in staging or a disposable database.
5. Only then run apply commands with `--backup-created` or the matching `*_BACKUP_CONFIRMED=true` environment variable.

## Report-Only Checks

Run these first:

```bash
node backend/scripts/audit-user-phones.js
node backend/scripts/create-user-phone-index.js
node backend/scripts/audit-money-paise.js
node backend/scripts/audit-inventory-consistency.js
```

Expected before apply:

- `usersRequiringManualReview` is resolved or explicitly accepted.
- `duplicateNormalizedNumbers` is zero before creating the unique phone index.
- Money findings are missing-field backfills only; mismatch findings require manual review.
- Inventory findings are either empty or classified as safe repair candidates.

## Apply Sequence

1. Phone normalization:

```bash
node backend/scripts/audit-user-phones.js --apply --backup-created
node backend/scripts/create-user-phone-index.js --apply --backup-created
```

2. Money paise backfill:

```bash
node backend/scripts/audit-money-paise.js --apply --backup-created
```

3. Inventory safe repair, only for expired/failed/cancelled unpaid reservations:

```bash
node backend/scripts/audit-inventory-consistency.js --repair-safe --backup-created
```

4. Re-run all report-only checks and confirm clean output.

## Rollback

1. Stop application traffic if data corruption is suspected.
2. Restore the pre-migration backup.
3. Re-deploy the previous stable backend if the issue is code-related.
4. Re-run report-only scripts after restore.

## Observability

Backend logs are structured JSON. Important events include:

- `http.request.completed`
- `checkout.created`
- `payment.verified`
- `payment.webhook.processed`
- `payment.reconciliation.result`
- `payment.reconciliation.scan`
- `error.captured`

Configure these environment variables when a hosted error provider is chosen:

- `ERROR_MONITORING_PROVIDER`
- `ERROR_MONITORING_DSN`

The current integration emits redacted structured error events even without a DSN, so a log drain can forward them to the provider.

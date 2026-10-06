# HRUSHE Backup Restore Runbook

Last updated: 2026-08-11

## Policy

- Backup schedule: daily automated MongoDB backup, plus provider point-in-time recovery when available.
- Retention recommendation: 7 daily, 4 weekly, 3 monthly snapshots minimum.
- RPO target: 24 hours maximum, tighter if MongoDB provider PITR is enabled.
- RTO target: 4 hours for storefront recovery.
- Owner: release owner to fill before launch.

## Restore Drill

Run this before launch and after any destructive migration plan.

1. Create or select a recent production-like backup.
2. Restore into an isolated database whose name contains `restore`, `staging`, `test`, or `prelaunch`.
3. Point a staging backend at the restored database.
4. Set staging-safe variables: test Razorpay keys, test email sender, staging R2 bucket, `OTP_DEV_MODE=false`, `ENABLE_COD=false`.
5. Run:

```bash
cd backend
npm run config:verify-production
npm test
node scripts/audit-money-paise.js
node scripts/audit-inventory-consistency.js
node scripts/audit-user-phones.js
```

6. Verify `/healthz` returns 200 and `/readyz` returns 200 against the restored staging backend.
7. Verify login, product list, cart, checkout creation, order list, and admin order detail on the restored environment.
8. Record backup timestamp, restore start/end times, RPO, RTO, database name, and verification results.

## Acceptance

Backup/restore is accepted only when a real restore into an isolated database has completed and the restored app passes readiness plus the data audit scripts.

## Nightly automatic backup (added 2026-10-07)

The backend writes one backup a day to a **private** R2 bucket when `BACKUP_R2_BUCKET` is set on Render (it reuses the existing R2 credentials, which must be allowed to write to that bucket). Files are `backups/hrushe-YYYY-MM-DD.json.gz`, kept for 30 days. A failed backup emails `ALERT_EMAIL` and is retried within the hour. Look for `backup.completed` or `backup.failed` in the Render logs.

To rehearse or perform a restore:

1. Download a backup file from the bucket in the Cloudflare dashboard.
2. See what it holds (changes nothing): `node scripts/restore-backup.js <file> <mongodb-uri>`
3. Restore into a spare database first: `node scripts/restore-backup.js <file> <spare-database-uri> --replace`
4. `--replace` empties and refills every collection in the file. Only point it at production when you mean to roll production back.


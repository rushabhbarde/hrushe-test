# HRUSHE Deployment and Rollback Checklist - 2026-07-13

## Before Deploy

- Backend tests pass.
- Dependency audit passes.
- Frontend lint and build pass.
- Fresh database backup exists.
- Restore access has been verified in staging or a disposable database.
- Phone, money, and inventory report-only audits are clean.
- Required environment variables are present.
- Razorpay mode is confirmed as test for staging or live for production.
- `APP_ENV`, `APP_RELEASE`, and hosted monitoring config are set.
- Alert catalog is installed in the monitoring provider.

## After Deploy

- `GET /healthz` returns 200.
- `GET /readyz` returns 200.
- Product listing works.
- Login works.
- Cart works.
- Checkout creation works in the intended Razorpay mode.
- Admin reconciliation listing works.
- `GET /admin/operations/summary` works for authorized admins and rejects unauthorized requests.
- Logs include correlation IDs.
- Error provider receives one controlled staging event.
- No unexpected 5xx spike.
- No migration mismatch in report-only audits.

## Rollback Triggers

- Readiness repeatedly fails.
- Payment verification fails.
- Checkout amount mismatch appears.
- Inventory reservation or commit fails.
- Database migration mismatch appears.
- Elevated 5xx rate.
- Critical monitoring alert.

## Rollback Steps

1. Stop or pause live payment entry if necessary.
2. Deploy the previous stable backend.
3. Restore the pre-migration backup only if data was corrupted.
4. Re-run report-only audits.
5. Verify health and readiness.
6. Record incident details, timestamps, affected orders, and recovery steps.

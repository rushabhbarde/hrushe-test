# HRUSHE Production Go-Live Report - 2026-07-14

## Executive Status

Not ready

Live Razorpay payments must remain disabled.

This was a focused final launch execution pass, not a new hardening phase. No storefront or admin UI was redesigned or changed. The local code baseline improved, but the required external go-live gates are still not complete.

## Code Review

### P0 Findings

- None found.

### P1 Findings

- Browser payment verification and captured Razorpay webhooks could mark a tracked-inventory order as paid after its inventory reservation had already expired or been released. This could create a paid order without safely committed inventory. Fixed by routing those cases to `MANUAL_REVIEW_REQUIRED` without confirming the order as paid.
- Staff creation did not explicitly reject duplicate normalized phone numbers before the new partial unique phone index. Fixed so duplicate staff/customer phone conflicts return a field-specific conflict before index-level errors.

### P2 Findings

- Metric logs with a field named `event` could overwrite the structured log event name, making alert queries for `metric.recorded` unreliable. Fixed by preserving the provider event as `metricEvent`.
- The alert catalog did not include the new captured-payment manual-review metric. Updated the catalog.

### P3 Findings

- None found.

### Fixes Made

- `backend/src/controllers/orderController.js`
  - Added tracked-inventory payment confirmation blockers for missing, released, or expired reservations.
  - Browser verification now saves `MANUAL_REVIEW_REQUIRED` and returns an error instead of marking unsafe orders paid.
  - Captured webhook processing now records manual review and returns accepted/manual-review status instead of committing unsafe inventory.
- `backend/src/controllers/adminController.js`
  - Added duplicate normalized phone conflict check during staff creation.
- `backend/src/utils/metrics.js`
  - Prevented metric field names from overwriting the structured log `event`.
- `backend/test/orderController.test.js`
  - Added regression coverage for released-reservation browser verification and expired-reservation captured webhooks.
- `backend/test/adminOperations.test.js`
  - Added duplicate staff phone regression coverage.
- `backend/test/logger.test.js`
  - Added metric event-name preservation coverage.
- `HRUSHE_PHASE4_ALERT_CATALOG_2026-07-13.md`
  - Added captured-payment manual-review alert rule.

## Backup And Restore

- Backup ID: Not available
- Backup time: Not executed
- Restore result: Not executed
- Restore duration: Not available
- Verification evidence: None

The backup/restore drill remains a hard blocker. No apply-mode migration was run.

## Phone Migration

- Report result: Passed locally in report mode.
- Users scanned: 3
- Empty phone values: 2
- Valid normalized numbers: 1
- Invalid phone values: 0
- Duplicate normalized numbers: 0
- Manual-review users: 0
- Apply result: Not run
- Index result: Report mode returned `ready` for `users_phone_unique_non_empty`; index was not created.
- API duplicate tests: Customer phone duplicate paths already covered; staff duplicate phone regression added and passing.

## Money Migration

- Pre-report: Passed locally with safe missing-paise backfills only.
- Products scanned: 1
- Orders scanned: 3
- Safe product backfills: 1
- Safe order backfills: 3
- Mismatch/manual-review findings: 0
- Apply result: Not run
- Post-report: Not applicable because apply was blocked by missing backup/restore evidence.
- UI/API price verification: Frontend build passed; no live checkout/payment amount validation was executed.

## Inventory

- Audit result: Passed locally in report mode.
- Products scanned with inventory tracking: 0
- Orders scanned: 3
- Product findings: none
- Order findings: none
- Repairs performed: none
- Manual-review items: none from the local audit

## Razorpay

- Scenarios passed: 0/20 in staging
- Scenarios failed: 0/20 in staging
- Scenarios rerun: 0/20 in staging
- Remaining manual-review cases: not measured in staging

Code-level regressions were added for two Razorpay/inventory risk paths:

- Browser verification cannot mark tracked-inventory orders paid after reservation release.
- Captured webhooks cannot mark tracked-inventory orders paid after reservation expiry.

The full Razorpay test-mode staging matrix remains blocked because no test-mode provider/staging environment evidence was available.

## Monitoring

- Provider: Not configured in this workspace
- Environment separation: Code supports `ERROR_MONITORING_PROVIDER`, `ERROR_MONITORING_DSN`, `APP_ENV`, and `APP_RELEASE`; provider-side separation not verified
- Controlled error result: Local structured-log capture observed during tests/smoke checks; hosted provider receipt not verified
- Redaction result: Unit tests passed for sensitive-field redaction
- Metric result: `metric.recorded` event naming is now protected from provider-event field collisions

## Alerts

- Rules installed: Not installed in a hosted provider
- Test results: Unit/local structured-log evidence only
- Notification channels: Not configured

Alert catalog now includes:

- `payment.confirmation.manual_review`
- `payment.webhook.manual_review`

Critical alert delivery remains unverified and is a launch blocker.

## Scheduler

- Provider: Not configured
- Cadence: Not configured
- Authentication result: Unit tests pass for valid signatures, stale replay rejection, invalid signature rejection, and missing-secret rejection.
- Local HTTP result: `POST /internal/reconciliation/scan` returned 503 when `INTERNAL_SCHEDULER_SECRET` was absent, which is fail-closed behavior.
- Production HTTP result: `POST https://hrushe.in/api/backend/internal/reconciliation/scan` returned 404. The internal scheduler endpoint is not deployed on the current live backend.
- Last successful scan: Not available

Scheduler deployment/configuration remains a launch blocker.

## Load Test

- Throughput: Not measured
- p50: Not measured
- p95: Not measured
- p99: Not measured
- Error rate: Not measured
- Inventory result: Not measured under load

Harness safety checks passed:

- Refused `https://hrushe.in` as a production hostname.
- Refused to run without `STAGING_LOAD_TEST=true`.

No staging target or test credentials were available, so the actual load test was not executed.

## Deployment

- Release: No candidate deployment performed from this workspace
- Smoke result: Local and public read-only checks only
- Rollback rehearsal: Not executed
- Rollback duration: Not available

Local smoke checks:

- `GET /healthz`: 200
- `GET /readyz`: 200, Mongo connected
- `GET /order/reconciliation`: 401 unauthenticated
- `GET /admin/operations/summary`: 401 unauthenticated
- `POST /internal/reconciliation/scan`: 503 without scheduler secret

Public production read-only checks:

- `GET https://hrushe.in/`: 200
- `GET https://hrushe.in/api/backend/healthz`: 200, `{"status":"ok"}`
- `GET https://hrushe.in/api/backend/readyz`: 200, `{"status":"ready","mongo":"connected"}`
- `GET https://hrushe.in/api/backend/products?limit=1`: 200, pagination total items 6
- `GET https://hrushe.in/api/backend/order/reconciliation`: 401 unauthenticated
- `GET https://hrushe.in/api/backend/admin/operations/summary`: 401 unauthenticated
- `POST https://hrushe.in/api/backend/internal/reconciliation/scan`: 404

## Final Tests

- Backend test count: 98/98 passing
- Dependency audit: `npm audit --omit=dev`, 0 vulnerabilities
- Frontend lint: passed
- Frontend build: passed, 48 routes generated
- Phone audit: local report mode passed
- Phone index readiness: local report mode ready, index not created
- Money audit: local report mode found safe backfills pending
- Inventory audit: local report mode clean
- Load-test safety gates: passed refusal checks

## Remaining Risks

- No verified backup ID or restore drill evidence.
- Phone normalization apply and unique phone index creation have not been performed.
- Money paise backfill has not been performed.
- Production/staging post-migration audits have not been performed.
- Razorpay test-mode staging matrix has not been executed.
- Hosted monitoring provider receipt has not been verified.
- Critical alert rules are not installed or operator-tested.
- Reconciliation scheduler is not deployed on the current live backend.
- Staging load test has not been executed.
- Deployment rehearsal and rollback rehearsal have not been executed.
- The current live production backend does not include the internal scheduler route validated locally.

## Live-Payment Decision

Live Razorpay payments must remain disabled.

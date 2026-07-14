# HRUSHE Production Go-Live Final Report - 2026-07-14

## Executive Status

NO-GO

Live Razorpay payments must remain disabled.

This report covers the available execution evidence from the local workspace and read-only production probes. The mandatory go-live decision rule cannot be satisfied because the backup/restore drill, apply-mode migrations, staging deployment, scheduler configuration, hosted monitoring, alert delivery, Razorpay staging matrix, staging load test, deployment rehearsal, and rollback rehearsal were not executed with recorded evidence.

No storefront or admin UI changes were made.

## Exact Release Commit

- Git branch: `main`
- Current HEAD: `76934f56e740e1dd0a196124c6e8e86f0d3ba197`
- Release-candidate status: Not immutable. The launch-candidate code includes uncommitted working-tree changes, so there is no exact committed release SHA for deployment.
- Local MongoDB backup tools available: `mongodump` and `mongorestore`

## Backup And Restore Evidence

- Backup completed: No
- Backup ID: Not available
- Database name: Not available
- Environment: Production backup access not available in this workspace
- Backup start/completion time: Not executed
- Operator: Not executed
- Backup size: Not available
- Storage location/provider reference: Not available
- Restore target database: Not available
- Restore start/completion time: Not executed
- Restore duration: Not available
- Verification results: Not available

Gate result: Failed / blocked.

No apply-mode migration was run because verified backup and restore evidence is mandatory before any production data write.

## Phone Migration Results

Report-only command:

```bash
env MONGODB_SERVER_SELECTION_TIMEOUT_MS=500 node scripts/audit-user-phones.js
```

Local report-mode result:

- Users scanned: 3
- Empty phone values: 2
- Valid normalized numbers: 1
- Invalid phone values: 0
- Duplicate normalized numbers: 0
- Duplicate users: 0
- Users that would be modified: 0
- Users requiring manual review: 0
- Applied updates: 0

Apply result: Not run because Gate 1 did not pass.

Gate result: Blocked.

## Phone Index Verification

Report-only command:

```bash
env MONGODB_SERVER_SELECTION_TIMEOUT_MS=500 node scripts/create-user-phone-index.js
```

Local report-mode result:

- Mode: report
- Status: ready
- Index name: `users_phone_unique_non_empty`
- Key: `{ phone: 1 }`
- Partial filter: `{ phone: { $type: "string", $gt: "" } }`

Index creation result: Not run because Gate 1 did not pass.

Duplicate phone API verification:

- Customer duplicate-phone paths are covered by existing backend behavior.
- Staff duplicate-phone conflict regression was added and passed in backend tests.

Gate result: Blocked until backup/restore passes and the index is actually created.

## Money Migration Results

Report-only command:

```bash
env MONGODB_SERVER_SELECTION_TIMEOUT_MS=500 node scripts/audit-money-paise.js
```

Local report-mode result:

- Products scanned: 1
- Orders scanned: 3
- Products with money issues: 1
- Orders with money issues: 3
- Safe product backfills: 1
- Safe order backfills: 3
- Applied product backfills: 0
- Applied order backfills: 0
- Mismatch findings requiring manual review: 0

Apply result: Not run because Gate 1 did not pass.

Post-apply audit: Not applicable.

Gate result: Blocked.

## Inventory Audit Results

Report-only command:

```bash
env MONGODB_SERVER_SELECTION_TIMEOUT_MS=500 node scripts/audit-inventory-consistency.js
```

Local report-mode result:

- Products scanned: 0
- Orders scanned: 3
- Repaired reservations: 0
- Duplicate SKU products: 0
- Negative stock variants: 0
- Negative reserved variants: 0
- Archived products with reserved stock: 0
- Paid orders with reserved inventory: 0
- Failed/cancelled orders with reserved inventory: 0
- Expired reservations: 0
- Tracked orders missing reservation: 0

Gate result: Local report-mode audit passed, but production/staging post-migration inventory audit is not complete because migrations were not applied.

## Deployment Evidence

No successful release-candidate deployment was performed from this workspace.

Render deployment logs provided on 2026-07-14 show the backend restarting and exiting with status 1 because production configuration is missing `INTERNAL_SCHEDULER_SECRET`. The logs also show a legacy `COOKIE_SAME_SITE=none` value being normalized to `lax` at runtime, with a warning to update the Render environment value.

Read-only production probes on `https://hrushe.in`:

- Homepage: 200
- `/api/backend/healthz`: 200
- `/api/backend/readyz`: 200
- `/api/backend/products?limit=1`: 200
- `POST /api/backend/internal/reconciliation/scan`: 404

Gate result: Failed / blocked.

The live production backend still does not expose the internal reconciliation scheduler route.

## Razorpay Matrix Result

- Matrix executed: No
- Pass count: 0/20
- Fail count: 0/20
- Blocked/not run count: 20/20
- Test mode credentials verified: No
- Integer-paise live/staging checkout validation: Not executed

Gate result: Blocked.

Code-level regression coverage exists for:

- Browser verification with released/missing tracked-inventory reservation
- Captured webhook with expired tracked-inventory reservation
- Reconciliation lock ownership and stale lock save rejection
- Amount and currency mismatch classification in reconciliation selectors

These tests do not replace the required Razorpay test-mode staging matrix.

## Monitoring Provider Verification

- Hosted provider configured: Not verified
- `ERROR_MONITORING_PROVIDER`: Not verified in hosted environment
- `ERROR_MONITORING_DSN`: Not verified in hosted environment
- `APP_ENV`: Code-supported, provider-side separation not verified
- `APP_RELEASE`: Code-supported, provider-side release tagging not verified
- Controlled staging error received by provider: Not verified
- Redaction: Unit tests passed locally

Gate result: Blocked.

## Alert Installation And Delivery Tests

- Alert rules installed in hosted provider: Not verified
- Operator notification channel: Not verified
- Delivery test: Not executed

Alert catalog includes required payment manual-review metrics:

- `payment.confirmation.manual_review`
- `payment.webhook.manual_review`

Gate result: Blocked until alerts are installed and operator delivery is tested.

## Scheduler Verification And Last Successful Scan

Local code/test evidence:

- Valid signed scheduler requests: unit-tested
- Invalid signature rejection: unit-tested
- Stale replay rejection: unit-tested
- Missing server secret fail-closed behavior: unit-tested
- Bounded scan limit: implemented and unit-covered through controller tests

Production evidence:

- `POST https://hrushe.in/api/backend/internal/reconciliation/scan`: 404
- Scheduler provider: Not configured
- Cadence: Not configured
- Last successful scan: Not available
- Repeated-failure alert: Not verified

Gate result: Failed / blocked.

## Load-Test Metrics

Staging load test was not run.

Harness safety checks from the previous July 14 pass:

- Production hostname refused
- Missing `STAGING_LOAD_TEST=true` refused

Metrics unavailable:

- Total requests
- Requests per second
- p50 latency
- p95 latency
- p99 latency
- Error rate
- Timeout rate
- Database errors
- Payment/order errors
- Reservation conflicts

Gate result: Blocked.

## Post-Load Inventory And Reconciliation Results

Not applicable because the staging load test was not executed.

Gate result: Blocked.

## Rollback Rehearsal Duration And Result

- Rollback rehearsal executed: No
- Rollback start time: Not available
- Rollback completion time: Not available
- Total rollback duration: Not available
- Data compatibility result: Not verified
- Health-check result after rollback: Not verified
- Manual intervention required: Unknown

Gate result: Blocked.

## Final Local Verification

Commands run on 2026-07-14:

- `npm test` in `backend`: passed, 98/98
- `npm audit --omit=dev` in `backend`: passed, 0 vulnerabilities
- `npm run lint` in `frontend`: passed
- `npm run build` in `frontend`: passed, 48 routes generated
- `git diff --check`: passed

## Remaining Risks

- No verified production backup or restore drill.
- No approved production apply-mode phone migration.
- No created/verified production partial unique phone index.
- No approved production money paise backfill.
- No clean post-migration production audits.
- Release-candidate code is not committed to an immutable SHA.
- Latest backend is not deployed to production; live scheduler route returns 404.
- Render production configuration is missing `INTERNAL_SCHEDULER_SECRET`.
- Render still has legacy `COOKIE_SAME_SITE=none`; update it to `lax`.
- Reconciliation scheduler is not configured or observed running.
- Hosted monitoring provider receipt is not verified.
- Critical alerts are not installed or delivery-tested.
- Razorpay test-mode staging matrix is not executed.
- Staging load test is not executed.
- Deployment rehearsal is not executed.
- Rollback rehearsal is not executed.

## Explicit Live-Payment Recommendation

Live Razorpay payments must remain disabled.

The final launch decision is NO-GO until every mandatory gate in the Phase 5 decision rule passes with recorded evidence.

# HRUSHE Production Go-Live Report - 2026-07-13

## Executive Status

Final recommendation: Do not enable live Razorpay payments yet.

Code-level verification passed locally, and the report-only migration/inventory audits did not reveal unsafe data states in the local database. However, Phase 5 go-live requires execution evidence from backup restore, staging Razorpay, hosted monitoring, alerting, scheduler, load testing, deployment, and rollback drills. Those external gates were not executed in this workspace.

This Phase 5 pass made no UI changes and no database writes.

## Go-Live Gate Summary

| Gate | Status | Evidence |
| --- | --- | --- |
| Backend tests | Passed | `npm test`, 93/93 passing |
| Dependency audit | Passed | `npm audit --omit=dev`, 0 vulnerabilities |
| Frontend lint | Passed | `npm run lint` |
| Frontend build | Passed | `npm run build`, 48 pages generated |
| Local health check | Passed | `GET /healthz` returned 200 `{"status":"ok"}` |
| Local readiness check | Passed | `GET /readyz` returned 200 `{"status":"ready","mongo":"connected"}` |
| Protected routes reject anonymous access | Passed | `GET /order/reconciliation` and `GET /admin/operations/summary` returned 401 |
| Backup restore drill | Blocked / not executed | No backup id, restore target, or disposable DB evidence provided |
| Phone migration apply | Blocked / not executed | Backup restore gate not satisfied |
| Phone unique index apply | Blocked / not executed | Backup restore gate not satisfied |
| Money paise backfill apply | Blocked / not executed | Backup restore gate not satisfied |
| Inventory audit | Local report passed | No local findings; production/staging audit still required |
| Razorpay staging matrix | Blocked / not executed | No test-mode provider environment/access provided |
| Hosted monitoring | Blocked / not verified | No hosted provider credentials or staging event evidence |
| Production alerts | Blocked / not installed | Alert catalog exists; provider rules not configured/tested |
| Reconciliation scheduler | Blocked / not installed | Endpoint exists; hosted scheduler and secret not configured/tested |
| Staging load test | Blocked / not run | Harness exists; no staging target or opt-in credentials provided |
| Production deployment | Blocked / not executed | No deployment action performed |
| Rollback rehearsal | Blocked / not executed | Checklist exists; no rehearsal evidence |

## Backup And Restore

Result: Not executed.

The required backup and restore drill is a hard stop condition for the data migrations. No verified backup identifier, restore environment, restore duration, restored document counts, or post-restore application checks were available.

Required before go-live:

- Create a fresh production backup immediately before migration.
- Restore it to a disposable database or staging environment.
- Verify users, products, orders, verification codes, inventory reservation fields, paise fields, admin data, and indexes.
- Run `/healthz` and `/readyz` against the app pointed at restored data.
- Record the completed evidence in `HRUSHE_BACKUP_RESTORE_DRILL_2026-07-13.md`.

## Migration And Data Readiness

Commands were run in report-only mode against the local database. No `--apply`, `--repair-safe`, index creation, or data write was performed.

### Phone Audit

Command: `env MONGODB_SERVER_SELECTION_TIMEOUT_MS=500 node scripts/audit-user-phones.js`

- Mode: report
- Users scanned: 3
- Empty phone values: 2
- Valid normalized numbers: 1
- Invalid phone values: 0
- Duplicate normalized numbers: 0
- Users requiring manual review: 0
- Users that would be modified: 0
- Applied updates: 0

Status: local report passed.

### Phone Unique Index Readiness

Command: `env MONGODB_SERVER_SELECTION_TIMEOUT_MS=500 node scripts/create-user-phone-index.js`

- Mode: report
- Status: ready
- Index name: `users_phone_unique_non_empty`
- Key: `{ phone: 1 }`
- Partial filter: `{ phone: { $type: "string", $gt: "" } }`

Status: ready locally, not created.

### Money Paise Audit

Command: `env MONGODB_SERVER_SELECTION_TIMEOUT_MS=500 node scripts/audit-money-paise.js`

- Mode: report
- Products scanned: 1
- Orders scanned: 3
- Products with money issues: 1
- Orders with money issues: 3
- Safe product backfills: 1
- Safe order backfills: 3
- Mismatch findings requiring manual review: 0
- Applied product backfills: 0
- Applied order backfills: 0

Status: local report found only safe missing-paise backfills. Backfill was not applied because the backup restore gate is unmet.

### Inventory Consistency Audit

Command: `env MONGODB_SERVER_SELECTION_TIMEOUT_MS=500 node scripts/audit-inventory-consistency.js`

- Mode: report
- Products scanned with `trackInventory: true`: 0
- Orders scanned: 3
- Duplicate SKU products: 0
- Negative stock variants: 0
- Negative reserved variants: 0
- Archived products with reserved stock: 0
- Paid orders with reserved inventory: 0
- Failed/cancelled orders with reserved inventory: 0
- Expired reservations: 0
- Tracked orders missing reservation: 0
- Repaired reservations: 0

Status: local report passed. Production/staging inventory must still be audited before live checkout.

## Monitoring And Alerts

Hosted monitoring was not verified.

Implemented code support from Phase 4 includes structured error capture, app environment/release metadata, process-level exception/rejection handlers, and expanded sensitive-field redaction. The local scheduler smoke test produced a structured captured error when the scheduler secret was absent, but no hosted provider received a controlled staging event.

Required before go-live:

- Configure hosted monitoring DSN/project for staging and production.
- Set `APP_ENV` and `APP_RELEASE`.
- Send one controlled staging error and confirm it appears in the provider.
- Install the alert rules from `HRUSHE_PHASE4_ALERT_CATALOG_2026-07-13.md`.
- Test at least one payment failure, one reconciliation failure/manual-review alert, and one inventory failure alert.

## Scheduler

Local route evidence:

- `POST /internal/reconciliation/scan` exists and is POST-only.
- Unconfigured local request returned 503 `Internal scheduler is not configured`, which is expected without `INTERNAL_SCHEDULER_SECRET`.
- Anonymous protected admin/reconciliation HTTP routes returned 401.

Hosted scheduler status: not configured or tested.

Required before go-live:

- Set a strong `INTERNAL_SCHEDULER_SECRET` in the hosted backend.
- Configure a scheduler to send signed POST requests with timestamp and HMAC headers.
- Run one staging scheduled scan and verify logs, metrics, and `admin/operations/summary` timestamp.

## Razorpay Staging Matrix

Razorpay staging was not executed because test-mode credentials and a staging checkout environment were not available.

- Staging scenarios passed: 0/20
- Staging scenarios failed: 0/20
- Staging scenarios blocked/not run: 20/20
- Unit-covered code paths: concurrent reconciliation and stale reconciliation-lock takeover
- Evidence file: `HRUSHE_RAZORPAY_STAGING_MATRIX_2026-07-13.md`

Required before go-live:

- Run all 20 scenarios in Razorpay test mode.
- Record order status, payment status, stock/reserved transitions, provider event, callback state, reconciliation result, manual-review flag, and evidence location for each scenario.
- Fix and rerun any failed scenario before enabling live payments.

## Load Test

The staging load-test harness exists at `backend/scripts/staging-load-test.js`, but it was not run.

Required before go-live:

- Run only against staging with `STAGING_LOAD_TEST=true`.
- Record checkout-create, verification/webhook simulation, product list, health, and readiness latency.
- Confirm no overselling, no duplicate payment confirmation, and no unexpected 5xx spike.

## Deployment And Rollback

No production deployment or rollback rehearsal was performed.

Local smoke evidence:

- Backend started locally on port 5057 and connected to MongoDB.
- `/healthz` returned 200.
- `/readyz` returned 200 with Mongo connected.
- Anonymous `GET /order/reconciliation` returned 401.
- Anonymous `GET /admin/operations/summary` returned 401.
- Anonymous `POST /internal/reconciliation/scan` returned 503 due missing local scheduler secret.

Required before go-live:

- Complete `HRUSHE_DEPLOYMENT_ROLLBACK_CHECKLIST_2026-07-13.md`.
- Deploy to staging first.
- Verify product listing, login, cart, checkout creation, admin operations summary, logs, and monitoring.
- Rehearse rollback to the previous backend release.
- Record deployment id, previous release id, rollback duration, and verification evidence.

## Final Verification Commands

- `npm test` in `backend`: passed, 93/93.
- `npm audit --omit=dev` in `backend`: passed, 0 vulnerabilities.
- `npm run lint` in frontend: passed.
- `npm run build` in frontend: passed.

## Remaining Risks

- No verified production backup restore evidence.
- Data migrations are prepared but not applied.
- Local database sample is small and is not proof of production data readiness.
- Razorpay test-mode checkout/webhook/reconciliation behavior is not verified end to end.
- Hosted monitoring and alert delivery are not verified.
- Scheduler is implemented but not hosted/configured/tested.
- Staging load behavior and oversell protection under concurrency are not verified in an environment-like setup.
- Rollback process has not been rehearsed.

## Final Recommendation

Do not enable live Razorpay payments and do not treat HRUSHE as fully go-live cleared yet.

Proceed only after the backup restore drill passes, backup-gated migrations are applied and re-audited, Razorpay staging matrix passes all 20 scenarios, hosted monitoring and alerts are verified, the reconciliation scheduler runs in staging, the staging load test passes, and deployment/rollback rehearsal evidence is recorded.

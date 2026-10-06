# HRUSHE Phase 4 Alert Catalog - 2026-07-13

Use the hosted error/metrics provider and log-drain queries for these alert rules. Do not alert on single customer validation failures.

| Alert | Trigger | Severity | Channel | Runbook | Operator response |
| --- | --- | --- | --- | --- | --- |
| Captured payment unconfirmed | `capturedUnconfirmed > 0` for 5 minutes | Critical | Ops paging | `HRUSHE_PRODUCTION_MIGRATION_RUNBOOK_2026-07-12.md` | Open reconciliation list, confirm provider status, hold fulfillment if needed |
| Inventory commit failure | `inventory.transition.failed >= 1` | Critical | Ops paging | `HRUSHE_PRODUCTION_MIGRATION_RUNBOOK_2026-07-12.md` | Stop affected SKU sales, reconcile order, inspect variant stock/reserved |
| Paid order missing committed inventory | Operations summary `paid order with reserved inventory > 0` | Critical | Ops paging | `HRUSHE_PRODUCTION_MIGRATION_RUNBOOK_2026-07-12.md` | Check order, variant reservation, and webhook sequence |
| Captured payment manual review | `payment.confirmation.manual_review >= 1` or `payment.webhook.manual_review >= 1` | Critical | Ops paging | `HRUSHE_RAZORPAY_STAGING_MATRIX_2026-07-13.md` | Hold fulfillment, inspect Razorpay capture, and reconcile inventory before shipping or refunding |
| Manual reconciliation required | `payment.reconciliation.result` with `MANUAL_REVIEW_REQUIRED` | Critical | Ops paging | `HRUSHE_PRODUCTION_MIGRATION_RUNBOOK_2026-07-12.md` | Review order before shipment or refund action |
| Reconciliation amount mismatch | `PAYMENT_AMOUNT_MISMATCH >= 1` | Critical | Ops paging | `HRUSHE_PRODUCTION_MIGRATION_RUNBOOK_2026-07-12.md` | Verify amount in Razorpay test/live dashboard and block auto-confirm |
| Reconciliation currency mismatch | `PAYMENT_CURRENCY_MISMATCH >= 1` | Critical | Ops paging | `HRUSHE_PRODUCTION_MIGRATION_RUNBOOK_2026-07-12.md` | Verify provider configuration and order currency |
| Mongo readiness unavailable | `/readyz` 503 twice in 5 minutes | Critical | Ops paging | `HRUSHE_DEPLOYMENT_ROLLBACK_CHECKLIST_2026-07-13.md` | Check Atlas, Render env, and recent deploy |
| Repeated API 5xx | `error.captured` or HTTP 5xx > 5 in 5 minutes | Critical | Ops paging | `HRUSHE_DEPLOYMENT_ROLLBACK_CHECKLIST_2026-07-13.md` | Inspect release, rollback if regression is likely |
| Repeated webhook failures | `payment.webhook.failed >= 3` in 10 minutes | Critical | Ops paging | `HRUSHE_RAZORPAY_STAGING_MATRIX_2026-07-13.md` | Verify webhook secret, provider dashboard, and event ids |
| Provider unavailable spike | `PROVIDER_UNAVAILABLE > 3` in 15 minutes | Warning | Ops channel | `HRUSHE_PRODUCTION_MIGRATION_RUNBOOK_2026-07-12.md` | Retry reconciliation after provider health check |
| Stuck payment orders | Operations summary `initiatedOlderThan20Minutes > 5` | Warning | Ops channel | `HRUSHE_PRODUCTION_MIGRATION_RUNBOOK_2026-07-12.md` | Run scan, inspect provider callbacks, do not ship |
| OTP lockout spike | OTP lock events > baseline by 3x in 15 minutes | Warning | Ops channel | `HRUSHE_DEPLOYMENT_ROLLBACK_CHECKLIST_2026-07-13.md` | Check auth abuse and email delivery |
| Elevated checkout failure rate | Checkout failures > 5% in 15 minutes | Warning | Ops channel | `HRUSHE_RAZORPAY_STAGING_MATRIX_2026-07-13.md` | Check Razorpay status, keys, and frontend callback flow |
| Readiness intermittent | `/readyz` non-200 once in 10 minutes | Warning | Ops channel | `HRUSHE_DEPLOYMENT_ROLLBACK_CHECKLIST_2026-07-13.md` | Watch database and app logs |
| Reconciliation lock stuck | Lock older than 5 minutes appears in summary/scan | Warning | Ops channel | `HRUSHE_PRODUCTION_MIGRATION_RUNBOOK_2026-07-12.md` | Let lock expire or inspect running reconcile job |
| Invalid webhook signatures | `payment.webhook.invalid_signature >= 3` in 15 minutes | Warning | Ops channel | `HRUSHE_RAZORPAY_STAGING_MATRIX_2026-07-13.md` | Verify webhook secret rotation and source IPs |

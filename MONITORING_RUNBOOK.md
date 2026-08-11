# HRUSHE Monitoring Runbook

Last updated: 2026-08-11

## Purpose

Verify that production/staging failures create redacted logs, metrics, captured errors, and human-visible alerts.

## Required Alerts

- Backend unavailable: `/healthz` or `/health` non-200.
- Backend not ready: `/readyz` or `/ready` 503 twice in 5 minutes.
- Process crash or unhandled rejection: `error.captured` with `source=process`.
- HTTP 500 spike: 5xx rate above the chosen production threshold.
- MongoDB connection failure: `database.connection_failed`.
- Inventory reservation or transition failure: `inventory.transition.failed`.
- Inventory cleanup failure: `inventory.cleanup.failed` or `internal.inventory_cleanup.scan_error`.
- Payment webhook failure: `payment.webhook.failed`.
- Invalid webhook spike: `payment.webhook.invalid_signature`.
- Captured payment manual review: `payment.confirmation.manual_review` or `payment.webhook.manual_review`.
- Scheduler failure: signed internal scheduler endpoint non-2xx.
- Email provider failure: `order.email.failed` or OTP delivery failure events.
- Media/storage failure: `error.captured` with `component=r2`.

## Staging Alert Delivery Test

1. Configure the monitoring/log provider and alert destination.
2. Confirm `ERROR_MONITORING_PROVIDER`, `ERROR_MONITORING_DSN` if used, `APP_ENV`, and `APP_RELEASE` are set in staging.
3. Run:

```bash
BACKEND_PUBLIC_URL=https://staging-api.example.com \
INTERNAL_SCHEDULER_SECRET=<staging-secret> \
node backend/scripts/run-internal-scheduler.js /internal/monitoring/test-alert
```

4. Confirm a redacted `error.captured` event and `monitoring.test_alert` metric arrive.
5. Confirm the alert reaches the owner/channel.
6. Record timestamp, alert id, channel, and screenshot/link in the release evidence.

## Safety Rules

- Do not print secrets in tickets, logs, or reports.
- Do not include full phone, email, address, cookies, OTPs, JWTs, Razorpay secrets, or card metadata in alerts.
- Use staging before production.
- Disable or rate-limit any provider-side synthetic check that could page repeatedly.

## Production Acceptance

Monitoring is accepted only when at least one controlled staging alert and one production-safe health/readiness alert have been observed by the release owner.

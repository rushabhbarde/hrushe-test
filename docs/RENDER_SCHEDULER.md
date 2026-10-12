# Render Scheduler Configuration

> Since 2026-10-07 the web service runs these jobs itself (`backend/src/services/backgroundJobs.js`): stock-reservation cleanup every 5 minutes, the stuck-payment scan every 10 minutes, and the nightly backup. Separate Render Cron Jobs are optional; the signed endpoints below still work if you add them.

Reviewed on: 2026-07-24

## Required Environment

Set these values on the backend web service and on each Render Cron Job:

- `APP_ENV`: set to `staging` for the staging backend and Cron Jobs so startup safety checks reject obvious production credentials.
- `BACKEND_PUBLIC_URL`: the public HTTPS URL for the backend service, for example `https://hrushetest-backend.onrender.com`.
- `INTERNAL_SCHEDULER_SECRET`: a long random secret shared only by the backend service and internal scheduler jobs.
- `SCHEDULER_LIMIT`: optional, defaults to `50` and is capped at `100`.

Do not expose `INTERNAL_SCHEDULER_SECRET` to the frontend or any `NEXT_PUBLIC_*` variable.
Do not point `APP_ENV=staging` at production Razorpay keys, the production MongoDB database, production media storage, or production HRUSHE hosts.

## Inventory Reservation Cleanup

Create a Render Cron Job with:

- Runtime: Node
- Root directory: `backend`
- Build command: `npm ci --omit=dev`
- Command: `npm run scheduler:inventory-cleanup`
- Schedule: every 5 minutes, or every 10 minutes if launch traffic is low

This calls `POST /internal/inventory/cleanup` with an HMAC signature. The endpoint releases only genuinely expired reservations for pending, initiated, failed, or cancelled payments. Active reservations are preserved.

## Payment Reconciliation Scan

Create a second Render Cron Job with:

- Runtime: Node
- Root directory: `backend`
- Build command: `npm ci --omit=dev`
- Command: `npm run scheduler:reconciliation-scan`
- Schedule: every 10 minutes

This calls `POST /internal/reconciliation/scan` with the same HMAC signature contract and marks risky stuck orders for manual review.

## Verification

After creating each Cron Job, confirm from backend logs that these events appear:

- `internal.inventory_cleanup.scan_requested`
- `internal.inventory_cleanup.scan_started`
- `internal.inventory_cleanup.scan_completed`
- `internal.reconciliation_scan.requested`
- `internal.reconciliation_scan.started`
- `internal.reconciliation_scan.completed`

Authentication failures should produce `authentication_rejected` events. Lock contention should produce `internal.inventory_cleanup.lock_contention`.

This repository change does not configure Render remotely; it only adds the endpoint, scheduler caller, and exact configuration steps.

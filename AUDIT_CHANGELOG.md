# HRUSHE Audit Changelog

Audit date: 2026-08-11

## Dependency Closure

- Upgraded frontend to `next@16.3.0`, `eslint-config-next@16.3.0`, `postcss@8.5.26`, and `sharp@0.35.3`.
- Removed the old `postcss` override.
- Backend and frontend high-severity audits now pass.

## Payment Hardening

- Added durable payment-finalization lock fields to orders.
- Browser verification and Razorpay captured webhooks now acquire a database lock before committing inventory or marking paid.
- Captured payment inventory failures now persist manual-review/reconciliation state.
- Webhook events now store provider order/payment IDs and result codes.
- Amount/currency mismatches are routed to manual review instead of failed invisible retries.
- Added `backend/scripts/verify-razorpay-production-testmode.js` with explicit production test-mode safety gates.

## Inventory Hardening

- Added real MongoDB final-item concurrency script: `backend/scripts/test-final-item-concurrency.js`.
- Verified local isolated concurrency scenarios: 20 buyers/stock 1, 10 buyers/stock 1, and 20 buyers/stock 5.
- Prevented deactivation of variants with active reserved inventory.

## Cart, Wishlist, Tracking, And Lifecycle

- Wishlist move-to-cart now saves cart before removing wishlist item.
- Public tracking mismatch now returns a generic 404 lookup failure.
- Admin status updates are conditional on the previously read order status.
- Product metadata fetch now uses `cache: "no-store"`.

## COD Retirement

- Removed the legacy `/order/place` route and `placeOrder` controller export.
- Updated README endpoint docs.
- Production config now rejects `ENABLE_COD=true`.

## Monitoring And Config

- Added `/health` and `/ready` aliases.
- Added signed `/internal/monitoring/test-alert`.
- Prevented structured log payload fields from overwriting the canonical event name.
- Added `backend/scripts/verify-production-config.js`.
- Added `MONITORING_RUNBOOK.md`.
- Added `BACKUP_RESTORE_RUNBOOK.md`.
- Updated `backend/.env.example` and `render.yaml`.

## Launch Certification Follow-Up

- Ran final launch baseline on 2026-08-11: backend tests, frontend tests, lint, typecheck, production build, and backend/frontend high-severity audits all passed.
- Verified Vercel production deployment `dpl_Gfu8fpJNeTsjotDkKQvHLYUdjNkG` is `READY` on branch `release/hrushe-prelaunch` at commit `1cd4b57a0f17736ea7cb44e13ba3126b4e01694a`.
- Verified public DNS/HTTPS/media/product/health/security-smoke evidence where accessible without secrets.
- Fixed production CORS rejection behavior locally so unapproved origins become operational 403 errors instead of server 500s.
- Added backend regression coverage for production CORS rejection.
- Added Cloudflare analytics hosts to the frontend CSP after the hosted browser smoke showed Cloudflare's injected beacon being blocked.
- Recorded that hosted CORS/CSP/scheduler checks require redeploy and retest before GO.
- Replaced the staging-only Razorpay verifier with a production test-mode verifier and added a non-secret `/order/checkout/razorpay-mode` preflight endpoint.

## Working Tree Note

Pre-existing or unrelated user-side files still observed and left untouched:

- `frontend/components/product-card.tsx`
- `frontend/components/product-quick-add.tsx`
- `frontend/AGENTS.md`
- `frontend/CLAUDE.md`

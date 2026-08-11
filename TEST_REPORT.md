# HRUSHE Test Report

Reviewed on: 2026-08-11
Phase: final release hardening

## Backend

Passed:

- `npm test`: 141/141 tests passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `node --check` on changed backend controllers/scripts: passed.
- `npm run config:verify-production` with synthetic production-shaped non-secret env: PASS.

New backend coverage:

- Current-price checkout resolution.
- Removed option and insufficient stock rejection.
- Wishlist item retained when cart save fails.
- Generic public tracking lookup failure.
- Conditional admin order status updates.
- Payment confirmation lock contention.
- Captured webhook amount mismatch manual review.
- Expired/missing reservation manual review.
- Variant deactivation blocked when reserved inventory exists.
- Signed monitoring test-alert endpoint.
- Structured logging prevents payload fields from overwriting the event name.
- Production CORS rejects unapproved origins as an operational 403 instead of a server 500.
- Retired COD route.

## Frontend

Passed:

- `npm audit --audit-level=high`: 0 vulnerabilities.
- `npm test`: 31/31 tests passed.
- `npm run lint`: passed with 0 warnings/errors.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed on Next 16.3.0; 46 routes generated.

Note:

- Vitest still emits a non-failing Vite future-loader warning for `vitest.config.ts`.

## E2E

Passed:

- `npm run test:e2e`: 8/8 Playwright smoke tests passed across desktop and mobile Chromium.

Note:

- The first sandboxed Playwright run failed because the local server could not bind `0.0.0.0:3200`. The escalated rerun passed.

## Dependency Audit

- Backend: PASS.
- Frontend: PASS.

## Inventory Concurrency

Passed against local isolated MongoDB `hrushe-concurrency-test`:

- Stock 1 / 20 simultaneous reservations: 1 success, 19 rejected, cleanup restored stock.
- Stock 1 / 10 simultaneous reservations: 1 success, 9 rejected, cleanup restored stock.
- Stock 5 / 20 simultaneous reservations: 5 successes, 15 rejected, cleanup restored stock.

## External Tests Not Executed

These still require staging/provider/dashboard access:

- Full Razorpay test-mode browser/provider matrix.
- Hosted monitoring alert receipt.
- Render/Vercel production env inspection.
- DNS/SSL/CORS/cookie verification on real domain.
- iPhone Safari and Android Chrome real-device checkout.
- ZeptoMail real staging delivery.
- R2 real staging upload/read.
- MongoDB provider backup and actual isolated restore drill.

## Launch Certification Evidence

Reviewed on: 2026-08-11 20:54 IST

Passed or partially evidenced:

- Vercel project `hrushe-test` is visible through the connected Vercel app.
- Latest Vercel production deployment `dpl_Gfu8fpJNeTsjotDkKQvHLYUdjNkG` is `READY`, targets production, and matches branch `release/hrushe-prelaunch` at commit `1cd4b57a0f17736ea7cb44e13ba3126b4e01694a`.
- Vercel production build logs show build completed with no error lines.
- Vercel runtime error clusters: none found in the last 2 hours after the smoke run.
- DNS resolves for `hrushe.in`, `www.hrushe.in`, and `media.hrushe.in`.
- TLS verifies OK for `hrushe.in` and `media.hrushe.in`.
- `https://hrushe.in/` returns 200 with HSTS/security headers.
- `https://www.hrushe.in/` redirects to `https://hrushe.in/`.
- `http://hrushe.in/` and `http://www.hrushe.in/` redirect to HTTPS.
- `https://hrushe.in/api/backend/healthz` returns 200 through the Vercel-to-Render proxy.
- `https://hrushe.in/api/backend/products` returns 200 and no-store cache headers.
- A real `media.hrushe.in` product image returns 200.
- Unauthenticated `https://hrushe.in/api/backend/admin/orders` returns 401.
- Invalid Razorpay webhook signature returns `Invalid webhook signature`.
- Public bundle scan checked 17 JavaScript files and found no obvious server-secret patterns.
- Public browser smoke loaded `/`, `/shop`, one PDP, `/cart`, `/login`, `/track-order`, and `/admin` with HTTP 200.

Failed or not fully certifiable from this session:

- Hosted production CORS currently returns 500 for an unapproved `Origin`; fixed locally with a 403 operational error and backend tests now pass, but hosted redeploy/retest is required.
- Hosted browser smoke showed Cloudflare analytics beacon blocked by CSP; fixed locally by allowing Cloudflare analytics hosts, but hosted redeploy/retest is required.
- Hosted `/api/backend/internal/inventory/cleanup` returned 404, indicating the running Render backend is not yet on the newer scheduler-route build; redeploy/retest is required.
- Local `backend/.env` is development-shaped: `NODE_ENV=development`, HTTP local URLs, Razorpay test mode, `OTP_DEV_MODE=true`, insecure cookies, and missing staging/production scheduler/R2/ZeptoMail fields.
- `npm run config:verify-production` fails against local `.env`, so no staging/production configuration PASS can be claimed from local env.
- `npm run verify:razorpay-production-testmode` was not run because production test-order mutation requires explicit opt-in plus a valid production test payload and webhook secret.
- `npm run test:final-item-concurrency` refused to run because `CONCURRENCY_TEST=true` was not set against an isolated staging/test database.

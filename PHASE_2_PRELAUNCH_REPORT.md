# HRUSHE Phase 2 Pre-Launch Report

Reviewed on: 2026-07-24  
Baseline commit requested: `7585b15b003983e2c7d66fe6239c5249142f682f`

## Scope And Safety Notes

- Inspected `git status --short` before editing. The worktree already contained unrelated brand/layout/media changes, deleted scaffold assets, package lock changes, and report files. Those changes were preserved and not reverted.
- No live Razorpay mode was enabled.
- No production MongoDB was touched.
- `npm audit fix --force` was not run, and Next.js was not downgraded.
- Changes were kept to focused pre-launch safeguards, scheduler plumbing, and test coverage.

## Sharp Advisory Classification

Status: unresolved upstream dependency advisory; launch risk remains.

Evidence:

- `cd frontend && npm audit --omit=dev` reports 2 high-severity vulnerabilities:
  - `sharp <0.35.0`
  - `next` depending on vulnerable `sharp`
  - proposed force fix installs `next@14.2.35`, a breaking downgrade, so it was not applied.
- `cd frontend && npm ls sharp`:
  - `next@16.2.11 -> sharp@0.34.5`
- `cd frontend && npm explain sharp`:
  - `sharp@0.34.5 optional`
  - optional dependency from `next@16.2.11`

Classification:

- Not a direct HRUSHE app dependency.
- Still production-relevant because Next image optimization uses `sharp` in production, and Vercel installs dependencies from the lockfile automatically. Official references:
  - https://nextjs.org/docs/messages/sharp-missing-in-production
  - https://vercel.com/docs/package-managers
- No safe in-range compatible fix was available locally; the npm-audit-proposed fix would downgrade Next and violate the launch constraint.

## Implemented Changes

Homepage and audience media:

- Added safe homepage media helpers in `frontend/lib/homepage-media.ts`.
- Added `HomepageMediaFrame` and admin missing-media warning UI in `frontend/components/homepage-media.tsx`.
- Removed legacy missing default paths for `/uploads/banners/banner1.png`, `/uploads/banners/banner2.png`, `/uploads/banners/shopwomen.png`, and related banner defaults.
- Updated home, audience, site header, and admin homepage preview/publish flows to render graceful media fallbacks instead of broken image requests.
- Backend homepage publish validation now blocks visible published sections/cards with empty, invalid, deleted, or known-missing legacy media.

Inventory cleanup scheduler:

- Added signed internal scheduler endpoint: `POST /internal/inventory/cleanup`.
- Reused `INTERNAL_SCHEDULER_SECRET` HMAC auth with timestamp replay protection.
- Added structured cleanup result counts for inspected, released, preserved, manual-review, failed-release, and lock-contention cases.
- Added `backend/scripts/run-internal-scheduler.js`.
- Added backend npm scripts:
  - `npm run scheduler:inventory-cleanup`
  - `npm run scheduler:reconciliation-scan`
- Documented Render Cron setup in `docs/RENDER_SCHEDULER.md`.

Frontend tests:

- Added Vitest, Testing Library, jsdom, user-event, and Playwright.
- Added unit/component coverage for homepage media fallback, pricing, product display normalization, checkout validation, Razorpay readiness, API error normalization, and product cards.
- Stabilized storefront cache hydration so cached client data does not create collection-page SSR/client mismatches.
- Added Playwright pre-launch smoke coverage for desktop and mobile:
  - Homepage has no broken customer-facing images.
  - Collection page shows product cards.
  - Collection navigation has no hydration/page-error regression in the smoke path.
  - Checkout blocks Razorpay launch before script readiness and does not create a checkout order.
  - Login/account/track/admin protection pages load.

Razorpay coverage:

- Added focused frontend readiness guard before `/order/checkout`.
- Playwright aborts `https://checkout.razorpay.com/v1/checkout.js` and confirms no checkout order is created.
- Existing backend tests cover payment selection, amount/currency mismatch handling, manual-review routing, webhook/browser confirmation blockers, and reconciliation locks.
- Full real Razorpay test-mode provider matrix was not executed because this environment did not provide a staging backend, test credentials, webhook delivery, or production-like MongoDB.

## Verification Commands

Passed:

- `cd backend && npm test`: 112/112 passed.
- `cd frontend && npm test`: 31/31 passed.
- `cd frontend && npm run lint`: passed.
- `cd frontend && npm run build`: passed; 46 app routes generated/validated.
- `cd frontend && npm run test:e2e`: 8/8 passed across desktop and mobile.
- `cd backend && npm audit --omit=dev`: found 0 vulnerabilities.
- `node --check backend/scripts/run-internal-scheduler.js`: passed.

Expected non-passing command:

- `cd frontend && npm audit --omit=dev`: failed with the known `sharp <0.35.0` advisory inherited through `next@16.2.11`.

Support/evidence commands:

- `git status --short`
- `git rev-parse HEAD`
- `cd frontend && npm ls sharp`
- `cd frontend && npm explain sharp`
- `cd frontend && npm run test:e2e -- --project=desktop`
- `cd frontend && npm run test:e2e -- --project=mobile`

## Production Readiness

Status: conditional no-go for full production launch.

Resolved in this phase:

- Broken default homepage/audience media paths are no longer customer-facing launch blockers.
- Published homepage content now requires valid media.
- Durable internal inventory cleanup exists and is test-covered.
- Frontend unit/component/e2e coverage now exists for critical pre-launch paths.
- Razorpay readiness guard prevents creating checkout orders before the provider script is available.

Remaining blockers before a real go-live:

1. Monitor/resolve the `sharp <0.35.0` advisory without downgrading Next.
2. Configure and verify Render Cron Jobs remotely using `docs/RENDER_SCHEDULER.md`.
3. Run the full Razorpay test-mode lifecycle against staging: browser callback first, webhook first, modal dismiss, failed payment, duplicate callback/webhook, last-unit race, multi-tab, network interruptions.
4. Run the same payment and inventory lifecycle against staging/prod-like MongoDB transaction settings.
5. Validate real admin media upload/storage and real customer images after approved launch media is uploaded.

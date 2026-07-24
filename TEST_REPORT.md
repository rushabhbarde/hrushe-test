# HRUSHE Test Report

Reviewed on: 2026-07-24  
Phase: 4 external execution  
Starting SHA: `7585b15b003983e2c7d66fe6239c5249142f682f`  
Release branch: `release/hrushe-prelaunch`

## Summary

Local regression checks were rerun in Phase 4. Backend audit, backend tests, frontend lint, frontend unit/component tests, frontend production build, and local Playwright smoke passed. Frontend production dependency audit still fails and blocks release-candidate resolution unless resolved or explicitly accepted by the release owner after risk review.

## Backend Results

Passed:

- `cd backend && npm audit --omit=dev`: found 0 vulnerabilities.
- `cd backend && npm test`: 116/116 passed.

Backend coverage includes:

- Staging configuration guardrails.
- Scheduler authentication.
- Inventory cleanup idempotency and lock contention.
- Payment confirmation blockers.
- Reconciliation locks.
- Integer-paise money handling.
- CSRF/product safety.
- Homepage publish media validation.
- Structured log redaction.

## Frontend Results

Passed:

- `cd frontend && npm run lint`: passed.
- `cd frontend && npm test`: 31/31 passed.
- `cd frontend && npm run build`: passed on Next `16.2.11`; 46 routes generated/validated.
- `cd frontend && npm run test:e2e`: 8/8 passed across local Chromium desktop/mobile profiles.

Failed:

- `cd frontend && npm audit --omit=dev`: 3 high-severity vulnerabilities.

Audit detail:

- `postcss <=8.5.17`: high severity through Next.
- `sharp <0.35.0`: high severity through Next optional dependency.
- Dependent `next` advisory chain.
- Audit-proposed fix requires `npm audit fix --force` and would install `next@9.3.3`; it was not applied.

## Playwright Result

Passed locally:

- Homepage loads without broken customer-facing images.
- Collection page shows product cards.
- Checkout blocks Razorpay launch before provider script readiness.
- Login, account, tracking, and admin protection pages load.
- Desktop and mobile Chromium profiles both passed.

Not covered:

- Deployed staging.
- Safari desktop.
- Edge desktop.
- iPhone Safari.
- Android Chrome.
- Real Razorpay return/confirmation paths.

## External Tests

Not executed:

- Staging smoke against deployed backend/frontend.
- Razorpay real test-mode matrix.
- MongoDB production-like transaction/concurrency tests.
- Render Cron manual and scheduled runs.
- Real media storage/CMS tests.
- Lighthouse median samples.
- Alert delivery tests.
- Rollback drill.

## Release-Candidate Impact

No release-candidate commit or tag was created because:

- The frontend audit gate is failing.
- Required external staging gates were not available or not executed.
- The working tree is not clean and includes pre-existing user/brand changes that need release-owner classification before committing a release artifact.


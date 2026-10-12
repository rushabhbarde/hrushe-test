# HRUSHE Go-Live Checklist

Audit date: 2026-08-11

## Local Code Gates

- [x] Backend tests pass: `npm test`, 141/141.
- [x] Backend dependency audit passes: `npm audit --audit-level=high`.
- [x] Frontend dependency audit passes: `npm audit --audit-level=high`.
- [x] Frontend tests pass: `npm test`, 31/31.
- [x] Frontend lint passes: `npm run lint`.
- [x] Frontend typecheck passes: `npx tsc --noEmit`.
- [x] Frontend production build passes: `npm run build`, 46 routes.
- [x] Playwright mocked smoke passes: `npm run test:e2e`, 8/8 desktop/mobile Chromium.
- [x] Production config checker passes with synthetic production-shaped non-secret values.
- [x] Local isolated MongoDB concurrency tests pass.
- [x] Legacy COD route retired.

## External Evidence Gate

- [ ] Production backend intentionally configured with Razorpay test credentials for payment verification window.
- [ ] Razorpay test credentials confirmed on production via `/api/backend/order/checkout/razorpay-mode`.
- [ ] Full Razorpay matrix completed with dashboard evidence.
- [ ] Final-item concurrency verified only against isolated non-customer data.
- [ ] Inventory cleanup scheduler verified on production.
- [ ] Reconciliation scheduler verified on production.
- [ ] Monitoring test alert reaches owner/channel.
- [ ] MongoDB backup plus actual isolated restore drill completed.
- [ ] Render production env verified.
- [ ] Vercel production env verified.
- [ ] DNS and SSL verified.
- [ ] CORS and secure cookie behavior verified on real domain.
- [ ] Login and checkout tested on real iPhone Safari.
- [ ] Login and checkout tested on real Android Chrome.
- [ ] ZeptoMail controlled production test delivery verified.
- [ ] R2 controlled production test upload/read verified.

## Evidence Collected On 2026-08-11

- [x] Current branch recorded: `release/hrushe-prelaunch`.
- [x] Current commit recorded: `1cd4b57a0f17736ea7cb44e13ba3126b4e01694a`.
- [x] Vercel project visible: `hrushe-test`.
- [x] Vercel production deployment visible and `READY`: `dpl_Gfu8fpJNeTsjotDkKQvHLYUdjNkG`.
- [x] Vercel production deployment matches the current branch and commit.
- [x] Vercel production build logs show no error lines.
- [x] Vercel runtime error clusters: none found in the inspected 2-hour window.
- [x] DNS resolves for `hrushe.in`, `www.hrushe.in`, and `media.hrushe.in`.
- [x] TLS verifies OK for `hrushe.in` and `media.hrushe.in`.
- [x] Apex HTTPS returns 200 and `www` redirects to apex.
- [x] HTTP redirects to HTTPS.
- [x] Public product API and backend health endpoint return 200.
- [x] Public product media URL returns 200.
- [x] Unauthenticated admin API returns 401.
- [x] Invalid Razorpay webhook signature is rejected.
- [x] Public browser bundle scan found no obvious server-secret patterns.

## Failed Or Blocked Evidence

- [ ] Hosted production CORS clean denial retest: currently returns 500 for unapproved `Origin`; fixed locally, redeploy required.
- [ ] Hosted production CSP retest: Cloudflare analytics beacon is currently blocked by CSP; fixed locally, redeploy required.
- [ ] Hosted scheduler route retest: `/api/backend/internal/inventory/cleanup` currently returns 404; backend redeploy required.
- [ ] Render dashboard environment inspection: not accessible from this session.
- [ ] Vercel environment variable inspection: not exposed by the available connector tools.
- [ ] Razorpay production test-mode matrix: not executed; verifier requires explicit production mutation opt-in, webhook secret, test payload, and remote test-mode preflight.
- [ ] Production inventory concurrency: not executed; destructive customer-inventory concurrency is intentionally blocked.
- [ ] MongoDB backup/restore drill: not executed; provider backup and isolated restore target not accessible.
- [ ] Monitoring alert delivery: not executed; provider/channel not accessible.
- [ ] ZeptoMail controlled production test delivery: not executed; provider configuration not accessible.
- [ ] R2 upload/delete authorization: not executed; R2 credentials/provider tools not accessible.
- [ ] Real iPhone Safari journey: not executed from this environment.
- [ ] Real Android Chrome journey: not executed from this environment.

## Final Decision

- [ ] All external evidence recorded.
- [ ] Release owner signs off.
- [ ] Release status changed from NO-GO only after the above are complete.

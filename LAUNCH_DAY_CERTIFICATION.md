# HRUSHE Launch Day Certification

Date: 2026-08-12
Time IST: 15:24:38 IST
Primary URL: https://hrushe.in
Branch verified locally: release/hrushe-prelaunch
Current branch commit verified locally: eff1e2276c576a1abb07462036001247729d5bdb
Application release commit: 5da6977dcc1a44f8e79414e88278fd6fd5e0f7f9

## Launch Status

NO-GO

The exact blocker preventing launch is now backend-only: the Vercel frontend production deployment was promoted and the live CSP is fixed, but the Render-backed API behind `https://hrushe.in/api/backend` is still serving older behavior for launch-critical checkout infrastructure. The live backend still lacks required deployed routes and still returns an uncontrolled 500 for a bad CORS origin.

## Release Identity

| Item | Evidence |
| --- | --- |
| Local branch | `release/hrushe-prelaunch` |
| Current local branch commit | `eff1e2276c576a1abb07462036001247729d5bdb` |
| Application release commit | `5da6977dcc1a44f8e79414e88278fd6fd5e0f7f9` |
| Vercel production deployment | `dpl_2r3g1LjmfoRNJY6Sv4ipY9jFK3o7`, READY production target, commit `eff1e2276c576a1abb07462036001247729d5bdb`, promoted from preview `dpl_68bCgYcAXy2s1tsKAdrNGVFXjyBZ` |
| Previous Vercel production deployment | `dpl_Gfu8fpJNeTsjotDkKQvHLYUdjNkG`, production target, commit `1cd4b57a0f17736ea7cb44e13ba3126b4e01694a` |
| Production URL | `https://hrushe.in` |
| Backend deployment/version | Not directly detectable from headers; live backend behavior matches older code. Render request headers were present on API responses. |

## Baseline

| Gate | Status | Evidence |
| --- | --- | --- |
| Backend tests | PASS | `npm test`: 141/141 passed |
| Backend dependency audit | PASS | `npm audit --audit-level=high`: 0 vulnerabilities |
| Frontend tests | PASS | `npm test`: 9 files, 32 tests passed |
| Frontend lint | PASS | `npm run lint`: passed |
| Frontend TypeScript | PASS | `npx tsc --noEmit`: passed |
| Frontend build | PASS | `npm run build`: passed, 46 static pages generated |
| Frontend dependency audit | PASS | `npm audit --audit-level=high`: 0 vulnerabilities |

## Critical Systems

| System | Status | Evidence |
| --- | --- | --- |
| Frontend | PASS | Production domain now serves promoted Vercel deployment `dpl_2r3g1LjmfoRNJY6Sv4ipY9jFK3o7`; live CSP includes Razorpay CDN and Cloudflare analytics hosts. |
| Backend | FAIL | Live routes `/order/checkout/razorpay-mode` and `/internal/inventory/cleanup` return 404. |
| Database | NOT VERIFIED | `/readyz` returns `mongo: connected`; production data consistency audit was not available through hosted env. |
| Auth | PARTIAL | Signup/login pages render; invalid login UI automation could not complete due selector mismatch, but unauth protected APIs return 401. |
| Admin authorization | PASS | `/admin` shows admin gate; `/api/backend/admin/dashboard/overview` returns 401 unauthenticated. |
| Cart | PASS | Browser smoke: add to bag, cart totals, quantity increase/decrease, refresh persistence passed on desktop. |
| Checkout | FAIL | Checkout page renders, but payment mode route is 404 and live payment tests were stopped. |
| Razorpay | NOT VERIFIED | Mode prefix could not be safely verified because `/order/checkout/razorpay-mode` is 404 on production. |
| Webhook | PARTIAL | Invalid signature returns 401; actual provider delivery and duplicate signed event not verified. |
| Payment idempotency | NOT VERIFIED LIVE | Local tests pass; live successful/failed/retry/duplicate webhook flows not executed. |
| Inventory | NOT VERIFIED LIVE | Local tests pass; hosted production inventory consistency and concurrency not proven. |
| Scheduler | FAIL | `/api/backend/internal/inventory/cleanup` returns 404 on production. |
| Track Order privacy | PASS | Invalid lookup returns generic safe error; no private data observed. |
| CORS | FAIL | Unapproved `Origin` against `/api/backend/healthz` returns 500, not controlled 403. Legitimate origin returns 200. |
| CSP | PASS | Production header now includes `https://cdn.razorpay.com`, `https://static.cloudflareinsights.com`, and `https://cloudflareinsights.com`. |
| Cookies | PARTIAL | Security headers observed; auth cookie attributes were not fully verified without safe account login. |
| Email | NOT VERIFIED | No safe production/staging recipient/provider access used. |
| Media/R2 | PASS | Product primary and gallery media objects return 200 image responses with immutable cache headers. |
| Monitoring | NOT VERIFIED | Vercel runtime errors showed no clusters; alert destination/provider delivery not verified. |
| Backup/recovery | NOT VERIFIED | No restore drill evidence executed today. |

## Live Browser Smoke

Desktop Chromium and mobile emulation at 390px/430px loaded homepage, shop, PDP, cart, login, track order, and checkout without white screens, broken images, or horizontal overflow. PDP size chart and Add to Bag passed. Cart quantity controls and refresh persistence passed. Checkout form fill passed without submitting payment.

Known browser findings:

- Homepage `/shop` link click timed out in automation, though direct `/shop` loads and product links are present.
- Invalid login automation did not complete due selector mismatch; login page itself renders.
- Earlier CSP blocks for Cloudflare analytics and Razorpay risk detection were addressed by the Vercel production promotion; browser console was not re-run after promotion.

## Issues Found Today

| Severity | Issue | Evidence |
| --- | --- | --- |
| P1 | Hosted CORS regression still live | Bad origin to `/api/backend/healthz` returns 500 with generic internal error. |
| P1 | Scheduler route unavailable live | `/api/backend/internal/inventory/cleanup` returns 404. |
| P1 | Razorpay mode route unavailable live | `/api/backend/order/checkout/razorpay-mode` returns 404, so test/live mode cannot be certified. |
| P1 | Payment integrity not proven live | No successful/failed/retry/cancel/duplicate webhook test could be safely run without verified test mode. |

## Fixes Made Today

- Pushed existing launch hardening commit `79a6f370e13159420cfef1ec45d6e57fbaec6ce7` to `origin/release/hrushe-prelaunch`.
- Added `https://cdn.razorpay.com` to frontend `script-src`.
- Added `frontend/lib/csp-headers.test.ts` to assert required trusted Razorpay and Cloudflare CSP hosts.
- Committed and pushed fix `5da6977dcc1a44f8e79414e88278fd6fd5e0f7f9`.
- Promoted Vercel preview `dpl_68bCgYcAXy2s1tsKAdrNGVFXjyBZ` to production as `dpl_2r3g1LjmfoRNJY6Sv4ipY9jFK3o7`.

## Final Launch Matrix

| Gate | Status | Evidence |
| --- | --- | --- |
| Code baseline | PASS | Full requested baseline passed after today's CSP fix. |
| Backend tests | PASS | 141/141 passed. |
| Frontend tests | PASS | 32/32 passed. |
| Build | PASS | Next production build passed. |
| Dependency audit | PASS | Backend/frontend high audit found 0 vulnerabilities. |
| Production deployment | FAIL | Frontend is promoted and current; backend behavior is still older and launch-blocking. |
| Homepage | PASS | 200, renders, no broken images/overflow in browser smoke. |
| Shop | PASS | 200, six products, product links present. |
| PDP | PASS | Product detail renders with price, gallery, sizes, returns, size guide, add to bag. |
| Cart | PASS | Add, quantity controls, refresh persistence passed. |
| Auth | PARTIAL | Pages render; invalid login automation incomplete. |
| Admin auth | PASS | Admin UI/API gated unauthenticated. |
| Track Order privacy | PASS | Invalid lookup generic and private-data-free. |
| CORS | FAIL | Bad origin returns 500. |
| CSP | PASS | Live CSP includes Razorpay CDN and Cloudflare analytics hosts. |
| Backend health | PASS | `/healthz` 200; `/readyz` 200 with Mongo connected. |
| Scheduler | FAIL | Hosted route 404. |
| Razorpay mode | FAIL | Hosted mode route 404. |
| Razorpay test payment | NOT VERIFIED | Stopped because mode was not verifiable as test. |
| Payment failure | NOT VERIFIED | Not safe without test mode. |
| Payment retry | NOT VERIFIED | Not safe without test mode. |
| Webhook delivery | NOT VERIFIED | Provider dashboard/delivery unavailable. |
| Webhook signature | PARTIAL | Invalid signature rejected 401. |
| Duplicate webhook | NOT VERIFIED | No signed event replay available. |
| Payment reconciliation | NOT VERIFIED LIVE | Local tests pass; live flow not executed. |
| Inventory concurrency | NOT VERIFIED LIVE | Local tests pass; live staging/test inventory not available. |
| Inventory consistency | NOT VERIFIED LIVE | Local configured DB audit found 0 critical findings but was not production evidence. |
| Cookies | PARTIAL | Full auth cookie attributes not verified without safe login. |
| DNS | PASS | Apex, www, and media resolve through Cloudflare. |
| SSL | PASS | HTTPS responds with HSTS; HTTP redirects to HTTPS; www redirects to apex. |
| Email | NOT VERIFIED | No safe recipient/provider access used. |
| R2/media | PASS | Product media objects return 200. |
| Monitoring | PARTIAL | Vercel runtime error summary accessible; alert delivery not verified. |
| iPhone Safari | NOT EXECUTED | No real device test run. |
| Android Chrome | NOT EXECUTED | No real device test run. |
| Logs | PARTIAL | Vercel grouped logs reviewed; Render/provider logs not directly reviewed. |
| Customer journey | FAIL | Stopped before payment due unverified mode route. |
| Admin journey | NOT VERIFIED | No safe admin credentials/session used. |

## Launch Recommendation

NO-GO

The exact blocker preventing launch is: the Vercel frontend has been promoted, but the live Render-backed API still lacks launch-critical Razorpay mode and scheduler routes and still fails the bad-origin CORS probe. Payment mode, payment integrity, inventory cleanup, and hosted backend behavior therefore remain unproven for real customers.

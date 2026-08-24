# HRUSHE Testing and Evidence Report

Audit date: 2026-08-23  
Scope: safe, non-destructive verification only.  
Important limit: no real payments, OTPs, customer emails, database migrations, destructive admin actions, live provider operations, or production data changes were performed.

## Commands executed

| Area | Command | Working directory | Result | Passed | Failed | Skipped | Error or warning summary | Blocks production |
| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |
| Git state | `git status --short` | repo root | PASS | N/A | N/A | N/A | Clean before report files were created. | No |
| Git branch | `git branch --show-current` | repo root | PASS | N/A | N/A | N/A | Branch: `codex/hrushe-audit-cleanup`. | No |
| Backend unit/integration tests | `npm test` | `backend` | PASS | 150 | 0 | 0 | Expected structured log/error output appeared during tests. | No |
| Frontend lint | `npm run lint` | `frontend` | PASS | N/A | 0 | N/A | No lint failures. | No |
| Frontend unit/component tests | `npm test` | `frontend` | PASS | 37 tests in 11 files | 0 | 0 | Vitest warned that ESM syntax in CJS-loaded `vitest.config.ts` is unsupported by the future native config loader. | No |
| Frontend production build | `npm run build` | `frontend` | FAIL | N/A | 1 command | N/A | Next.js 16/Turbopack internal error: failed to write app endpoint `/page`; CSS process/port bind failed with `Operation not permitted (os error 1)`. Rerun outside sandbox produced the same failure. | Yes |
| Frontend diagnostic webpack build | `./node_modules/.bin/next build --webpack` | `frontend` | PASS | N/A | 0 | N/A | Next.js webpack build compiled, type-checked, and generated routes successfully. | No, but this does not replace the failing configured script unless adopted. |
| Frontend type check | `./node_modules/.bin/tsc --noEmit` | `frontend` | PASS | N/A | 0 | N/A | No TypeScript output/errors. | No |
| E2E test listing | `npm run test:e2e:list` | `frontend` | PASS | 8 listed | 0 | 0 | Listed Playwright tests for desktop and mobile projects. | No |
| E2E smoke tests | `npm run test:e2e` | `frontend` | PASS after allowed local server execution | 8 | 0 | 0 | First attempt failed because sandbox blocked local server bind on `0.0.0.0:3200`; rerun with allowed execution passed in about 7.6s. Tests mock backend APIs. | No, but not enough for production launch |
| Backend production dependency audit | `npm audit --omit=dev` | `backend` | PASS | N/A | 0 vulns | N/A | Found 0 vulnerabilities. | No |
| Frontend production dependency audit | `npm audit --omit=dev` | `frontend` | PASS | N/A | 0 vulns | N/A | Found 0 vulnerabilities. | No |
| Backend full dependency audit | `npm audit` | `backend` | PASS | N/A | 0 vulns | N/A | Found 0 vulnerabilities. | No |
| Frontend full dependency audit | `npm audit` | `frontend` | PASS | N/A | 0 vulns | N/A | Found 0 vulnerabilities. | No |
| Production config verification | `npm run config:verify-production` | `backend` | FAIL | Several checks | Several checks | N/A | Local env is not production-shaped. Missing required production vars and failing gates include app env, admin credentials, scheduler secret, R2 config, webhook secret, JWT strength, secure cookies, allowed origins, HTTPS URLs, live Razorpay config, OTP dev mode, email config. Values were not printed. | Yes until real staging/production env passes |
| Dependency freshness | `npm outdated` | `backend` and `frontend` | UNVERIFIED | N/A | N/A | N/A | Command produced no useful output and was interrupted after hanging. | No direct blocker; follow-up required |

## Tests executed

### Backend

Executed `npm test` in `backend`.

Result: PASS, 150/150 tests passed.

The backend suite exercises critical behavior across configuration, CORS, CSRF, auth, product validation, cart/checkout inventory behavior, Razorpay/payment/webhook logic, order status rules, tracking, support, media handling, operations state, and related utilities. It also produced expected structured logs for intentionally tested error paths.

### Frontend

Executed `npm run lint`, `npm test`, `./node_modules/.bin/tsc --noEmit`, `npm run test:e2e:list`, and `npm run test:e2e`.

Results:

- Lint: PASS.
- Unit/component tests: PASS, 37 tests across 11 files.
- Type check: PASS.
- E2E smoke: PASS, 8/8 tests after allowed local server execution.

Important E2E limitation: `frontend/e2e/prelaunch-smoke.spec.ts` mocks `/api/backend/*` responses. These tests verify browser rendering, guard behavior, basic cart setup, checkout Razorpay-readiness blocking, and route-level smoke behavior. They do not prove real backend connectivity, real database state, live payment integration, or live auth delivery.

## Build status

| Build path | Status | Notes |
| --- | --- | --- |
| Configured command: `frontend npm run build` | BROKEN | Fails under Next.js 16/Turbopack with CSS app endpoint/process bind error. This is a P0 launch blocker. |
| Diagnostic command: `frontend ./node_modules/.bin/next build --webpack` | PASS | Proves the app can compile through webpack, but the project package/deployment script still needs to be corrected or the root cause fixed. |

## Screens and routes checked

### Browser-checked by Playwright smoke tests

These were checked with mocked backend data across desktop/mobile projects:

- `/`
- `/collection/women`
- `/product/[id]` via collection click
- `/checkout`
- `/login`
- `/account`
- `/track-order`
- `/admin` guard/redirect behavior

Checked assertions included:

- Homepage heading attached and no broken customer-facing images under mock data.
- Collection showed mocked product card and product click reached product detail content.
- Checkout did not call backend checkout creation when Razorpay script was unavailable.
- Login, account, tracking, and admin guard pages loaded or redirected as expected.
- Runtime errors were filtered for hydration/uncaught error patterns in the collection/product smoke test.

### Routes found by code inventory

Customer/frontend routes present:

- `/`
- `/shop`
- `/women`
- `/men`
- `/collection/[slug]`
- `/product/[id]`
- `/search`
- `/cart`
- `/checkout`
- `/checkout/success`
- `/checkout/failure`
- `/checkout/pending`
- `/login`
- `/account`
- `/my-orders`
- `/my-orders/[id]`
- `/track-order`
- `/contact`
- `/policies`
- `/story`
- `not-found`
- `sitemap`
- `robots`

Admin routes present:

- `/admin`
- `/admin/login`
- `/admin/products`
- `/admin/products/[id]`
- `/admin/add-product`
- `/admin/inventory`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/shipping`
- `/admin/support`
- `/admin/customers`
- `/admin/customers/[id]`
- `/admin/reviews`
- `/admin/roles`
- `/admin/media`
- `/admin/reports`
- `/admin/reports/[section]`
- `/admin/homepage`
- `/admin/categories`
- `/admin/settings`
- `/admin/settings/[section]`
- Redirect/stub-like surfaces: `/admin/collections`, `/admin/audience`, `/admin/content`, `/admin/storefront`, `/admin/announcements`, `/admin/returns`, `/admin/coupons`

Routes not fully browser-tested against real backend:

- Product search and filter paths.
- Cart authenticated server-sync paths.
- Account profile/address/wishlist/support paths.
- My orders and order detail.
- Contact/support submission.
- Admin product creation/editing/media ordering.
- Admin order lifecycle and reconciliation.
- Admin support, customers, settings, reports, roles, and media library.
- Sitemap/robots against live product data.

## API routes checked

### Code-traced backend route groups

Backend route modules found and inspected at code level:

- Auth: `backend/src/routes/authRoutes.js`
- Account: `backend/src/routes/accountRoutes.js`
- Products: `backend/src/routes/productRoutes.js`
- Cart: `backend/src/routes/cartRoutes.js`
- Orders/checkout/payment/tracking: `backend/src/routes/orderRoutes.js`
- Content/homepage/settings/admin workspace: `backend/src/routes/contentRoutes.js`
- Admin dashboard/customers/staff: `backend/src/routes/adminRoutes.js`
- Support: `backend/src/routes/supportRoutes.js`
- Newsletter: `backend/src/routes/newsletterRoutes.js`
- Media upload/read: `backend/src/routes/mediaRoutes.js`
- Internal scheduler/reconciliation/monitoring: `backend/src/routes/internalRoutes.js`

### Frontend proxy

`frontend/app/api/backend/[...path]/route.ts` proxies browser calls to the backend, forwards headers safely, strips hop-by-hop headers, normalizes cookies to same-origin behavior, and applies no-store behavior to JSON responses.

### API execution limits

The backend server was not started locally during this audit because `backend/server.js` connects to the database, ensures an admin user, and starts inventory cleanup tasks. Those startup behaviors can modify data, which was outside the safe audit scope.

## Workflows checked

| Workflow | Evidence type | Result |
| --- | --- | --- |
| Storefront load | Mocked Playwright smoke plus code review | PARTIAL |
| Collection to product detail | Mocked Playwright smoke plus code review | PARTIAL |
| Checkout Razorpay script failure guard | Mocked Playwright smoke | COMPLETE for this specific guard |
| Backend inventory reservation/commit/release | Backend tests and code review | COMPLETE/PARTIAL |
| Razorpay order create/verify/webhook logic | Backend tests and code review | PARTIAL until provider matrix |
| Order status transition rules | Backend tests and code review | COMPLETE/PARTIAL |
| Public tracking privacy | Backend tests/code review | COMPLETE/PARTIAL |
| Auth/session/CSRF/CORS/rate limit | Backend tests and code review | COMPLETE/PARTIAL |
| Product publication validation | Backend tests and code review | COMPLETE/PARTIAL |
| Admin product/order/customer/support functions | Code review and route inventory | PARTIAL |
| Media upload validation | Backend code/tests and admin code review | PARTIAL |
| SEO sitemap/robots/metadata | Code review and build diagnostic | PARTIAL |
| Production deployment | Build/config commands and config files | BROKEN/PARTIAL |

## Failures

### P0: Frontend configured production build

`npm run build` in `frontend` failed. The failure was reproduced with allowed execution outside the sandbox. The error identified a Next.js 16/Turbopack internal failure while writing app endpoint `/page`, caused by CSS processing and process/port binding with `Operation not permitted (os error 1)`.

Production impact: configured frontend build/deployment path is not safe for launch until the script or root cause is fixed.

### P0: Backend production config verification

`npm run config:verify-production` in `backend` failed because this local environment does not have the required production/staging configuration. The script reported missing or failing gates for production app env, admin credentials, scheduler secret, R2 configuration, Razorpay webhook secret, JWT strength, secure cookie mode, allowed origins, HTTPS URLs, live Razorpay configuration, webhook secret, OTP dev mode, email configuration, and related production checks.

Production impact: launch cannot be approved until the real hosting environment passes this check without exposing secret values.

### Non-blocking but important: dependency freshness

`npm outdated` did not complete usefully and was interrupted. Dependency vulnerability audits passed with zero vulnerabilities, but freshness/currentness remains unverified.

## Untested areas and reasons

| Area | Reason not tested | Risk |
| --- | --- | --- |
| Live/sandbox Razorpay payment | No safe provider environment was confirmed; live payments prohibited. | P0 |
| Razorpay webhooks through public URL | Requires deployed backend URL and provider dashboard/webhook secret. | P0 |
| Real checkout against database | Backend startup can modify DB state; audit forbade data changes. | P0 |
| Real OTP/SMS/email delivery | No safe provider/staging credentials confirmed. | P1 |
| R2 object storage upload and public delivery | Requires live R2 credentials/config. | P1 |
| Admin login with real credentials | Would require known safe admin account/environment. | P1 |
| Admin product create/edit/archive with real DB | Would modify data. | P1 |
| Admin order status/shipping/refund operations | Would modify order data and may require provider state. | P1 |
| Scheduler jobs | Internal routes alter reservation/reconciliation state; need isolated staging. | P1 |
| Backup restore | Requires staging DB and backup target. | P1 |
| Monitoring/alert delivery | Requires configured monitoring/alert provider. | P1 |
| Lighthouse/Core Web Vitals | Requires working production build or deployed staging target. | P2 |
| Automated accessibility scan | Not part of existing safe test suite; should be added after build/staging is stable. | P2 |
| Broken-link/crawl scan | Requires stable deployed URL or local server with real content. | P2 |
| Load testing | Requires staging infrastructure and agreed traffic profile. | P2 |

## Evidence conclusions

Verified facts:

- Backend automated tests pass: 150/150.
- Frontend lint, unit/component tests, type check, and mocked Playwright smoke tests pass.
- Full and production dependency audits report zero vulnerabilities for both backend and frontend.
- The configured frontend production build fails.
- A diagnostic webpack build passes.
- Backend production config verification fails in this local environment.
- Real provider, staging, database-backed browser, scheduler, monitoring, backup, and live media storage checks remain unverified.

Launch implication:

HRUSHE should not go live until the configured build, production configuration, real backend E2E, and Razorpay/payment matrix are all passing with recorded staging evidence.

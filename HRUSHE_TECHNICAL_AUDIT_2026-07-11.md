# HRUSHE Technical Audit - 2026-07-11

Scope: codebase inspection, package/config review, env usage review without printing secrets, backend route/model review, local lint/test/build verification, live header/API checks against `https://hrushe.in`, and lightweight desktop/mobile screenshot checks. No UI files were changed by this audit.

## 1. Executive Summary

Verdict: Conditionally ready.

Scores:

| Area | Score | Notes |
| --- | ---: | --- |
| Overall production readiness | 7.4/10 | Real checkout, auth, admin, media, and security headers exist. A few operational/data-integrity gaps remain. |
| Frontend | 8/10 | Next.js build and lint pass; live storefront renders on desktop/mobile. Some mobile cookie/product controls need UX/accessibility review. |
| Backend | 7.5/10 | Server-side price/stock validation and Razorpay signature/webhook checks exist. Pagination, atomic admin updates, and profile email verification remain. |
| Security | 7.5/10 | HttpOnly auth cookie, CSRF for authenticated mutations, CSP/HSTS, webhook signature verification. In-memory rate limiting and account email-change flow need hardening. |
| Performance | 7/10 | Build is healthy; live product/API TTFB is acceptable but not great from this location. |
| Admin | 6.5/10 | Broad admin surface exists, but many operational modules are stored in one `SiteContent.adminWorkspace` blob. |
| SEO | 8/10 | Robots and sitemap are present; product URLs are server-rendered. Structured data depth was not fully verified. |
| Accessibility | 7/10 | Semantic/source review is decent; live mobile screenshot shows cookie controls can clip. Needs keyboard/screen-reader pass. |
| Maintainability | 7/10 | Clear frontend/backend split; some large controllers and Mixed admin state are growing risks. |
| Scalability | 6.5/10 | Mongo indexes exist for core models, but unbounded admin/product queries and in-memory rate/cache stores limit scale. |

Safe to accept real customer orders: yes, after the backend fixes in this audit are deployed and payment reconciliation is monitored. Do not consider this "fully hardened" until remaining P1/P2 items are closed.

## 2. Architecture Overview

Current stack:

- Frontend: Next.js `16.2.9`, React `19.2.4`, TypeScript, Tailwind 4 (`frontend/package.json`).
- Backend: Express `5.2.1`, Mongoose `9.3.0`, Razorpay, Nodemailer/ZeptoMail/SMTP, Cloudflare R2 SDK (`backend/package.json`).
- Deployment: Vercel/Cloudflare frontend, same-origin Next API proxy at `/api/backend/[...path]`, Render backend (`render.yaml`), MongoDB Atlas inferred from env examples.

Data flow:

`Browser -> Next app -> /api/backend proxy -> Express middleware -> route controller -> services/models -> MongoDB/R2/Razorpay/Email`

Notable implementation evidence:

- Same-origin backend proxy normalizes `Set-Cookie` and strips hop-by-hop headers: `frontend/app/api/backend/[...path]/route.ts`.
- Express server applies CORS, security headers, JSON limits, global rate limiting, and route mounting: `backend/server.js`.
- Auth is cookie/JWT based with `tokenVersion` invalidation: `backend/src/middleware/authMiddleware.js`.
- CSRF uses double-submit cookie/header for authenticated mutations: `backend/src/middleware/csrfMiddleware.js`.
- Checkout resolves product price/availability server-side before Razorpay order creation: `backend/src/services/checkoutInventory.js` and `backend/src/controllers/orderController.js`.

## 3. Critical Issues

### P0 - Inventory could be released by browser failure before late payment capture

Status: fixed in this audit.

Evidence:

- Checkout uses temporary reservations and Razorpay callbacks/webhooks.
- Browser failure/cancel callbacks are not authoritative provider events; a captured webhook can arrive after a customer closes the window.
- Before this audit, failure/cancel paths released inventory immediately. The patched code now keeps reservation until provider failure or expiry: `backend/src/controllers/orderController.js:746`.
- Inventory transition now throws if the variant update did not actually modify a reservation: `backend/src/services/checkoutInventory.js:219`.

Impact:

- Pre-fix risk: final-unit stock could be released, sold to someone else, and then a late successful payment could leave HRUSHE with a paid order but no committed stock.

Fix:

- Browser failure/cancel marks checkout status but does not release inventory.
- Provider `payment.failed` and reservation cleanup still release stock.
- Commit/release now fail loudly if Mongo did not update the expected variant.

Verification:

- `backend/test/checkoutInventory.test.js:60` covers failed commit behavior.
- `backend/test/checkoutInventory.test.js:88` covers successful release transition.

### P1 - Public signup route dereferenced `req.user`

Status: fixed in this audit.

Evidence:

- `/auth/signup` is public in `backend/src/routes/authRoutes.js:20`.
- Public signup logic now validates email/phone/password and OTP without reading `req.user`: `backend/src/controllers/authController.js:102`.

Impact:

- Pre-fix risk: valid signup could fail with an internal error before user creation.

Fix:

- Removed the invalid `req.user.email` comparison.

Verification:

- `backend/test/authController.test.js:32` covers public signup with matching OTP.

## 4. High-Priority Issues

| Priority | Issue | Evidence | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| P1 | Profile email changes do not require re-verification | `backend/src/controllers/accountController.js:150` updates `user.email`; `backend/src/controllers/authController.js:256` also updates email. | Identity/order notifications can move to an unverified address after login. | Forbid email changes or require OTP verification plus token invalidation. |
| P1 | Admin workspace is a single Mixed blob | `backend/src/models/SiteContent.js:40`; updates merge whole workspace at `backend/src/controllers/contentController.js:660`. | Concurrent admin edits can overwrite unrelated sections; audit logs lack before/after diffs. | Add per-module documents or versioned optimistic concurrency with delta audit logs. |
| P1 | Admin and product listing queries are unbounded | `backend/src/controllers/orderController.js:417`, `backend/src/controllers/adminController.js:131`, `backend/src/controllers/productController.js:539`. | Slow admin pages and memory pressure as orders/customers/products grow. | Add pagination, limits, filters, and index-backed sorting. |
| P1 | Product update accepts admin-provided `reserved` values | `backend/src/controllers/productController.js:154` normalizes variants including `reserved`. | Admin product edit can corrupt live reservations. | Preserve `reserved` server-side; expose read-only reserved count. |
| P1 | Money is stored as Number | `backend/src/models/Product.js:173`, `backend/src/models/Order.js:152`; Razorpay amount is `Math.round(totalAmount * 100)` at `backend/src/controllers/orderController.js:566`. | Future discounts/taxes can introduce rounding errors. | Store INR paise as integers or use Decimal128 consistently. |

## 5. Medium-Priority Issues

| Priority | Issue | Evidence | Recommendation |
| --- | --- | --- | --- |
| P2 | In-memory rate limiter | `backend/src/middleware/rateLimitMiddleware.js:3`. | Use Redis/Upstash or Render-compatible shared store before horizontal scaling. |
| P2 | User phone uniqueness is controller-only | `backend/src/models/User.js:121` has no unique index. | Add sparse unique index after dedupe migration. |
| P2 | Product delete is hard delete | `backend/src/controllers/productController.js:767`. | Prefer archive/hidden status; prevent delete when referenced by orders. |
| P2 | Product/search API has no pagination | `backend/src/controllers/productController.js:453`. | Add `limit`, `cursor`/`page`, and capped max. |
| P2 | OTP has no per-account failed-attempt counter | Signup OTP and password reset compare hashes but do not count failed guesses. | Add attempt count and lockout per OTP. |
| P2 | Admin route HTML is public/static | Live `HEAD /admin` returns 200 cached HTML; APIs remain protected. | Acceptable if intentional, but do not put sensitive data in static admin shell. |
| P2 | CSP still uses `unsafe-inline` | `frontend/next.config.ts:54`. | Move toward nonces/hashes after confirming Next/Razorpay needs. |
| P2 | Cookie banner mobile controls clip | Screenshot `/tmp/hrushe-audit-home-mobile.png`. | Adjust responsive layout later; no UI change made here. |

## 6. Low-Priority Issues

- Duplicate `orderNumber` key appears in `buildPublicTrackingResponse`: `backend/src/controllers/orderController.js:97`.
- Several controllers are large and cross-cutting; future refactors should split validation/service/persistence layers.
- README still has older roadmap language; deployment docs are more current.

## 7. Page-by-Page Findings

Verified live:

| Route | Result | Evidence |
| --- | --- | --- |
| `/` | 200, rendered desktop/mobile screenshots. Cookie banner can cover first-screen CTAs. | `curl -sI`; `/tmp/hrushe-audit-home-desktop.png`; `/tmp/hrushe-audit-home-mobile.png`. |
| `/product/white-solid-tee-oversize` | 200, mobile screenshot rendered product media/details. Cookie banner clips action area. | `/tmp/hrushe-audit-product-mobile.png`. |
| `/admin` | 200 static shell; no API data without auth. | `curl -sI https://hrushe.in/admin`. |
| `/robots.txt` | Present; blocks admin/API/account/cart/checkout/login/signup/search. | Live curl. |
| `/sitemap.xml` | Present; includes home, audience pages, collection, six product URLs. | Live curl. |

Built locally:

- 48 Next routes generated successfully in `npm run build`.
- Routes include storefront, account, checkout, order tracking, product/collection, and admin modules.

Not fully tested:

- Authenticated account/admin flows were not exercised because no test credentials were provided.
- Real Razorpay payment, webhook replay, refunds, returns, and shipping-provider flows were not executed.
- Full keyboard/screen-reader pass was not completed.

## 8. API Audit Table

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/signup` | Public | Fixed; OTP required. Rate-limited. |
| POST | `/auth/login` | Public | Customer only; admin blocked. Rate-limited. |
| POST | `/auth/admin-login` | Public | Admin only. Rate-limited. |
| POST | `/auth/signup/request-otp` | Public | Rate-limited; reveals duplicate email. |
| POST | `/auth/forgot-password/request-otp` | Public | Enumeration-resistant response for missing accounts. |
| POST | `/auth/forgot-password/reset` | Public | Needs failed-attempt lockout. |
| GET/PUT | `/auth/me`, `/auth/change-password`, `/auth/logout` | Cookie auth/CSRF for mutations | Change-password invalidates tokenVersion. |
| GET | `/products`, `/products/:id`, `/products/sitemap` | Public, optional admin | Server filters Draft/Hidden/Sold Out for public. Needs pagination. |
| POST/PUT/DELETE | `/products`, `/products/:id` | Admin + CSRF | Good media URL validation; reserved count should be protected. |
| POST/PATCH | `/products/:id/reviews...` | Customer/admin | Verified-purchase review enforced. |
| GET/POST/PUT/DELETE | `/cart/*` | Customer + CSRF for mutations | Server-side product resolution. |
| POST | `/order/checkout` | Public/optional auth | Server recalculates totals; rate-limited. |
| POST | `/order/checkout/verify` | Public/optional auth | Razorpay signature verified. |
| POST | `/order/checkout/webhook/razorpay` | Provider signature | Raw body and event idempotency used. |
| GET/POST | `/order/checkout/failure`, `/order/checkout/cancel` | State token | Patched to avoid authoritative stock release. |
| GET | `/order/myorders`, `/:id`, `/:id/invoice` | Customer/admin | Ownership checks present. |
| GET/PUT | `/order/all`, `/order/status/:id` | Admin perms | Needs pagination. |
| POST | `/order/track` | Public | Requires order id plus email or phone; rate-limited. |
| GET/PUT | `/content/*` | Public for homepage/settings, admin for workspace updates | Mixed JSON workspace needs concurrency controls. |
| GET/POST | `/media/*` | Public file read; admin upload | MIME and magic bytes checked; 25 MB max. |
| POST/GET/PUT | `/support/*` | Public create; admin manage | Validates content; sends emails best-effort. |
| POST | `/newsletter` | Public | Simple unique email capture; no CAPTCHA/bot control beyond global limiter. |
| GET/POST/PUT | `/admin/customers`, `/admin/staff` | Admin perms | Customer list unbounded. |

## 9. Database Findings

- Product, Order, WebhookEvent, AuditLog, NewsletterSubscriber, Counter have useful indexes.
- Missing unique phone constraint on users.
- Product variant SKU uniqueness is only within a product, not global.
- `SiteContent.adminWorkspace` is `Mixed`, so Mongo cannot validate nested admin data.
- Orders denormalize product name/price/image, which is good for invoices, but product hard delete can still orphan references.
- Monetary fields should move to integer minor units before coupons/taxes/refunds become active.

## 10. Security Findings

Strengths:

- Auth cookie is HttpOnly/Secure/SameSite through env validation.
- CSRF double-submit protection covers authenticated mutations.
- Backend checks admin permissions at route/controller level.
- Razorpay payment signatures and webhook signatures are verified.
- Live headers include HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- `npm audit --omit=dev` reports zero vulnerabilities in frontend and backend.

Risks:

- In-memory rate limiting is not durable across deploys/instances.
- Email change flow needs re-verification.
- OTP failure counters should be added.
- Admin static shell must remain data-free because it is publicly served.

## 11. Performance Findings

Local verification:

- `frontend npm run lint`: pass.
- `frontend npm run build`: pass, 48 app routes.
- `backend npm test`: pass.

Live timing spot checks from this machine:

| URL | Total | TTFB | Size |
| --- | ---: | ---: | ---: |
| `/` | 1.55s | 0.83s | 36 KB HTML |
| `/api/backend/products` | 1.29s | 1.29s | 2.2 KB JSON |
| `/product/white-solid-tee-oversize` | 0.68s | 0.67s | 28 KB HTML |

Targets:

- Product/API TTFB under 500 ms from primary customer region.
- Homepage HTML TTFB under 600 ms.
- Admin list APIs under 700 ms at 10k orders/customers with pagination.

## 12. Admin Panel Findings

Working foundation:

- Role catalog and route permissions exist.
- Product CRUD, review moderation, media upload, customer list/detail, staff roles, order status, support tickets, homepage/workspace updates are represented.
- AuditLog model stores actor/action/target/ip/user-agent.

Operational gaps:

- No optimistic locking for two admins editing the same workspace.
- Audit logs for workspace updates do not include field-level before/after deltas.
- Coupons, content pages, shipping settings, returns, and some marketing data are JSON workspace records rather than first-class models.
- Bulk import/export, CSV validation, refund workflows, shipment provider integration, and return/exchange state machines are not first-class backend systems yet.

## 13. Edge-Case Matrix

| Area | Scenario | Current behavior | Expected | Result | Severity | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| Signup | Public signup after OTP | Fixed; no `req.user` dependency | Creates verified user | Pass | P1 fixed | Done |
| Checkout | Payment captured after browser failure | Reservation kept until webhook/expiry | Late capture can commit | Improved | P0 fixed | Done |
| Inventory | Commit with missing reservation | Throws 409 | Do not silently confirm | Pass | P0 fixed | Done |
| Product admin | Edit variant reserved count | Payload can set `reserved` | Server-owned reserved count | Fail | P1 | Preserve reserved |
| Admin | Two admins edit workspace | Last write can overwrite | Version conflict or merge | Risk | P1 | Add versioning |
| Account | Change email | No OTP verification | Verify new email first | Risk | P1 | Add verification |
| Listing | Many orders/products | Unbounded query | Pagination | Risk | P1/P2 | Add limits |
| OTP | Repeated wrong OTP | Rate-limited only by route/IP | Per-account attempt cap | Risk | P2 | Add counters |
| Mobile UI | Cookie banner | Buttons/content clip in screenshots | Responsive controls | Fail | P2 | UI follow-up only |

## 14. Recommended Architecture

Immediate architecture changes should stay practical:

- Keep the same Next -> proxy -> Express -> Mongo architecture.
- Add pagination and query caps to product, order, customer, support, and admin list endpoints.
- Split `adminWorkspace` into first-class collections as usage grows: coupons, content pages, shipping settings, homepage sections, media assets, customer notes.
- Use optimistic concurrency (`version`/`updatedAt`) on admin content updates.
- Move rate limiting and short-lived caches to Redis/Upstash before scaling backend instances.
- Store money in paise integers, not decimal rupee Numbers.

## 15. Prioritised Roadmap

Immediate before launch:

- Deploy the backend fixes from this audit.
- Add profile email re-verification or temporarily block email edits.
- Protect product `reserved` stock from admin payloads.
- Add pagination to `/order/all`, `/admin/customers`, and `/products`.
- Run one real Razorpay test payment plus webhook replay in staging.

First 30 days:

- Add per-account OTP attempt counters.
- Add user phone unique index after data cleanup.
- Add admin workspace optimistic locking and field-delta audit logs.
- Add order/payment reconciliation dashboard for captured-but-not-confirmed orders.
- Add basic E2E tests for signup, login, checkout, order tracking, and admin order update.

30-90 days:

- Promote coupons/returns/shipping/content pages from JSON workspace to models.
- Add refund/return/exchange state machines.
- Add error monitoring and uptime alerts.
- Add load tests for product listing and checkout.

Later:

- Tighten CSP away from `unsafe-inline`.
- Add structured data audits and automated accessibility checks.
- Add visual regression tests for critical storefront/admin pages.

## 16. Final Verdict

HRUSHE has a solid production foundation: server-side checkout validation, Razorpay verification, auth cookies, CSRF, security headers, media validation, admin permissions, and a passing production build.

The two most dangerous issues found in this pass were fixed without touching UI. The remaining blockers are mostly operational hardening rather than brand or design work: verified email changes, product reservation ownership, admin concurrency/audit depth, pagination, and payment reconciliation. With those addressed, the platform can move from "conditionally ready" to "ready with minor fixes."

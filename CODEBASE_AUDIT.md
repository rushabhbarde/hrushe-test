# HRUSHE Codebase Audit

Reviewed on: 2026-07-24  
Commit SHA reviewed: `7585b15b003983e2c7d66fe6239c5249142f682f`  
Scope: local repository audit, static review, dependency audit, backend tests, frontend lint, production build. Live Razorpay, live MongoDB workflows, Lighthouse/Web Vitals, and cross-browser manual QA were not run.

## Architecture Summary

- Frontend: Next.js App Router, upgraded in this pass from `next@16.2.9` to `next@16.2.11`, React `19.2.4`, Tailwind CSS v4, TypeScript.
- Backend: Express `5.2.1`, CommonJS, MongoDB via Mongoose `9.3.0`.
- Deployment: backend Render blueprint in `render.yaml`; frontend is structured for Vercel/Next hosting.
- API connection: frontend uses same-origin proxy at `frontend/app/api/backend/[...path]/route.ts`, forwarding to `API_URL` or `NEXT_PUBLIC_API_URL`.
- Authentication: backend sets JWT cookie; frontend tracks session as cookie-backed state. CSRF uses readable `hrushe-csrf` double-submit cookie plus `X-CSRF-Token`.
- Authorization: backend role `admin` plus `adminRole` permission catalog in `backend/src/config/adminRoles.js`.
- Cart: guest cart in localStorage; authenticated cart stored in MongoDB and synced after login.
- Checkout: Razorpay order creation, backend order creation, variant stock reservation, browser verification, webhook processing, reconciliation, failure/cancel callbacks.
- Inventory: variant-level `stock` and `reserved`; reservations expire after 15 minutes and are cleaned up every 5 minutes in-process.
- Emails and OTP: signup, password reset, email change, order updates, support, newsletter; ZeptoMail primary with SMTP fallback, MSG91 OTP utility present.
- Admin: Next.js admin panel with role-gated pages, product/media/homepage/order/customer/support/reconciliation management.
- CMS/homepage: `SiteContent.adminWorkspace` and versioned admin workspace drive homepage sections, cards, banners, and website settings.
- Logging/monitoring: structured JSON logger with redaction, metrics logger, process error handlers.

## Data Model Map

| Model | Purpose | Key relationships |
|---|---|---|
| `User` | Customers and staff | `wishlist` refs `Product`; admin role fields; embedded addresses |
| `Product` | Catalog and inventory | Embedded variants, videos, reviews, size guide |
| `Cart` | Authenticated cart | `userId` unique ref to `User`; item refs to `Product` |
| `Order` | Checkout/order lifecycle | `userId` ref, product snapshots, payment and inventory reservation state |
| `SiteContent` | Homepage/admin workspace | singleton key `main` |
| `VerificationCode` | OTP flows | indexed by email, purpose, userId, TTL expiry |
| `WebhookEvent` | Razorpay webhook idempotency | unique provider/event id |
| `AuditLog` | Admin/security audit trail | actor, target, metadata |
| `SupportRequest` | Support tickets/chatbot | optional user, ticket counter |
| `NewsletterSubscriber` | Marketing signup | unique email |

## Major Risks And Status

| Priority | Area | Finding | Evidence | Status |
|---|---|---|---|---|
| P0 | Security | Admin review moderation `PUT /products/:id/reviews/:reviewId` lacked CSRF middleware. | Route stack had `protect`, permission check, handler, but no `requireCsrf`. | Fixed in `backend/src/routes/productRoutes.js`; regression test added. |
| P0 | Dependency security | Frontend still reports high-severity `sharp <0.35.0` through Next optional dependency. | `npm audit --omit=dev` after Next patch still reports 2 high advisories and only offers `npm audit fix --force`, which would downgrade Next to 14.2.35. | Remaining blocker. Do not force-downgrade without a migration plan. |
| P1 | Deployment reliability | `INTERNAL_SCHEDULER_SECRET` is required in production but was absent from `render.yaml`. | `backend/src/config/env.js` asserts it; `backend/.env.example` lists it; Render blueprint did not. | Fixed in `render.yaml`. |
| P1 | Checkout UX/inventory | Checkout could create/reserve a Razorpay checkout before the Razorpay browser script was loaded. | `createCheckout` ran before checking `window.Razorpay`. | Fixed with script-ready preflight in `frontend/app/checkout/page.tsx`. |
| P1 | Storefront media | Fallback banner paths are referenced but missing from `frontend/public/uploads/banners`. | References to `/uploads/banners/banner1.png`, `banner2.png`, `shopwomen.png`; only `.gitkeep` exists. | Not fixed; needs real editorial assets or CMS defaults. |
| P2 | Testing | No frontend unit/component/e2e suite found. | `frontend/package.json` has lint/build only. | Roadmap item. |
| P2 | SEO/performance | Product/listing UI is largely client-rendered after a `/products` fetch. | `/shop`, `/collection/[slug]`, `/product/[id]`, `/search` use `"use client"` and `useStorefrontData`. | Roadmap item; metadata/product schema exist. |
| P2 | Documentation | Root `README.md` states "no stock or inventory tracking", but production code has reservations and reconciliation. | Models/services/tests include inventory tracking. | Roadmap item. |

## Dead-Code Findings

| File path | Item | Evidence | Risk | Action |
|---|---|---|---|---|
| `frontend/public/file.svg` | Default scaffold asset | `rg` found no app references; build passed after removal. | Low | Removed. |
| `frontend/public/globe.svg` | Default scaffold asset | `rg` found no app references; build passed after removal. | Low | Removed. |
| `frontend/public/next.svg` | Default scaffold asset | `rg` found no app references; build passed after removal. | Low | Removed. |
| `frontend/public/vercel.svg` | Default scaffold asset | `rg` found no app references; build passed after removal. | Low | Removed. |
| `frontend/public/window.svg` | Default scaffold asset | `rg` found no app references; build passed after removal. | Low | Removed. |

No database fields, API endpoints, routes, controllers, or middleware were removed. Those require production-data confirmation and were not safe to remove in this pass.

## Duplicate-Code Findings

| Area | Evidence | Risk | Recommendation |
|---|---|---|---|
| Price formatting | Multiple local `formatPrice` helpers across cart, checkout, product cards. | Low | Centralize in `frontend/lib/pricing.ts` later. |
| Color swatch palettes | Separate swatch maps in product card, shop, product detail. | Low | Centralize color normalization once design tokens settle. |
| Product normalization | Similar normalization exists in `use-storefront.ts`, `server-storefront.ts`, product page. | Medium | Create a shared serializer/normalizer with tests. |
| Admin/frontend status constants | Order/product status logic is mirrored across backend and frontend. | Medium | Generate or share a typed contract if repo structure allows. |

## Backend Findings

- Strengths: integer-paise money utilities, webhook event idempotency, amount/currency checks, inventory commit/release tests, reconciliation locks, role permissions, audit logs, CSRF on most mutations, structured log redaction.
- Fixed: CSRF added to admin review moderation route.
- Fixed: Render production env contract now includes scheduler secret.
- Remaining: full Razorpay lifecycle needs staging execution, especially concurrent browser verification/webhook races and last-item purchase scenarios.
- Remaining: rate limiting is in-memory; acceptable for one small instance, weak for multi-instance production.
- Remaining: in-process inventory cleanup depends on one running web process; a Render cron or external scheduler should call the internal scan endpoint.

## Frontend Findings

- Strengths: restrained brand direction, good use of `next/image`, route metadata, product schema, accessible labels on many icon buttons, focused checkout and cart flows.
- Fixed: checkout now waits for Razorpay script readiness before creating a provider order/reservation.
- Remaining: global customer providers mount cart, wishlist, support, tracking, consent, and auth for most customer routes, increasing hydration cost.
- Remaining: missing fallback banner images can degrade first impressions and LCP when CMS media is absent.
- Remaining: product/listing pages are client-heavy; product content should be server-rendered where possible.

## Security Findings

- Fixed P0: CSRF on product review moderation.
- Improved: frontend Next/PostCSS patched from `16.2.9`/`8.5.10` to `16.2.11`/`8.5.12`.
- Improved: backend transitive `body-parser` patched from `2.2.2` to `2.3.0`.
- Remaining P0/P1: `sharp` advisory remains through Next optional dependency; monitor for a compatible Next/sharp patch.
- Good: backend removes `x-powered-by`, sets security headers, uses HMAC for Razorpay signatures, redacts sensitive log fields.

## Performance Findings

- Baseline/post-change production build succeeded.
- `.next/static`: 2.7 MB.
- `.next/server`: 23 MB.
- Largest static JS chunks: 221 KB, 134 KB, 110 KB.
- Largest CSS chunk: 138 KB.
- Main opportunities: reduce global client providers, server-render catalog/product data, add real responsive fallback images, run Lighthouse against staging with backend data.

## UX Findings

| Issue | Route | Severity | Impact | Recommendation |
|---|---|---|---|---|
| Missing fallback editorial banners | `/`, `/women`, `/men`, admin homepage defaults | P1 | Broken/empty premium first impression when CMS media absent | Add tracked fallback images or require CMS media. |
| Razorpay script race | `/checkout` | P1 | Could reserve stock/order before payment window opens | Fixed. |
| Client-rendered catalog grid | `/shop`, `/collection/*`, `/product/*` | P2 | Perceived loading and SEO weakness | Server-render initial product data. |
| Product media expand button advances image | `/product/*` | P2 | Label/action mismatch for assistive tech and users | Either implement expansion or relabel as next media. |
| Collection filter drawer lacks shared focus trap | `/collection/men`, `/collection/women` | P2 | Keyboard users can escape modal context | Reuse `useDialogAccessibility`. |

## Accessibility Findings

- Good: many controls have labels, modals use `role="dialog"` in several places, form fields have labels.
- Needs work: consistent focus trapping for all drawers, stronger visible focus review, product gallery controls should use accurate labels, live-region announcements for cart updates should be audited.

## SEO Findings

- Good: product metadata, Open Graph, Twitter cards, product schema, breadcrumb schema, organization schema, robots, sitemap.
- Needs work: server-render visible product details/grid HTML for crawlers and first paint; add canonical strategy for filtered collection URLs before exposing filter URLs.

## Admin Findings

- Good: role permission catalog, admin guard, workspace version conflicts, audit logging on sensitive changes.
- Fixed: review moderation mutation now has CSRF protection.
- Needs work: browser QA for product creation/editing/media/reconciliation workflows with real staging data.

## Testing Gaps

- Backend has 99 passing Node tests after this pass.
- Frontend has lint/build only; no component or browser automation tests.
- No local live Razorpay test was run and live payments were not enabled.
- No Safari/Edge/Chrome manual matrix was completed.

## Recommended Implementation Order

1. Resolve remaining frontend dependency advisory without unsafe downgrade.
2. Add real tracked fallback editorial images or enforce CMS media before launch.
3. Run full staging payment/inventory lifecycle tests with Razorpay test mode.
4. Add Playwright smoke tests for browse, product, cart, checkout failure/success shell, account, admin auth.
5. Server-render initial catalog/product payloads.
6. Tighten drawer/gallery accessibility.
7. Update stale README architecture.
8. Centralize duplicated formatting/product normalization.

# HRUSHE Improvement Roadmap

Reviewed on: 2026-07-24

## Immediate Fixes

1. Resolve the remaining frontend `sharp` advisory without forcing a Next downgrade.
2. Add real tracked fallback images for `/uploads/banners/banner1.png`, `/uploads/banners/banner2.png`, and `/uploads/banners/shopwomen.png`, or change defaults to known valid media.
3. Run Razorpay test-mode checkout in staging with webhook enabled.
4. Update production Render env values to include `INTERNAL_SCHEDULER_SECRET`.
5. Update README to reflect current inventory, Razorpay, admin roles, and reconciliation architecture.

## Pre-Launch Fixes

1. Add Playwright smoke tests for browse, search, product detail, add to cart, cart edit, checkout validation, checkout provider launch, order tracking, login/account, admin login.
2. Run staging inventory race tests for last-unit purchase and duplicate callback/webhook scenarios.
3. Add a scheduled external reconciliation/cleanup trigger instead of relying only on in-process intervals.
4. Validate email templates and OTP delivery in production-like staging.
5. QA admin product/media/order/reconciliation flows with staff roles.
6. Audit cookie behavior on Safari with same-origin proxy and CSRF cookie.

## Post-Launch Improvements

1. Add analytics dashboards for checkout creation, provider launch, payment success/failure, manual review, inventory release, and support tickets.
2. Add admin export/reporting for reconciliation and stuck orders.
3. Add customer-facing delayed-payment recovery messaging.
4. Add richer size guidance from returns/exchange data.

## Premium-Brand Improvements

1. Replace all placeholder/default imagery with consistent HRUSHE editorial assets.
2. Build a visual QA checklist for homepage, gender pages, PLP, PDP, cart, checkout on mobile and desktop.
3. Reduce repeated trust copy and keep it context-specific.
4. Refine product-card hover behavior after real image sets are available.
5. Ensure sale language is secondary and does not dominate the premium positioning.

## Performance Improvements

1. Server-render initial catalog/product content and hydrate filters/actions only.
2. Lazy-load support chat and non-critical drawers after idle or user intent.
3. Capture route-level bundle analyzer output.
4. Run Lighthouse/Web Vitals on staging with real product images.
5. Add image dimension and file-size budgets for admin media uploads.

## Technical-Debt Improvements

1. Centralize price formatting, color swatches, and product normalization.
2. Share typed status/permission contracts between backend and frontend.
3. Add frontend unit tests for cart provider, checkout validation, product availability, and API proxy behavior.
4. Move operational scheduled jobs to a durable scheduler.
5. Add route-contract tests for every admin mutation requiring CSRF.
6. Add database migration notes for any future field removal.

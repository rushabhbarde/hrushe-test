# HRUSHE Backend Consistency Audit

Date: 2026-08-23

## API Inconsistencies

- Existing list APIs preserve legacy array responses unless `paginated=true`, `page`, or `limit` is requested. This is backward compatible and useful for staged migration.
- Admin orders now support `search`/`query`/`q`, `status`/`orderStatus`, `payment`/`paymentStatus`, `from`, `to`, and sort keys without changing the legacy response shape.
- Admin customers now support safe `search`/`query`/`q` filtering before pagination.

## Validation Gaps

- Product active-state validation is strong: price, description, category, color, size, inventory, stock, media, fabric/weight/care, and return eligibility are required before active publish.
- Order status validation is enforced on the backend and now mirrored in the admin frontend.
- Homepage workspace validation blocks unsafe URLs, embedded media, missing published media, invalid schedules, and unsupported layout presets.
- Remaining gap: inventory adjustment reason/history is not persisted.

## Authentication And Authorization Findings

- Admin routes use `protect`, `adminOnly`, and/or `requireAdminPermission`.
- Mutating product/order/content/staff/review endpoints use CSRF protection.
- Workspace updates map top-level workspace keys to permissions.
- Recommendation: add automated route authorization matrix tests for every admin route and role.

## Data-Model Findings

- Products use a single `Product` model with variants, status, media URLs, reviews, merch flags, and paise-compatible price fields.
- Orders use a single `Order` model with item snapshots, paise totals, payment/reconciliation fields, tracking fields, and inventory reservation state.
- `SiteContent` stores homepage banner and mixed admin workspace data. This avoids migrations but makes some CMS-like data less strongly typed.
- Users store customer and admin/staff accounts with role and adminRole fields.

## Inventory And Order Risks

- Checkout reservations decrement stock and increment reserved inventory, reducing oversell risk.
- Reservation cleanup and payment reconciliation have tests for stale/failed/manual-review scenarios.
- Products with active reservations cannot be archived; referenced products cannot be permanently deleted.
- Remaining risk: no inventory adjustment ledger; manual stock edits are not reason-coded.

## Changes Completed

- Added `buildAdminOrderFilter` and `buildAdminOrderSort` to `backend/src/controllers/orderController.js`.
- Wired those helpers into `getAllOrders`.
- Added `buildCustomerListFilter` to `backend/src/controllers/adminController.js`.
- Added regression tests in `backend/test/orderController.test.js` and `backend/test/adminOperations.test.js`.

## Migration Requirements

- None for this pass. No database schema changes were made.

## Remaining Risks

- Default `next build` with Turbopack panics in this local environment while binding an internal worker port; webpack build passes.
- Live Razorpay checkout/refund/webhook flows were not executed.
- Authenticated admin CRUD was not manually exercised against staging credentials.
- Admin workspace remains mixed-shape data; future model-backed CMS/category/inventory history work would need migrations and rollback plans.


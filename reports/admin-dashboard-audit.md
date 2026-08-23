# HRUSHE Admin Dashboard Audit

Date: 2026-08-23

## Overall Assessment

The HRUSHE management system already has a strong split between public storefront data, admin-only operations, and workspace-managed content. Product, order, inventory, homepage, settings, staff-role, support, media, and review surfaces exist, and the backend includes meaningful permission checks, CSRF checks on mutations, audit logging, paise-based money normalization, product lifecycle rules, and checkout inventory reservation logic.

The main implemented gaps in this pass were operational consistency issues rather than missing architecture: admin order/customer data could silently stop at the first API page, admin order status choices did not reflect backend transition rules, and admin list endpoints did not expose enough safe server-side filtering for large data sets.

## Complete Data Flow Map

`Admin form -> Admin API request -> Backend validation -> Database -> Customer-facing API -> Website display`

| Flow | Admin form | Admin API request | Backend validation | Database | Customer-facing API | Website display |
| ---- | ---------- | ----------------- | ------------------ | -------- | ------------------- | --------------- |
| Product create/edit | `frontend/components/admin-product-form.tsx` | `/products` POST/PUT | `normalizeProductPayload`, active completeness checks, no embedded media, SKU and stock validation | `Product` | `/products`, `/products/:id`, `/products/sitemap` | Shop, collection, product cards, product detail |
| Inventory edit | Product form variant rows | `/products/:id` PUT | Non-negative integer stock, reserved inventory preservation, reserved SKU removal/deactivation block | `Product.variants` | `/products`, checkout item resolver | Product availability, quick add, checkout |
| Order fulfilment | `frontend/app/admin/orders/[id]/page.tsx` | `/order/status/:id` PUT | Allowed statuses, valid transitions, paid-only fulfilment, conditional status update | `Order` | `/order/:id`, `/order/track`, `/order/myorders` | Account orders, tracking page, invoice |
| Homepage sections | `frontend/app/admin/homepage/page.tsx` | `/content/admin-workspace` PUT | Permission by workspace key, version check, media/link/date validation, publish media completeness | `SiteContent.adminWorkspace.homeManagement` | `/content/homepage`, `/content/homepage-management` | Homepage, men/women audience pages, header links |
| Website settings | `frontend/app/admin/settings/page.tsx` | `/content/admin-workspace` PUT | Permission check, safe email/phone/social URL validation | `SiteContent.adminWorkspace.websiteSettings` | `/content/settings` | Footer/contact/social settings |
| Customer list/detail | `frontend/app/admin/customers/page.tsx` | `/admin/customers`, `/admin/customers/:id` | Admin permission, password fields excluded, new safe backend search filter | `User`, `Order` | Not public except account-authenticated customer APIs | Admin CRM surfaces |
| Staff roles | `frontend/app/admin/roles/page.tsx` | `/admin/staff`, `/admin/staff/:id/role` | Admin permission, CSRF, password strength, duplicate phone/email checks, last-super-admin guard | `User.adminRole` | None | Admin route gating and navigation |

## Initial Audit Table

| Area | Existing functionality | Current problem | Missing admin control | Frontend dependency | Backend dependency | Recommended change | Risk |
| ---- | ---------------------- | --------------- | --------------------- | ------------------- | ------------------ | ------------------ | ---- |
| Dashboard overview | Revenue, orders, payments, inventory, storefront signals, support attention | Good server-derived data; no fake analytics observed | None critical | `useAdminDashboardOverview` | `getDashboardOverview` | Continue using verified paid-order data only | Safe to implement now |
| Product management | Create/edit/archive/restore/permanent delete, variants, SKU, images, gallery, videos, reviews, status, featured flags | No dedicated duplicate action; category data is workspace-backed string list rather than full model | Duplicate product, richer category records | Product form and admin workspace | `Product`, `productController` | Add duplicate action and model-backed categories only if business wants it | Business approval / migration if category model added |
| Categories/collections | Admin category page/workspace list, product category assignment | No separate category model with images/descriptions/order | Full CRUD category records | Admin workspace | `SiteContent.adminWorkspace.catalogCategories` | Keep workspace list unless storefront needs category landing metadata | Not currently necessary |
| Inventory | Variant-level SKU/stock/reserved, reservation cleanup, oversell protections | Low-stock threshold differs between dashboard (`3`) and admin inventory UI (`5`) | Adjustment reason/history | Product variants, inventory page | `Product.variants`, checkout inventory service | Standardize threshold; add audit trail only with explicit scope | Safe now for threshold, migration for history |
| Orders | List/detail, status updates, tracking fields, invoice, reconciliation, cancellation state | List previously loaded only first API page; UI allowed invalid statuses before backend rejected | Internal note persistence, refund integration | Orders list/detail | `Order`, `orderController` | Implemented complete paginated fetch and transition UX guard | Safe to implement now |
| Customers | List/detail with orders, wishlist, addresses, status classification | Backend search was absent before pagination | Notes/account block persistence exists as workspace metadata, not user model | Customer pages | `User`, `Order`, `adminController` | Implemented safe backend search filter; evaluate model-backed notes later | Safe now; migration if model-backed notes |
| Homepage/storefront | Workspace-managed homepage sections/cards/banner/settings | Public design depends on available media; missing media renders approved fallback/empty states | Navigation/footer links beyond settings are partial | Homepage/admin workspace | `SiteContent` | Keep exact storefront design; expand only missing live dynamic fields when needed | Safe to implement now |
| Policy/site settings | Workspace content page records and settings exist | Public policy page integration requires continued audit before claiming complete CMS behavior | Rich policy publish workflow | Settings/content pages | `SiteContent.adminWorkspace.contentPages` | Add safe rich-text renderer only if current policy pages consume it | Business approval |
| Permissions/safety | Admin-only middleware, permission catalog, CSRF on mutations, audit logs | Some workspace-backed metadata is broad and mixed-shape | Fine-grained permission tests per route | Admin guard/shell | `authMiddleware`, admin roles | Add route-level authorization tests for each admin API group | Safe to implement now |

## Existing Admin Capabilities

- Dashboard: paid revenue, order queues, payment review counts, inventory counts, support attention, storefront warning cards, recent orders, top products.
- Products: create/edit, archive, restore, permanent delete with safety rules, images/gallery/videos, variants/SKUs/stock, status, featured/new flags, reviews.
- Orders: search/filter UI, details, line items, customer/address/payment data, status/tracking/courier updates, invoice download, cancellation action, shipping update metadata.
- Homepage: sections, cards, ordering, visibility, publish dates, desktop/mobile media, labels/titles/subtitles/links, preview, media validation.
- Customers: searchable profiles, order totals/history summary, wishlist, addresses, notes/block metadata.
- Roles: role definitions, staff creation, role changes, permission-aware navigation and routes.
- Settings/media/reviews/support/reports pages are present and workspace-backed where applicable.

## Changes Implemented

- Added safe backend filtering/sorting for admin orders in `backend/src/controllers/orderController.js`.
- Added safe backend search filtering for admin customers in `backend/src/controllers/adminController.js`.
- Updated `frontend/lib/use-admin-data.ts` to fetch all paginated admin order/customer pages instead of only the first page, with permission-aware request caching.
- Added shared frontend lifecycle helpers in `frontend/lib/orders.ts`.
- Updated `frontend/app/admin/orders/[id]/page.tsx` to block invalid order transitions and unpaid fulfilment before submission.
- Added backend and frontend regression tests for the new behavior.

## Items Requiring Approval

- Real refund workflow integration with Razorpay and admin refund-state persistence beyond workspace metadata.
- Model-backed category/collection records with image/order/visibility fields.
- Inventory adjustment ledger or audit-trail collection.
- Destructive data migrations or schema changes.
- Any payment/authentication behavior changes beyond validation and reporting.


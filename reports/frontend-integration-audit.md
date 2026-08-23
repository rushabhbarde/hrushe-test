# HRUSHE Frontend Integration Audit

Date: 2026-08-23

## Hard-Coded Content

- Header/footer navigation remains partly static in `site-header.tsx` and `site-footer.tsx`; contact/social settings are already fetched from `/content/settings`.
- Default homepage sections exist in `frontend/lib/admin-workspace.ts` and are used as safe fallback content when no published workspace sections exist.
- Default product categories exist in `frontend/lib/catalog.ts` and merge with workspace categories.
- Policy page content appears workspace-ready but requires a separate renderer verification pass before claiming full admin-managed policy publishing.

## Data Inconsistencies Found

- Admin order/customer shared data previously requested `/order/all` and `/admin/customers` without pagination parameters, so only the legacy first page could be loaded.
- Admin order detail allowed selecting lifecycle states that the backend would reject, creating a confusing save failure.
- Backend order list did not expose safe admin search/filter/sort support despite frontend search needs.
- Backend customer list did not expose safe search before pagination.

## Changes Completed Without Changing Customer Design

- `frontend/lib/use-admin-data.ts`: fetches all paginated admin order/customer pages with a 5,000-row guardrail.
- `frontend/lib/orders.ts`: shared order lifecycle helpers matching backend rules.
- `frontend/app/admin/orders/[id]/page.tsx`: disabled invalid status options and prevented unpaid fulfilment locally.
- No storefront page/component CSS or layout files were edited.

## Functional Defects

- Fixed: first-page-only admin data loading.
- Fixed: invalid admin order status transitions reaching the backend unnecessarily.
- Fixed: missing backend admin list filters for orders and customers.
- Not fixed: model-backed internal order notes, refund processing, category image/description/order records, and inventory adjustment history.

## Responsive Defects

- No new customer-facing responsive defects were observed in the smoke screenshots.
- Admin mobile/tablet ergonomics were not fully manually tested with authenticated data.

## Visual Regression Result

- Captured current customer screenshots:
  - `reports/screenshots/storefront-home-desktop-2026-08-23.png`
  - `reports/screenshots/storefront-home-mobile-2026-08-23.png`
  - `reports/screenshots/storefront-shop-desktop-2026-08-23.png`
  - `reports/screenshots/storefront-shop-mobile-2026-08-23.png`
- Existing baseline screenshots were present for home/shop views.
- Pixel variance checks showed nonblank pages at expected dimensions.
- Result: visual smoke passed for local production server. This was not a full automated pixel-diff approval because the local server used fallback data/media rather than live production content.

## Recommendations Not Implemented

- Add formal Playwright visual regression with stable seeded backend data.
- Add admin pagination controls to order/customer pages instead of loading all pages into memory.
- Add navigation/footer link management only if business users need to change those links regularly.


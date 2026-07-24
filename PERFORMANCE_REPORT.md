# HRUSHE Performance Report

Reviewed on: 2026-07-24  
Environment: local production build on the shared workspace. Lighthouse/Web Vitals were not run because a complete staging backend, product media set, and test-payment environment were not available.

## Baseline Metrics

Initial build before implementation:

- `npm run build` in `frontend`: passed on Next `16.2.9`.
- Static routes generated: 46.
- `.next/static`: 2.7 MB.
- `.next/server`: 23 MB.
- Largest JS chunks: 221 KB, 134 KB, 110 KB.
- Largest CSS chunk: 138 KB.

After implementation:

- `npm run build` in `frontend`: passed on Next `16.2.11`.
- Static routes generated: 46.
- `.next/static`: 2.7 MB.
- `.next/server`: 23 MB.
- Largest JS chunks: 221 KB, 134 KB, 110 KB.
- Largest CSS chunk: 138 KB.

## Main Bottlenecks

| Area | Finding | Impact |
|---|---|---|
| Hydration | Global `AppProviders` mount auth/cart/wishlist/support/tracking/consent for storefront routes. | Higher baseline client JS and hydration work. |
| Product pages | Product detail UI is client-rendered after catalog fetch, despite server metadata/schema fetch existing. | Slower perceived product content and weaker crawlable body content. |
| Listing pages | `/shop`, `/collection/*`, `/search` fetch products on the client. | Loading states before products are visible. |
| Images | Referenced fallback banners are missing from `public/uploads/banners`. | Broken imagery and poor LCP/brand perception if CMS media is absent. |
| Third party | Razorpay checkout script loads on checkout mount. | Necessary for checkout, but should not create backend checkout before script is ready. Fixed. |

## Bundle Findings

- Static payload stayed flat after the dependency patch and cleanup.
- Largest JS chunks remain under 250 KB individually, but route-level ownership needs bundle analyzer output for exact attribution.
- A future `next experimental-analyze` run should be captured once registry/network access is reliable.

## Image Findings

- `next/image` is used broadly.
- Product/media URLs can bypass optimization through `shouldBypassImageOptimization`; audit the media source rules before launch.
- Missing default banners: `/uploads/banners/banner1.png`, `/uploads/banners/banner2.png`, `/uploads/banners/shopwomen.png`.

## API Findings

- Frontend same-origin proxy avoids CORS complexity and normalizes cookies.
- JSON proxy responses are marked `private, no-store`.
- Server storefront fetches use `AbortSignal.timeout(8000)` and fallback data.
- Client product fetch caching is module-scoped only, not persisted across sessions.

## Database Findings

- Useful indexes exist on order status, payment status, customer email, reservation expiry, reconciliation fields, product text search, and product status/category.
- Potential N+1 areas require query profiling with staging data, especially admin dashboard/order/customer pages.

## Changes Implemented

- Patched Next/PostCSS versions to reduce frontend dependency risk.
- Patched backend transitive `body-parser` through npm audit fix.
- Added checkout Razorpay script readiness preflight before backend checkout creation.
- Removed unused default scaffold SVG assets.

## Before And After

| Metric | Before | After |
|---|---:|---:|
| `.next/static` | 2.7 MB | 2.7 MB |
| `.next/server` | 23 MB | 23 MB |
| Largest JS chunk | 221 KB | 221 KB |
| Largest CSS chunk | 138 KB | 138 KB |
| Frontend production build | Pass | Pass |

## Remaining Opportunities

1. Run Lighthouse against staging on `/`, `/shop`, `/product/:slug`, `/cart`, `/checkout`.
2. Server-render initial product/listing data and hydrate only controls.
3. Split support/chat/consent/wishlist/cart providers by route or lazy load drawers.
4. Add responsive, real fallback imagery and verify image dimensions.
5. Add route-level bundle analysis to identify admin/storefront shared chunks.

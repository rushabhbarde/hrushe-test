# HRUSHE Admin Storefront Mapping

Date: 2026-08-23

| Website element | Current data source | Admin control available | Backend/API support | Gap | Final solution |
| --------------- | ------------------- | ----------------------- | ------------------- | --- | -------------- |
| Homepage announcement/hero fallback | `SiteContent.homepageBanner` defaults plus workspace banner overlay | Yes | `/content/homepage`, `/content/homepage` PUT | Active workspace banners require uploaded media | Existing control retained; validation documented |
| Homepage sections/cards | `SiteContent.adminWorkspace.homeManagement.sections` | Yes | `/content/admin-workspace`, `/content/homepage-management` | Requires complete media before publish | Existing control retained; no storefront visual changes |
| Homepage card titles/images/links/order | Admin workspace sections/cards | Yes | Workspace validation for URLs, media, dates, text limits | No separate CMS preview URL | Existing admin preview retained |
| Women/men audience sections | Admin workspace filtered by audience | Yes | `/content/homepage-management` | Depends on complete uploaded media | Existing flow retained |
| Header navigation | Static component plus homepage-management fetch for mobile/audience context | Partial | Public content APIs | Full nav-link CRUD not implemented | Recommended future workspace nav settings |
| Footer contact/social | Public website settings | Yes for contact/social | `/content/settings`, workspace settings | Footer link list still partly static | Existing settings retained; recommend link-list workspace if needed |
| Products | `Product` documents | Yes | `/products`, `/products/:id` admin/public mode | No duplicate-product action | Existing CRUD retained |
| Product images/gallery/videos | `Product.images`, `galleryImages`, `videos` | Yes | Product create/update, media upload | Alt text not modeled per image | Recommend image object schema only with migration approval |
| Product price/compare-at | `Product.pricePaise`, `compareAtPricePaise` with rupee compatibility | Yes | Product validation and money utils | None observed | Existing behavior retained |
| Product variants/SKUs/stock | `Product.variants` | Yes | Product update and checkout inventory service | No adjustment reason/history | Recommend ledger only with migration approval |
| Featured/new-arrival sections | Product flags and storefront sorting helpers | Yes | `/products?featured=true`, `newIn`, `newArrival` | Section naming is implicit | Existing flag controls retained |
| Cart | Browser cart state plus live product revalidation | Customer-controlled | Cart and checkout APIs | Admin does not manage carts | Not currently necessary |
| Checkout | Razorpay-backed order creation | No admin initiation UI | `/order/checkout`, Razorpay verify/webhook | Payment config/live testing not executed | Preserve existing integration |
| Customer account orders | `Order` documents | Admin updates status/tracking | `/order/:id`, `/order/myorders` | Admin internal notes not model-backed | Recommend notes field with audit trail |
| Public tracking | `Order` status/tracking with redacted lookup | Admin updates status/tracking | `/order/track`, `/order/status/:id` | Invalid statuses previously selectable in admin UI | Implemented frontend transition guard |
| Policies/support copy | Workspace `contentPages` and settings | Partial | `/content/admin-workspace` | Public policy rendering needs deeper pass before claiming complete CMS | Recommend safe structured renderer |

## Final Storefront Position

No customer-facing layout, colors, typography, spacing, images, animation, public navigation structure, homepage components, product listing components, cart, or checkout design files were changed in this pass. Storefront work was limited to shared operational helpers and verification screenshots.


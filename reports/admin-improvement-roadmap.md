# HRUSHE Admin Improvement Roadmap

Date: 2026-08-23

| Priority | Item | Business impact | Technical impact | Recommended solution | Affected area | Effort | Backend changes required |
| -------- | ---- | --------------- | ---------------- | -------------------- | ------------- | ------ | ------------------------ |
| Critical | Authenticated staging QA for product/order/homepage workflows | Confirms business users can operate without code edits | Exercises real auth, media, product, order, and content paths | Run scripted and manual staging QA with seeded data and admin roles | Admin, backend, storefront | Medium | No, unless defects found |
| Critical | Default Turbopack build failure investigation | Prevents CI/deploy surprise if default build path is used | Build tool/environment mismatch | Use webpack build in CI or resolve Turbopack internal worker port binding | Frontend build | Small | No |
| High | Admin API authorization matrix tests | Reduces permission bypass risk | Adds route/role test coverage | Generate tests for each admin route and permission | Auth/admin APIs | Medium | No |
| High | Order notes and refund workflow | Improves support and payment operations | Adds durable fields/actions and audit events | Add internal notes to `Order`; integrate explicit Razorpay refund states only after approval | Orders/payments | Medium | Yes |
| High | Inventory adjustment ledger | Prevents silent stock corruption | Adds append-only inventory event model | Add adjustment endpoint with reason, actor, before/after quantity, and SKU | Inventory/products | Large | Yes |
| Medium | Admin list server pagination UI | Improves performance with large data | Replaces all-page client loading | Add page controls using existing paginated APIs | Orders/customers/reports | Medium | No |
| Medium | Model-backed categories/collections | Lets business manage collection images/descriptions/order | Requires new model and migration from workspace strings | Add Category model only if storefront category metadata is needed | Catalog/storefront | Large | Yes |
| Medium | Formal visual regression suite | Protects premium storefront presentation | Adds seeded screenshots and diff thresholds | Playwright screenshots with deterministic mock backend/media | Storefront QA | Medium | No |
| Low | Duplicate product action | Speeds catalog operations | Copies safe product fields as draft | Add admin UI action and backend duplicate endpoint | Products | Small | Yes |
| Low | Navigation/footer link management | Reduces code edits for link changes | Extends workspace settings shape | Add link-list controls and public settings output | Storefront settings | Small | Maybe |


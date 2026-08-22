# HRUSHE Cleanup Report

Reviewed on: 2026-07-24

## Deleted Or Consolidated Items

| File path | Item removed | Evidence it was unused | Risk assessment | Replacement | Verification |
|---|---|---|---|---|---|
| `frontend/public/file.svg` | Default Next scaffold icon | `rg` found no references in app/source. | Low | None needed. | `npm run lint`, `npm run build` passed. |
| `frontend/public/globe.svg` | Default Next scaffold icon | `rg` found no references in app/source. | Low | None needed. | `npm run lint`, `npm run build` passed. |
| `frontend/public/next.svg` | Default Next scaffold logo | `rg` found no references in app/source. | Low | None needed. | `npm run lint`, `npm run build` passed. |
| `frontend/public/vercel.svg` | Default Vercel scaffold logo | `rg` found no references in app/source. | Low | None needed. | `npm run lint`, `npm run build` passed. |
| `frontend/public/window.svg` | Default Next scaffold icon | `rg` found no references in app/source. | Low | None needed. | `npm run lint`, `npm run build` passed. |

## Dependency Cleanup

| Package area | Change | Evidence | Verification |
|---|---|---|---|
| Backend transitive dependencies | `body-parser` moved from `2.2.2` to `2.3.0` through lockfile audit fix. | Backend `npm audit --omit=dev` initially reported 1 low advisory; after fix found 0 vulnerabilities. | `npm test` passed 99/99. |
| Frontend dependencies | `next` and `eslint-config-next` moved from `16.2.9` to `16.2.11`; PostCSS override moved from `8.5.10` to `8.5.12`. | Frontend audit initially reported Next/PostCSS/sharp advisories; Next/PostCSS were patched. | `npm run lint` and `npm run build` passed. |

## Cleanup Candidates Not Removed

| Candidate | Why not removed |
|---|---|
| Product/order legacy rupee fields (`price`, `totalAmount`) | Code intentionally preserves dual-read integer-paise migration path. |
| Product media fields and CMS fields | Admin and storefront depend on them dynamically. |
| Routes under admin reports/settings placeholder pages | They are reachable admin surfaces and part of navigation. |
| Missing banner fallback references | References are valid design defaults; the assets are missing. Needs asset replacement, not code deletion. |
| Repeated formatting/swatch helpers | Low-risk duplication, but centralization should be a separate tested refactor. |

## Notes

- Pre-existing dirty brand/logo changes were not removed or reverted.
- No database fields or stored data were modified.
- No package was removed from `package.json`.

# HRUSHE Production Hardening Phase 2 - 2026-07-12

Scope: backend/data-contract hardening. No storefront or admin visual design changes were made.

## Completed

### OTP Attempt Protection

- Added shared OTP utility for signup, password reset, and email change.
- OTPs are hashed, expire after 10 minutes, have a 60-second resend cooldown, and lock after 5 failed attempts.
- New OTP requests invalidate older records for the same normalized email/purpose/user binding.
- Password reset OTP state now uses `VerificationCode` instead of user document fields.

### Phone Migration Preparation

- Canonical phone format: 10-digit Indian mobile number without country code.
- Added shared phone normalizer/validator.
- Added report-only and apply-mode audit script.
- Added unique-index creation script that refuses to run if invalid or duplicate non-empty numbers remain.
- Duplicate Mongo key errors now return field-specific API messages for phone/email.

Commands:

```bash
cd backend
node scripts/audit-user-phones.js
node scripts/audit-user-phones.js --apply
node scripts/create-user-phone-index.js
```

### Product Archive Lifecycle

- Product statuses now support `active`, `draft`, `hidden`, `archived`, and `sold_out`, while still accepting legacy status strings.
- Normal admin delete archives products.
- Products with active reservations cannot be archived.
- Archived products are excluded from public listings, search, sitemap, and recommendations through the active-product filters.
- Archived products can be restored.
- Permanent deletion is a dedicated endpoint requiring `products.delete`, explicit `DELETE_PERMANENTLY` confirmation, no order references, and no active reservations.

### Admin Workspace Optimistic Concurrency

- Added `adminWorkspaceVersion`.
- `GET /content/admin-workspace` returns `version`.
- `PUT /content/admin-workspace` requires the loaded version.
- Writes use an atomic conditional update on the submitted version.
- Stale writes return `409` with `CONTENT_VERSION_CONFLICT` and `currentVersion`.
- Audit logs record changed paths and version movement without storing patch values.

### Payment Reconciliation Hardening

- Added stable result codes:
  - `ALREADY_RECONCILED`
  - `PAYMENT_CAPTURED_ORDER_CONFIRMED`
  - `PAYMENT_FAILED_RESERVATION_RELEASED`
  - `PAYMENT_AMOUNT_MISMATCH`
  - `PAYMENT_CURRENCY_MISMATCH`
  - `NO_PROVIDER_PAYMENT`
  - `PROVIDER_UNAVAILABLE`
  - `MANUAL_REVIEW_REQUIRED`
- Captured payments take precedence over failed attempts.
- Paid orders are never downgraded.
- Captured amount and currency mismatches return separate `409` outcomes.
- Missing/expired tracked inventory reservations return manual-review outcomes.
- Inventory/order transitions run inside Mongo transactions when supported and fall back when transactions are unavailable.
- A short-lived order-level reconciliation lock prevents simultaneous admin attempts from running duplicate inventory transitions.

### Health and Readiness

- `/healthz` is now before the regular API rate limiter and returns minimal `{ "status": "ok" }`.
- `/readyz` is before the regular API rate limiter and returns `200` only when Mongo is connected, otherwise `503`.
- Server listens even when Mongo startup tasks fail, allowing `/healthz` and `/readyz` to remain useful.

## Schema Changes

- `VerificationCode.purpose` now includes `password-reset`.
- `VerificationCode` has compound lookup index `{ email, purpose, userId, createdAt }`.
- `Product.status` accepts canonical lifecycle statuses and legacy values.
- `Product` now has `archivedAt` and `archivedFromStatus`.
- `SiteContent` now has `adminWorkspaceVersion`.
- `Order` now has `paymentReconciliationStartedAt` and `paymentReconciliationResultCode`.

## API Changes

- `DELETE /products/:id` archives instead of hard-deleting.
- `PUT /products/:id/restore` restores an archived product.
- `DELETE /products/:id/permanent` permanently deletes only with `products.delete` and confirmation.
- `GET /content/admin-workspace` includes `version`.
- `PUT /content/admin-workspace` requires `version`.
- `POST /order/:id/reconcile` responses include `resultCode`.
- `/healthz` and `/readyz` are no longer behind the normal API rate limiter.

## Verification

- `backend npm test`: 46/46 passing.
- `backend npm audit --omit=dev`: 0 vulnerabilities.
- `frontend npm run lint`: passing.
- `frontend npm run build`: passing.

Local HTTP smoke test note:

- The sandbox blocks local port binding with `listen EPERM`; escalation was unavailable in this session.
- Code was changed so the server listens before Mongo connection tasks and `/readyz` is based on Mongoose ready state.
- Run the smoke test on a local machine or deployment:

```bash
cd backend
PORT=5105 MONGODB_URI=mongodb://127.0.0.1:1/hrushetest MONGODB_SERVER_SELECTION_TIMEOUT_MS=250 npm start
curl -i http://127.0.0.1:5105/healthz
curl -i http://127.0.0.1:5105/readyz
```

Expected with Mongo unavailable:

- `/healthz`: `200`
- `/readyz`: `503`

## Remaining Risks

- Phone unique index must not be created until the audit report shows no invalid or duplicate non-empty numbers.
- Existing production products may still use legacy status strings; the backend supports both, but a future cleanup migration can canonicalize them.
- Reconciliation concurrency should still be smoke-tested against a real Mongo replica set/staging Razorpay setup.
- Money is still stored as numbers instead of integer paise.
- Admin workspace is safer with versioning, but a future split into module documents would reduce blast radius further.

# HRUSHE Production Hardening - 2026-07-12

Scope: backend production hardening only. No storefront UI redesign or visual component changes were made.

## Completed

### Reserved Inventory Protection

- Admin product create now ignores any submitted `reserved` count and starts reservations at `0`.
- Admin product update preserves existing reserved inventory by SKU.
- Reserved variants cannot be removed or effectively renamed while `reserved > 0`.
- Products with active reserved inventory cannot be deleted.
- Negative or non-integer stock/reserved values are rejected.

### Customer Email Change Verification

- Direct profile email edits are blocked.
- New customer endpoints:
  - `POST /account/email-change/request-otp`
  - `POST /account/email-change/verify`
- Email-change OTPs are hashed, expire after 10 minutes, have a 60 second resend cooldown, and lock after 5 failed attempts.
- Successful email change:
  - updates `email`
  - sets `emailVerifiedAt`
  - sets `isVerified`
  - increments `tokenVersion`
  - clears auth and CSRF cookies so the customer must sign in again
  - records an audit log

### List Pagination

List endpoints now apply server-side caps and pagination metadata.

Backward-compatible behavior:

- Existing clients that do not send `page`, `limit`, or `paginated=true` still receive the legacy array/object shape.
- Responses include pagination headers:
  - `X-Pagination-Page`
  - `X-Pagination-Limit`
  - `X-Pagination-Total-Items`
  - `X-Pagination-Total-Pages`
- Clients that send `page`, `limit`, or `paginated=true` receive `{ data, pagination }` for array-list endpoints.

Updated endpoints:

- `GET /products`
- `GET /order/myorders`
- `GET /order/all`
- `GET /admin/customers`
- `GET /admin/customers/:id` adds `ordersPagination`
- `GET /support/requests`
- `GET /products/admin/reviews` adds `pagination`

Default/max limits:

- Customer/admin/support lists: default `50`, max `100`
- Admin orders and public products: default `100`, max `100`

### Payment Reconciliation

New admin API:

- `POST /order/:id/reconcile`
- Requires admin auth, CSRF, and `orders.manage`.

Behavior:

- Fetches payments for the order's stored Razorpay checkout session.
- Marks the order paid only when Razorpay returns a captured payment with matching amount and currency.
- Commits inventory before marking an unpaid order as paid.
- Releases inventory and marks failed when Razorpay returns a failed payment and no captured payment exists.
- Rejects mismatched captured amount/currency with `409`.
- Records checkout logs and audit logs.

### Operational Readiness

- Added `GET /healthz` for basic uptime checks.
- Added `GET /readyz` for Mongo readiness checks.

## Database Notes

- `VerificationCode` now supports:
  - `purpose: "email-change"`
  - `userId`
  - `failedAttempts`
  - `lockedAt`
- Existing verification documents can expire naturally through the current TTL index. No destructive migration is required.
- No new environment variables are required.

## Razorpay Staging Verification Checklist

1. Configure staging keys:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `RAZORPAY_CURRENCY=INR`
2. Create a checkout with a tracked product variant.
3. Confirm product variant `stock` decreases and `reserved` increases after checkout creation.
4. Complete a successful Razorpay test payment.
5. Verify:
   - `/order/checkout/verify` succeeds.
   - Order becomes `paymentStatus=paid` and `orderStatus=Confirmed`.
   - Variant reservation moves from `reserved` to committed.
   - Customer cart is cleared.
6. Replay the same Razorpay webhook event id and verify it is treated idempotently.
7. Trigger a Razorpay failed payment webhook.
8. Verify:
   - Order becomes `paymentStatus=failed`.
   - Variant reservation is released.
9. Create a stuck `initiated` order and run `POST /order/:id/reconcile` from an admin session.
10. Verify the reconciliation result matches Razorpay provider truth.

## Verification Run

- `backend npm test`: passing, 17 tests.

## Remaining Work

- Add signup/password-reset OTP attempt counters.
- Add a dedupe migration and sparse unique index for user phone numbers.
- Move money storage to integer paise before discounts/taxes/refunds expand.
- Replace hard product delete with archive/hidden semantics for order-referenced products.
- Add optimistic concurrency to the admin workspace blob or split it into module documents.
- Move rate limiting/cache state to a shared store before horizontal scaling.
- Add external monitoring/alerting and run the Razorpay staging checklist above.
- Cookie banner clipping remains intentionally unchanged because this task requested no UI changes.

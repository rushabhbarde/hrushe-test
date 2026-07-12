# HRUSHE Razorpay Staging Matrix - 2026-07-12

Use Razorpay test mode and a staging MongoDB database. Record actual provider ids, order ids, and screenshots/log links before promoting to production.

| Scenario | Steps | Expected Result | Actual Result |
| --- | --- | --- | --- |
| Successful card payment | Create checkout, complete Razorpay test card capture, return to success page | Order `paymentStatus=paid`, `orderStatus=Confirmed`, inventory committed, `payment.verified` or webhook event logged | Not run in local sandbox |
| Webhook duplicate replay | Replay same `payment.captured` webhook event id | First event completes, duplicate returns received duplicate without double inventory commit | Not run in local sandbox |
| Failed payment | Create checkout, complete Razorpay failed payment flow or send `payment.failed` webhook | Order becomes failed/cancelled only if not already paid, reserved inventory released | Not run in local sandbox |
| Amount mismatch | Create order, simulate captured payment amount different from `totalPaise` | Webhook/reconciliation rejects with amount mismatch and manual review result | Not run in local sandbox |
| Currency mismatch | Simulate captured payment with non-INR currency | Reconciliation returns `PAYMENT_CURRENCY_MISMATCH` and no inventory mutation | Not run in local sandbox |
| Late capture after browser cancel | Cancel browser return, then send valid captured webhook | Order becomes paid/confirmed and inventory commits if reservation is still valid | Not run in local sandbox |
| Expired reservation with capture | Let reservation expire, then reconcile captured payment | Order remains manual review; inventory is not blindly committed | Not run in local sandbox |
| Provider unavailable during reconcile | Disable Razorpay test credentials or block provider fetch, call reconcile endpoint | Returns `PROVIDER_UNAVAILABLE`, lock is released, no payment/inventory mutation | Not run in local sandbox |
| Concurrent reconciliation | Submit two reconcile requests for one order at the same time | One request acquires lock, the other returns `RECONCILIATION_ALREADY_RUNNING` | Covered by local unit tests; staging not run |
| Bulk reconciliation partial failure | Bulk reconcile mixed valid/missing/stuck order ids | Response has independent per-order results and totals | Not run in local sandbox |

## Required Evidence Before Production

- Backend logs showing request ids and `payment.*` events for every scenario.
- MongoDB before/after snapshots for order, product variant stock/reserved, and webhook event rows.
- Razorpay dashboard test payment ids for captured/failed/mismatch cases.
- Confirmation that no test path changes storefront or admin UI.

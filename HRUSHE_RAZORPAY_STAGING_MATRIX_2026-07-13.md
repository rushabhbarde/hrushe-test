# HRUSHE Razorpay Staging Matrix - 2026-07-13

Use only Razorpay test-mode credentials. Do not store Razorpay secrets, full card/payment data, auth cookies, JWTs, OTPs, or full customer PII.

For each scenario, record: scenario id, timestamp, environment, initial/final order status, initial/final payment status, initial/final stock, initial/final reserved quantity, redacted Razorpay order id, provider event received, browser callback state, reconciliation result code, audit-log evidence, manual-review flag, pass/fail, and evidence location.

| ID | Scenario | Expected result | Actual result | Evidence |
| --- | --- | --- | --- | --- |
| RZP-01 | Successful payment | Paid, confirmed, inventory committed | Not run |  |
| RZP-02 | Failed payment | Failed/cancelled, inventory released if not paid | Not run |  |
| RZP-03 | Customer closes payment modal | Browser cancel/failure recorded, late capture still possible while reservation valid | Not run |  |
| RZP-04 | Browser verification never reaches backend | Webhook can confirm order; otherwise scan flags stuck order | Not run |  |
| RZP-05 | Webhook before browser verification | Webhook confirms order; browser verification becomes idempotent | Not run |  |
| RZP-06 | Webhook after browser verification | Duplicate state change avoided | Not run |  |
| RZP-07 | Duplicate webhook event | Duplicate event returns safely without double inventory mutation | Not run |  |
| RZP-08 | Invalid webhook signature | 401 and invalid-signature metric; no order mutation | Not run |  |
| RZP-09 | Invalid browser payment signature | 400 and no order mutation | Not run |  |
| RZP-10 | Reservation expires before payment | Expired reservation released by cleanup/scan; no blind confirmation | Not run |  |
| RZP-11 | Captured payment after reservation expiry | Manual review required; inventory not blindly committed | Not run |  |
| RZP-12 | Two customers buy final unit | One reservation succeeds, one fails without oversell | Not run |  |
| RZP-13 | Razorpay API timeout during reconciliation | `PROVIDER_UNAVAILABLE`, lock released, no payment mutation | Not run |  |
| RZP-14 | Two admins reconcile same order | One lock succeeds, one returns `RECONCILIATION_ALREADY_RUNNING` | Unit-covered, staging not run |  |
| RZP-15 | Captured amount mismatch | `PAYMENT_AMOUNT_MISMATCH`, manual review | Not run |  |
| RZP-16 | Currency mismatch | `PAYMENT_CURRENCY_MISMATCH`, manual review | Not run |  |
| RZP-17 | Captured and failed attempts under same order | Matching captured payment wins; failed attempt recorded only as context | Not run |  |
| RZP-18 | Backend restart during payment processing | Webhook/idempotency recovers; no duplicate confirmation | Not run |  |
| RZP-19 | Reconciliation lock expires during provider delay | Stale reconciler cannot save if another lock owner took over | Unit-covered after Phase 4 fix, staging not run |  |
| RZP-20 | Bulk reconciliation with one failure | Independent per-order results; healthy orders continue | Not run |  |

# Razorpay Staging Matrix

Reviewed on: 2026-07-24  
Phase: 4 external execution  
Mode required: Razorpay test mode only  
Status: `NOT EXECUTED`

## Summary

No real Razorpay test-mode checkout, modal, browser callback, webhook, or payment replay scenario was executed in Phase 4. No Razorpay test credentials, staging webhook endpoint, staging backend, staging database, or redacted test accounts were available.

No live Razorpay mode was enabled.

## Local Coverage That Exists

- Frontend readiness guard prevents creating a checkout order before the Razorpay constructor is available.
- Playwright aborts the Razorpay checkout script and verifies checkout creation is blocked locally.
- Backend tests cover amount/currency mismatch handling, manual-review routing, captured payment blockers, webhook/browser confirmation blockers, reconciliation locks, and duplicate-safe controller/service transitions.

These do not satisfy the Phase 4 Razorpay gate because mocks/local guards are not real provider evidence.

## Mandatory Scenario Matrix

| ID | Scenario | Phase 4 External Status | Execution Time | Redacted Account | App Order ID | Razorpay Test Payment ID | Stock/Reserved Evidence | Order/Payment Result | Browser Callback | Webhook | Reconciliation | Audit/Logs | Customer Result | Pass/Fail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RP-01 | Standard successful payment | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-02 | Browser callback before webhook | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-03 | Webhook before browser callback | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-04 | Failed payment | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-05 | Modal dismissal | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-06 | Invalid signature | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-07 | Duplicate browser callback | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-08 | Duplicate webhook | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-09 | Expired reservation followed by captured payment | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-10 | Last-unit race | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-11 | Multiple browser tabs | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |
| RP-12 | Network interruption | `NOT EXECUTED` | None | None | None | None | None | None | None | None | None | None | None | None |

## Required Evidence Still Missing

- Scenario execution time.
- Redacted test account.
- Application order ID.
- Redacted Razorpay test payment ID.
- Initial and final stock.
- Initial and final reserved quantity.
- Expected and actual order status.
- Expected and actual payment status.
- Browser callback result.
- Webhook result.
- Reconciliation result.
- Audit events.
- Structured logs.
- Customer-facing result.

## Decision Impact

Result: `NO-GO`.

Razorpay test-mode success, failure, ordering, duplicate, last-unit race, multiple-tab, and recovery scenarios are mandatory launch gates and remain unexecuted.


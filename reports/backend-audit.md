# HRUSHE Backend Audit

Date: 2026-08-23

## Architecture And API Findings

- Backend is an Express/Mongoose service with modular routes for auth, products, cart, orders, content, account, admin, support, newsletter, media, and internal scheduler operations.
- Public readiness endpoints exist at `/healthz` and `/readyz`.
- Frontend server/API integration goes through the Next `/api/backend/[...path]` proxy and direct server-side API helpers.
- High-risk commerce behavior is covered by backend tests for OTPs, cart validation, pricing, inventory reservations, payment confirmation, webhook/manual-review handling, reconciliation, order tracking redaction, pagination, product archive/delete guards, and internal scheduler authentication.

## Authentication And Authorization

| Severity | Finding | Status |
| -------- | ------- | ------ |
| High | Production and staging required config recognized `RAZORPAY_WEBHOOK_SECRET` in some checks but the environment normalization also supports `HRUSHE_RZP_WEBHOOK_SECRET`. | Fixed. |
| High | Production verifier script required only the canonical webhook key, which could incorrectly fail a valid alias-based deployment. | Fixed. |
| Medium | Admin/customer auth flows have tests, but full authenticated browser QA was not run because no staging credentials were used. | Remaining gap. |
| Medium | OTP expiry, resend cooldown, lockout, invalid attempts, and reset/change-email paths are covered by backend tests. | Passed. |

## Checkout, Payment, Inventory, Orders

| Severity | Finding | Status |
| -------- | ------- | ------ |
| High | Tests confirm checkout ignores browser-supplied price/copy and revalidates products, options, stock, and duplicate variant lines server-side. | Passed. |
| High | Tests confirm payment confirmation blocks released/missing/expired tracked reservations and routes manual-review cases instead of silently confirming. | Passed. |
| High | Tests confirm duplicate/concurrent finalization and reconciliation lock conflicts return stable retry/manual-review codes. | Passed. |
| High | Real Razorpay sandbox payment, live webhook delivery, refunds, and shipping/tracking provider integrations were not executed. | Remaining gap. |
| Medium | Public order tracking redacts contact/address details and uses generic lookup failures to reduce enumeration. | Passed. |

## Validation, Security, Reliability, Observability

- Production verifier passed with HTTPS origins/URLs, secure cookies, COD disabled, OTP dev mode disabled, live Razorpay key format, webhook secret alias, scheduler secret, media config, and email config using fake non-secret values.
- Backend `npm audit --omit=dev` found 0 production vulnerabilities.
- Structured logging and redaction tests passed; test output includes expected simulated error logs for manual-review and monitoring-alert cases.
- CORS production tests verify approved origins and rejection of unsafe origins.
- Internal scheduler tests verify signed request authentication, stale replay rejection, mismatches, and missing-secret behavior.

## Changes Completed

- `backend/src/config/env.js`: production/staging required config and error messages now consistently accept `RAZORPAY_WEBHOOK_SECRET` or `HRUSHE_RZP_WEBHOOK_SECRET`.
- `backend/scripts/verify-production-config.js`: production audit script now treats the alias as valid while still enforcing length and placeholder checks.
- `backend/scripts/verify-razorpay-production-testmode.js`: Razorpay production test verifier now accepts the alias.
- `backend/test/envConfig.test.js` and `backend/test/auditScripts.test.js`: added regression coverage for staging, production, and script alias handling.

## Remaining Recommendations

| Severity | Recommendation | Owner |
| -------- | -------------- | ----- |
| Critical | Run Razorpay sandbox checkout, payment success/failure/cancel, duplicate webhook, and delayed confirmation against a staging database. | Backend |
| High | Run authenticated admin CRUD and order-management QA with staging credentials. | Backend/QA |
| High | Confirm production alerting destinations and error monitoring credentials without exposing secret values. | DevOps |
| Medium | Add scheduled verification that inventory cleanup jobs are actually invoked in the hosted environment. | Backend/DevOps |
| Medium | Add API contract tests between Next proxy/client helpers and backend response shapes for admin pages. | Full-stack |

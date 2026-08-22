# HRUSHE Production Audit Report

Audit date: 2026-08-11  
Phase: final release hardening after the 12-issue production audit

## Executive Summary

All original code-level findings were revisited against the implementation, not only the prior report. The repository now has hardened reorder/wishlist validation, public tracking redaction, atomic admin lifecycle updates, no-store transactional product reads, clean backend and frontend high-severity dependency audits, payment finalization locks, durable webhook evidence, real MongoDB concurrency tooling, production config verification, monitoring test-alert tooling, and the legacy COD route retired.

Production status: NO-GO for live customer orders until the remaining external launch evidence gate is executed in staging/production dashboards.

Code-level status: 0 original code-level P0/P1/P2/P3 findings remain open.

External evidence gate: Razorpay dashboard/test-mode matrix, hosted scheduler execution, hosted alert receipt, Render/Vercel env verification, production CORS/CSP/cookie retest after redeploy, real iPhone Safari/Android Chrome, ZeptoMail/R2 staging requests, and MongoDB backup/restore drill still require credentials, deployment access, and dashboard/device evidence.

## Final Audit Table

| Issue | Previous | New Status | Tests |
| --- | --- | --- | --- |
| AUDIT-001 | FIXED | CLOSED | PASS |
| AUDIT-002 | FIXED | CLOSED | PASS |
| AUDIT-003 | FIXED | CLOSED | PASS |
| AUDIT-004 | FIXED | CLOSED | PASS |
| AUDIT-005 | FIXED | CLOSED | PASS |
| AUDIT-006 | FIXED | CLOSED | PASS |
| AUDIT-007 | OPEN | CLOSED | PASS |
| AUDIT-008 | P0 EXTERNAL | CODE CLOSED / EXTERNAL EVIDENCE REQUIRED | PASS locally |
| AUDIT-009 | P0 EXTERNAL | CLOSED locally / STAGING RE-RUN REQUIRED | PASS locally |
| AUDIT-010 | OPEN | CODE CLOSED / EXTERNAL ACTIVATION REQUIRED | PASS locally |
| AUDIT-011 | EXTERNAL | CODE CLOSED / EXTERNAL EVIDENCE REQUIRED | PASS locally |
| AUDIT-012 | OPEN | CLOSED | PASS |

## Issue Status

### HRUSHE-AUDIT-001: CLOSED

Reorder now uses `resolveCheckoutItems`, which validates current product existence, public status, size, colour, fit, SKU, current stock, quantity limits, and current price. Historical order prices remain on old orders, while reordered cart/checkout items resolve against current product pricing. Regression coverage includes stale/deleted product behavior and resolver coverage for current pricing, option removal, insufficient stock, duplicate lines, and max quantity.

### HRUSHE-AUDIT-002: CLOSED

Wishlist move-to-cart now uses `resolveCheckoutItems` and saves the cart before removing the wishlist entry. A cart write failure no longer removes the wishlist item. Regression coverage includes stale product rejection and cart-save failure ordering.

### HRUSHE-AUDIT-003: CLOSED

Public order tracking now returns masked name/email/phone and locality-level address only. Exact address details, internal user IDs, checkout logs, checkout URLs, and payment provider metadata are not returned by the public tracking response. Lookup failure now uses a generic 404 to reduce order-ID enumeration signals. Authenticated account order views still return customer-owned details.

### HRUSHE-AUDIT-004: CLOSED

Server-side lifecycle transitions remain centralized in `canTransitionOrderStatus`. Admin status updates are now conditional on the previously read status and paid-state requirement, reducing conflicting admin race risk. Invalid terminal/backward transitions are rejected.

### HRUSHE-AUDIT-005: CLOSED

Backend product list/detail responses remain `private, no-store, max-age=0, must-revalidate`. The Next product metadata fetch now also uses `cache: "no-store"` so transactional product data is not revalidated on a stale 300-second window. Checkout still recalculates price and inventory server-side.

### HRUSHE-AUDIT-006: CLOSED

Backend `npm audit --audit-level=high` passes with 0 vulnerabilities.

### HRUSHE-AUDIT-007: CLOSED

Frontend dependencies were upgraded without force: Next.js and `eslint-config-next` to 16.3.0, `postcss` to 8.5.26, and `sharp` to 0.35.3. Frontend `npm audit --audit-level=high` now passes with 0 vulnerabilities. Lint warnings surfaced by Next 16.3.0 were fixed with router navigation.

### HRUSHE-AUDIT-008: CODE CLOSED / EXTERNAL EVIDENCE REQUIRED

Payment finalization now uses durable database locks for browser verification and webhook capture handling. Captured payments with missing/expired inventory reservations, inventory commit failures, amount mismatch, or currency mismatch route to manual-review/reconciliation evidence instead of silently marking paid or disappearing. Webhook events store provider order/payment IDs and unknown-order results. `backend/scripts/verify-razorpay-production-testmode.js` provides a production-domain, test-mode-only executable matrix for signed captured, duplicate, invalid signature, amount mismatch, currency mismatch, failed payment, and unknown-order webhooks.

External evidence still required: run the full Razorpay test-mode popup/provider matrix on the production domain after confirming the deployed backend reports Razorpay test mode.

### HRUSHE-AUDIT-009: CLOSED locally / STAGING RE-RUN REQUIRED

Inventory reservation uses atomic conditional `$inc` updates. A real local MongoDB concurrency script was added and executed against `hrushe-concurrency-test`: stock 1 / 20 requests, stock 1 / 10 requests, and stock 5 / 20 requests all passed with consistent stock/reserved cleanup. Do not run destructive concurrency tests against production customer inventory.

### HRUSHE-AUDIT-010: CODE CLOSED / EXTERNAL ACTIVATION REQUIRED

Monitoring is now provider-ready with request IDs, structured redacted logs, metrics, error capture, `/health`, `/healthz`, `/ready`, `/readyz`, and a signed internal `/internal/monitoring/test-alert` endpoint. `MONITORING_RUNBOOK.md` defines required alert rules and alert delivery verification. External alert receipt still requires the hosted monitoring provider/channel.

Certification follow-up: the hosted backend proxy returned 404 for `/api/backend/internal/inventory/cleanup`, so the running Render backend must be redeployed to the current scheduler-route build and retested before GO.

### HRUSHE-AUDIT-011: CODE CLOSED / EXTERNAL EVIDENCE REQUIRED

Production/staging environment guardrails were tightened. Production rejects placeholder secrets, COD enabled, test Razorpay keys, weak webhook/scheduler secrets, non-HTTPS URLs, wildcard/localhost origins, insecure cookies, and missing critical configuration. `backend/scripts/verify-production-config.js` reports PASS/FAIL without printing secrets. `BACKUP_RESTORE_RUNBOOK.md` defines backup/restore drill evidence.

Certification evidence collected: Vercel production deployment `dpl_Gfu8fpJNeTsjotDkKQvHLYUdjNkG` is `READY` on branch `release/hrushe-prelaunch` at commit `1cd4b57a0f17736ea7cb44e13ba3126b4e01694a`; DNS/TLS verify for apex, `www`, and media domains; public product/health/media routes return 200; unauthenticated admin API returns 401; invalid Razorpay webhook signature is rejected.

External evidence still required: actual Render/Vercel env inspection, production CORS/CSP/cookie retest after redeploy, real backup restore drill, ZeptoMail/R2 staging requests, and device/browser checks. Hosted production CORS returned 500 for an unapproved origin during certification and has been fixed locally to return operational 403. Hosted frontend CSP blocked Cloudflare's injected analytics beacon and has been fixed locally by allowing Cloudflare analytics hosts. Both need deployment and hosted retest.

### HRUSHE-AUDIT-012: CLOSED

The legacy `/order/place` COD route and controller export were removed. `ENABLE_COD=false` remains a production guardrail, but there is no longer a hidden alternate public order pipeline.

## Launch Recommendation

NO-GO until the external launch evidence gate is complete. The repo is staging-ready for the exact final verification sequence, but live paid traffic should wait for real provider/dashboard/browser evidence.

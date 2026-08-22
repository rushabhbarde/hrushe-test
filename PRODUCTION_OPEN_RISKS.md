# HRUSHE External Launch Evidence Gate

Audit date: 2026-08-11  
Launch certification evidence timestamp: 2026-08-11 20:54 IST

No original audit issue remains open as an unresolved local code-level finding. The release remains NO-GO because critical external launch gates either failed hosted smoke checks or could not be executed with real production-domain test-mode/provider/dashboard/device evidence from this session.

## Evidence Collected

- Vercel project `hrushe-test` is accessible through the connected Vercel app.
- Vercel production deployment `dpl_Gfu8fpJNeTsjotDkKQvHLYUdjNkG` is `READY`, targets production, aliases `hrushe.in` and `www.hrushe.in`, and matches branch `release/hrushe-prelaunch` at commit `1cd4b57a0f17736ea7cb44e13ba3126b4e01694a`.
- Vercel production build logs show no error lines.
- Vercel runtime error clusters: none found in the inspected 2-hour window.
- DNS resolves for `hrushe.in`, `www.hrushe.in`, and `media.hrushe.in`.
- TLS verification succeeds for `hrushe.in` and `media.hrushe.in`.
- `https://hrushe.in/` returns 200 with HSTS and security headers.
- `https://www.hrushe.in/` redirects to `https://hrushe.in/`.
- HTTP redirects to HTTPS for apex and `www`.
- `https://hrushe.in/api/backend/healthz` and `/api/backend/products` return 200.
- A production `media.hrushe.in` product image returns 200.
- Unauthenticated admin API returns 401.
- Invalid Razorpay webhook signature is rejected.
- Public browser bundle scan checked 17 JavaScript files and found no obvious server-secret patterns.
- Public browser smoke loaded `/`, `/shop`, one product detail page, `/cart`, `/login`, `/track-order`, and `/admin` with HTTP 200.

## P0 Blockers

1. Razorpay production-domain test-mode matrix was not executed. The verifier now requires explicit production test-order mutation opt-in, a webhook secret, a valid checkout payload, and deployed backend preflight proving Razorpay test mode.
2. Final-item inventory concurrency was not executed against production because destructive concurrency tests must not run against production customer inventory.
3. Hosted scheduler certification is blocked. The production proxy returned 404 for `/api/backend/internal/inventory/cleanup`, so the hosted backend must be redeployed to the scheduler-route build and retested.
4. MongoDB backup plus actual isolated restore drill was not executed. Provider backup access and an isolated restore target were not available from this session.

## P1 Launch Blockers

1. Render production environment variables are not accessible from this session.
2. Vercel environment variable inspection is not exposed by the available connector tools.
3. Hosted production CORS currently returns 500 for an unapproved `Origin`. This is fixed locally as an operational 403 and covered by backend tests, but requires deploy and hosted retest.
4. Hosted frontend CSP currently blocks Cloudflare's injected analytics beacon. This is fixed locally by allowing Cloudflare analytics hosts, but requires deploy and hosted browser retest.
5. Production cookie attributes could not be certified because successful login/checkout credentials and real browser session evidence were not available.
6. Real iPhone Safari checkout was not executed.
7. Real Android Chrome checkout was not executed.
8. Monitoring alert delivery was not executed because provider/channel access was not available.
9. ZeptoMail staging delivery was not executed because staging email provider access/configuration was not available.
10. R2 upload/delete authorization tests were not executed because R2 credentials/provider access were not available. Public media read was verified only.

## Required Before GO

1. Deploy the current local fixes to production.
2. Retest hosted CORS and Cloudflare CSP behavior.
3. Retest hosted scheduler routes for signed success, missing signature, invalid signature, and replay behavior.
4. Confirm the production backend is intentionally configured with Razorpay test-mode credentials before payment testing.
5. Run `backend/scripts/verify-razorpay-production-testmode.js` against the production API base URL.
6. Run the full human/browser Razorpay test-mode matrix on the production domain.
7. Do not run destructive final-item concurrency against production customer inventory; use local or isolated non-customer data only.
8. Perform the MongoDB restore drill in `BACKUP_RESTORE_RUNBOOK.md`.
9. Verify Render and Vercel production environment variables without printing secrets.
10. Verify production cookies with real login/checkout sessions.
11. Test login and checkout on real iPhone Safari and Android Chrome.
12. Verify monitoring alerts reach the owner/channel.
13. Verify ZeptoMail and R2 with controlled production test requests.

## Evidence Rule

Do not change release status from NO-GO until the evidence above is recorded with timestamps, environment names, command output summaries, and dashboard confirmations.

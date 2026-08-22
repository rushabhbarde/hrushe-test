# HRUSHE Staging Environment Manifest

Reviewed on: 2026-07-24  
Status: `PARTIAL LOCAL ONLY`

## Summary

This manifest records required staging variables and whether their remote presence was verified. It does not include actual values. Remote backend/frontend staging environment variables were not accessible from this environment, so most entries are `NOT VERIFIED`.

The local code now includes startup assertions that fail closed for obvious unsafe staging configuration when `APP_ENV=staging`.

## Backend Variables

| Category | Variable | Remote Presence | Local Safety Coverage |
| --- | --- | --- | --- |
| App mode | `APP_ENV=staging` | `NOT VERIFIED` | Required by Render docs and startup guard. |
| Database | `MONGODB_URI` | `NOT VERIFIED` | Rejects missing, production-looking, or non-isolated database names. |
| Session/JWT | `JWT_SECRET` | `NOT VERIFIED` | Rejects default or weak values under staging. |
| CSRF/cookies | `COOKIE_SECURE` | `NOT VERIFIED` | Requires secure cookies under staging. |
| CSRF/cookies | `COOKIE_SAME_SITE` | `NOT VERIFIED` | Requires `lax` or `strict` under staging. |
| Payment | `RAZORPAY_KEY_ID` | `NOT VERIFIED` | Rejects `rzp_live_`; requires `rzp_test_`. |
| Payment | `RAZORPAY_KEY_SECRET` | `NOT VERIFIED` | Required, value not logged. |
| Payment | `RAZORPAY_WEBHOOK_SECRET` | `NOT VERIFIED` | Required, value not logged. |
| Scheduler | `INTERNAL_SCHEDULER_SECRET` | `NOT VERIFIED` | Required, value not logged. |
| Frontend origin | `CLIENT_URL` | `NOT VERIFIED` | Rejects production HRUSHE hosts. |
| Backend origin | `BACKEND_PUBLIC_URL` | `NOT VERIFIED` | Rejects production HRUSHE hosts. |
| Email test delivery | `OTP_DEV_MODE=false` | `NOT VERIFIED` | Rejects OTP dev mode. |
| Email test delivery | `MAIL_FROM` or equivalent | `NOT VERIFIED` | Requires explicit isolated staging/test sender. |
| Email test delivery | `ZEPTOMAIL_API_KEY` or complete SMTP config | `NOT VERIFIED` | Requires provider config without exposing secret. |
| Media storage | `R2_BUCKET_NAME` | `NOT VERIFIED` | Rejects production-looking and non-isolated names. |
| Media storage | `R2_PUBLIC_URL` | `NOT VERIFIED` | Rejects production HRUSHE hosts. |
| Media storage | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | `NOT VERIFIED` | Required by production config; remote staging not inspected. |
| Logging/monitoring | provider-specific keys | `NOT VERIFIED` | No remote alert/log integration visible. |

## Frontend Variables

| Category | Variable | Remote Presence | Notes |
| --- | --- | --- | --- |
| Backend/API URL | `API_URL` or configured equivalent | `NOT VERIFIED` | No Vercel env inspection tool was available. |
| Public Razorpay key | `NEXT_PUBLIC_RAZORPAY_KEY_ID` or configured equivalent | `NOT VERIFIED` | Must be test mode only. |
| App URL | Vercel preview/staging URL | `NOT CREATED` | No Phase 4 preview deployment was created. |
| Media hosts | `next.config`/env allowed image hosts | `NOT VERIFIED REMOTELY` | Local build passed. |
| Analytics | provider-specific keys | `NOT VERIFIED` | Not required unless enabled. |

## Startup Safety Checks

Verified locally through backend tests:

- Reject Razorpay live keys.
- Reject production-looking database names.
- Reject production media buckets.
- Reject production application origins.
- Reject missing scheduler secret.
- Reject insecure cookies.
- Reject development OTP mode.
- Reject weak/default JWT secrets.
- Require isolated email test delivery.

Command evidence:

- `cd backend && npm test`: 116/116 passed.

## Decision Impact

Remote staging configuration remains `NOT VERIFIED`, so this gate is not launch-passing evidence.


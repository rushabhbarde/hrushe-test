# Deployment Guide

## Production Targets

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Checkout provider: Razorpay

## Backend Production Environment

Set these variables on Render for the backend service:

```text
NODE_ENV=production
PORT=10000
CLIENT_URL=https://www.hrushe.in
ALLOWED_ORIGINS=https://www.hrushe.in,https://hrushe.in,https://hrushe-test.vercel.app
BACKEND_PUBLIC_URL=https://your-backend-domain.onrender.com
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=<strong-random-secret>
ADMIN_EMAIL=team@hrushe.in
ADMIN_PASSWORD=<strong-admin-password-at-least-12-characters>
ADMIN_NAME=Admin
ADMIN_ROLE=super-admin
COOKIE_SAME_SITE=lax
COOKIE_SECURE=true
COOKIE_DOMAIN=
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
RAZORPAY_CURRENCY=INR
RAZORPAY_WEBHOOK_SECRET=<your-razorpay-webhook-secret>
R2_ACCOUNT_ID=<your-cloudflare-account-id>
R2_ACCESS_KEY_ID=<your-r2-access-key-id>
R2_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
R2_BUCKET_NAME=hrushe-media
R2_PUBLIC_URL=https://media.hrushe.in
R2_ENDPOINT=https://<your-cloudflare-account-id>.r2.cloudflarestorage.com
```

Notes:

- `ALLOWED_ORIGINS` accepts a comma-separated list.
- Include both `https://www.hrushe.in` and `https://hrushe.in`, plus any Vercel preview or fallback domain that should be able to call the API.
- Keep `COOKIE_SAME_SITE=lax`, `COOKIE_SECURE=true`, and `COOKIE_DOMAIN` empty. Browser API calls use the frontend's same-origin `/api/backend` proxy, which forwards the secure cookies to Render without requiring `SameSite=None`.
- If this service existed before the same-origin proxy, replace the legacy Render Dashboard value `COOKIE_SAME_SITE=none` with `lax`; Blueprint updates do not necessarily overwrite an existing service's Dashboard value.
- `ADMIN_PASSWORD` is required in production and must not be the default local password.
- `ADMIN_ROLE=super-admin` keeps the bootstrap admin able to manage staff and role assignments.
- `BACKEND_PUBLIC_URL` must be the public Render URL used by webhook and operational flows.
- R2 variables are optional for local development. In production, set them so admin media uploads and base64 media migrations store files in Cloudflare R2 instead of MongoDB GridFS.

## Frontend Production Environment

Set this variable on Vercel:

```text
API_URL=https://your-backend-domain.onrender.com
```

Optional legacy fallback:

```text
NEXT_PUBLIC_API_URL=https://your-backend-domain.onrender.com
```

## Deployment Steps

### Backend on Render

1. Create a new Web Service from this repository.
2. Set `Root Directory` to `backend`.
3. Use:
   - Build Command: `npm ci --omit=dev`
   - Start Command: `npm start`
4. Add all backend environment variables listed above. For an existing service, verify the values in Render's **Environment** tab; `sync: false` Blueprint entries are only prompted during initial creation.
5. Deploy and confirm `GET /` returns:

```json
{ "message": "Fashion brand API running", "status": "ok" }
```

### Frontend on Vercel

1. Import this repository into Vercel.
2. Set the project root to `frontend`.
3. Add `API_URL`.
4. Deploy and confirm the storefront loads with products and auth requests hitting the Render backend.

## Production Database

Use MongoDB Atlas for production:

1. Create an Atlas cluster.
2. Create a database user.
3. Add Render outbound IP access or temporarily allow `0.0.0.0/0` while testing.
4. Copy the Atlas connection string into `MONGODB_URI`.

## Razorpay Production Setup

Set:

- `RAZORPAY_KEY_ID` to the live Razorpay key ID
- `RAZORPAY_KEY_SECRET` to the live Razorpay key secret
- `RAZORPAY_WEBHOOK_SECRET` to the webhook secret configured in Razorpay

Make sure Razorpay is configured to send webhooks to:

- Webhook: `https://your-backend-domain.onrender.com/order/checkout/webhook/razorpay`

Enable at least these Razorpay events:

- `payment.captured`
- `payment.failed`

Checkout success is verified by the frontend calling `POST /order/checkout/verify`.

## Test Checklist

### Full Order Flow

1. Sign up a user
2. Log in
3. Add product to cart
4. Complete checkout
5. Verify order appears in `My Orders`

### Tracking Flow

1. Open `/track-order`
2. Search by `order ID + email`
3. Search by `order ID + phone`
4. Confirm timeline, courier, tracking number, tracking URL, and status all appear correctly

### Admin Flow

1. Log in as admin
2. Add or edit a product
3. Open admin orders
4. Update order status
5. Add courier name, tracking number, and tracking URL
6. Confirm those changes appear in user order pages and public tracking

## What Still Requires Platform Access

This repository is now prepared for deployment, but the actual live deployment still needs:

- your Render account access
- your Vercel account access
- your MongoDB Atlas production connection string
- your real Razorpay live keys and webhook secret

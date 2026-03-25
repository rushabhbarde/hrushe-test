# Deployment Guide

## Production Targets

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Checkout provider: GoKwik

## Backend Production Environment

Set these variables on Render for the backend service:

```text
NODE_ENV=production
PORT=10000
CLIENT_URL=https://your-frontend-domain.vercel.app
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://www.hrushe.in
BACKEND_PUBLIC_URL=https://your-backend-domain.onrender.com
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=<strong-random-secret>
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
COOKIE_DOMAIN=
GOKWIK_HOSTED_CHECKOUT_URL=https://<your-gokwik-production-checkout-url>
GOKWIK_WEBHOOK_SECRET=<your-gokwik-webhook-secret>
```

Notes:

- `ALLOWED_ORIGINS` accepts a comma-separated list.
- `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` are required for cross-site auth cookies between Vercel and Render.
- `BACKEND_PUBLIC_URL` must be the public Render URL used in checkout success, failure, cancel, and webhook flows.

## Frontend Production Environment

Set this variable on Vercel:

```text
NEXT_PUBLIC_API_URL=https://your-backend-domain.onrender.com
```

## Deployment Steps

### Backend on Render

1. Create a new Web Service from this repository.
2. Set `Root Directory` to `backend`.
3. Use:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add all backend environment variables listed above.
5. Deploy and confirm `GET /` returns:

```json
{ "message": "Fashion brand API running", "status": "ok" }
```

### Frontend on Vercel

1. Import this repository into Vercel.
2. Set the project root to `frontend`.
3. Add `NEXT_PUBLIC_API_URL`.
4. Deploy and confirm the storefront loads with products and auth requests hitting the Render backend.

## Production Database

Use MongoDB Atlas for production:

1. Create an Atlas cluster.
2. Create a database user.
3. Add Render outbound IP access or temporarily allow `0.0.0.0/0` while testing.
4. Copy the Atlas connection string into `MONGODB_URI`.

## GoKwik Production URLs

Set:

- `GOKWIK_HOSTED_CHECKOUT_URL` to the GoKwik production checkout endpoint
- `GOKWIK_WEBHOOK_SECRET` to the production webhook secret

Make sure GoKwik is configured to use these backend URLs:

- Success: `https://your-backend-domain.onrender.com/order/checkout/success`
- Failure: `https://your-backend-domain.onrender.com/order/checkout/failure`
- Cancel: `https://your-backend-domain.onrender.com/order/checkout/cancel`
- Webhook: `https://your-backend-domain.onrender.com/order/checkout/webhook/gokwik`

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
- your real GoKwik production URL and webhook secret

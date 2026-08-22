# Hrushetest

Clean architecture for a clothing brand website built as a full-stack project.

## Product Direction

`hrushetest` is structured as a clothing brand storefront with:

- user-facing shopping flows
- a lightweight admin panel
- no stock or inventory tracking

The current repo already contains:

- a `frontend/` app built with Next.js
- a `backend/` app built with Express and MongoDB

## Core Modules

### User Side

Customer-facing features:

- Sign up
- Login
- Browse products
- View product details
- Add to cart
- Checkout
- Place order
- View orders

### Admin Side

Admin responsibilities:

- Add product
- Edit product
- Delete product
- View orders
- Update order status
- Manage users (optional)

Supported order statuses:

- `Pending`
- `Confirmed`
- `Shipped`
- `Delivered`
- `Cancelled`

## Recommended Tech Stack

### Frontend

- Next.js
- Tailwind CSS

### Backend

- Node.js
- Express.js

### Database

- MongoDB

### Authentication

- JWT

### Hosting

- Vercel for frontend
- Render for backend

## Database Design

### Users

```text
Users
-----
id
name
email
password
phone
address
createdAt
```

### Products

```text
Products
--------
id
name
description
price
category
sizes
colors
images
createdAt
```

Example product:

- Name: Oversized Coffee T-shirt
- Price: 899
- Sizes: `S`, `M`, `L`, `XL`
- Color: Coffee
- Images: `[img1, img2]`

### Cart

```text
Cart
----
userId
items[
  productId
  quantity
  size
]
```

### Orders

```text
Orders
------
id
userId
products[
  productId
  quantity
  size
  price
]
totalAmount
shippingAddress
paymentMethod
orderStatus
createdAt
```

## API Endpoints

### Authentication

- `POST /auth/signup`
- `POST /auth/login`

### Products

- `GET /products`
- `GET /products/:id`
- `POST /products` admin only
- `PUT /products/:id` admin only
- `DELETE /products/:id` admin only

### Cart

- `POST /cart/add`
- `GET /cart`
- `DELETE /cart/remove`

### Orders

- `POST /order/checkout`
- `GET /order/checkout/razorpay-mode`
- `POST /order/checkout/verify`
- `POST /order/checkout/webhook/razorpay`
- `POST /order/track`
- `GET /order/myorders`
- `GET /order/all` admin only
- `PUT /order/status/:id` admin only

## Website Pages

### User Pages

- `/`
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `/login`
- `/signup`
- `/my-orders`

### Admin Pages

- `/admin`
- `/admin/products`
- `/admin/add-product`
- `/admin/orders`

## Order Flow

```text
User visits website
      ↓
Selects product
      ↓
Add to cart
      ↓
Checkout
      ↓
Order placed
      ↓
Admin sees order in dashboard
      ↓
Admin updates status
```

## Example Admin Order Panel

```text
Order #1034
Customer: Hrushabh
Product: Coffee Oversized T-shirt
Size: L
Quantity: 2
Total: ₹1798

Status: Pending
[ Confirm ] [ Ship ] [ Deliver ]
```

## Suggested Project Structure

```text
hrushetest/
├── README.md
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── login/
│   │   ├── my-orders/
│   │   ├── product/[id]/
│   │   ├── shop/
│   │   ├── signup/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── types/
└── backend/
    ├── server.js
    ├── .env
    └── src/
        ├── config/
        ├── controllers/
        ├── middleware/
        ├── models/
        ├── routes/
        ├── services/
        └── utils/
```

## Current Repo Status

What already exists in this workspace:

- [frontend/app/page.tsx](/Users/hrushabhbarde/hrushetest/frontend/app/page.tsx): default Next.js starter page
- [frontend/app/layout.tsx](/Users/hrushabhbarde/hrushetest/frontend/app/layout.tsx): root layout
- [backend/server.js](/Users/hrushabhbarde/hrushetest/backend/server.js): Express server bootstrap
- [backend/src/config/db.js](/Users/hrushabhbarde/hrushetest/backend/src/config/db.js): MongoDB connection

## Next Build Steps

1. Create backend models for `User`, `Product`, `Cart`, and `Order`
2. Add auth, product, cart, and order routes
3. Add JWT auth middleware and admin-role protection
4. Replace the default frontend homepage with the clothing brand landing page
5. Build user pages and admin dashboard pages
6. Connect frontend forms and pages to backend APIs

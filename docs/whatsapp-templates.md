# WhatsApp order updates — setup

HRUSHE sends four order updates on WhatsApp through Meta's WhatsApp Cloud API.
Nothing is sent until the four Render variables below are set.

## 1. Create the templates (WhatsApp Manager → Message templates → Create)

Category **Utility**, language **English (en)**. Use these names exactly.

| Name | Body | Sample values |
| --- | --- | --- |
| `hrushe_order_confirmed` | Hi {{1}}, your HRUSHE order {{2}} is confirmed, {{3}} paid. We'll call you to check the details, then pack it by hand. We'll message you here when it ships. | Asha · #1024 · ₹599 |
| `hrushe_order_shipped` | Hi {{1}}, your HRUSHE order {{2}} is on its way with {{3}}. Track it here: {{4}} Thank you for choosing HRUSHE. | Asha · #1024 · Delhivery · https://hrushe.in/track-order |
| `hrushe_order_out_for_delivery` | Hi {{1}}, your HRUSHE order {{2}} is out for delivery today. Please keep your phone nearby for the courier. | Asha · #1024 |
| `hrushe_order_delivered` | Hi {{1}}, your HRUSHE order {{2}} has been delivered. We hope it wears well. Need a different size? Visit hrushe.in/account within 7 days. | Asha · #1024 |

Footer (optional, all four): `HRUSHE · Defined quietly.`

Approval usually takes minutes to a few hours.

## 2. Get the keys (Meta for Developers → your app → WhatsApp → API setup)

- **Phone number ID**: shown under the business number.
- **Permanent token**: Business settings → System users → add a system user →
  Generate token with `whatsapp_business_messaging` (the temporary 24-hour token will stop working).

## 3. Add to Render (hrushe-prod → Environment)

```
WHATSAPP_ENABLED=true
WHATSAPP_TOKEN=<permanent token>
WHATSAPP_PHONE_NUMBER_ID=<phone number id>
WHATSAPP_TEMPLATE_LANGUAGE=en
```

Save; Render redeploys. To switch updates off, set `WHATSAPP_ENABLED=false`.

## How it behaves

- Sent on: payment confirmed, Shipped, Out for delivery, Delivered (from the Atelier or Shiprocket).
- Each update is sent once per order, even if a status is saved twice.
- Customers who turn off "WhatsApp order updates" in their Wardrobe don't get them.
- A WhatsApp failure never blocks payment, shipping or email; it is logged as `whatsapp.send.failed`.

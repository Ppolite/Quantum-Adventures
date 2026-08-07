# Beat AI Billing Setup

Stripe product already created in live mode:
- Product: Beat AI Pro
- Price: $5.99/month
- Price ID: `price_1U1merHsXnRKu4CMnRL36SED`

## Required Vercel environment variables

Set these on the `quantum-adventures` project:

- `STRIPE_SECRET_KEY` — live Stripe secret key (`sk_live_...`)
- `STRIPE_PRO_PRICE_ID` — `price_1U1merHsXnRKu4CMnRL36SED`
- `SITE_URL` — `https://quantum-adventures.vercel.app`

## What is wired

- `/api/checkout` creates a Stripe-hosted subscription Checkout Session.
- `/api/billing-status` verifies the returned Checkout Session before unlocking Pro.
- `/api/billing-portal` creates a Stripe Customer Portal session.
- The browser stores the verified customer/subscription IDs locally for the current device.
- Free daily play remains available; Pro gates Lightning, Boss Battles and unlimited Practice.

## Next production hardening

For true cross-device restore and revocation after cancellations, add user authentication plus a server-side subscription table and Stripe webhooks. The current flow is safe for checkout verification on the purchasing device but local browser state is not a substitute for durable account entitlements.

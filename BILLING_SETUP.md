# Beat AI Billing Setup

Stripe product already created in live mode:
- Product: Beat AI Pro
- Price: $5.99/month
- Price ID: `price_1U1merHsXnRKu4CMnRL36SED`

## Required Vercel environment variables

Set these on the Beat AI / Quantum Adventures Vercel project:

- `STRIPE_SECRET_KEY` — live Stripe secret key (`sk_live_...`)
- `STRIPE_PRO_PRICE_ID` — `price_1U1merHsXnRKu4CMnRL36SED`

`SITE_URL` is no longer used for consumer Beat AI checkout or billing-portal returns. Those return URLs are intentionally pinned to the live canonical domain `https://beatai.games` so a stale environment variable cannot send a paid customer to a retired Vercel deployment.

If an old `SITE_URL=https://quantum-adventures.vercel.app` variable still exists in Vercel, it can be removed.

## What is wired

- `/api/checkout` creates a Stripe-hosted subscription Checkout Session.
- Successful and cancelled Checkout sessions return to `https://beatai.games`.
- `/api/billing-status` verifies the returned Checkout Session before unlocking Pro.
- `/api/subscription-status` revalidates the saved Beat AI Pro subscription.
- `/api/billing-portal` creates a Stripe Customer Portal session and returns to `https://beatai.games`.
- The browser stores the verified customer/subscription IDs locally for the current device.
- Pro unlocks unlimited Fresh Packs plus the other Pro modes.

## Recovery after the retired-domain redirect bug

If a completed Stripe Checkout landed on the old `quantum-adventures.vercel.app` 404, preserve the query string containing `billing=success&session_id=...` and replace only the hostname with `beatai.games`. The live app will verify the Checkout Session and unlock Pro on that browser.

## Next production hardening

For true cross-device restore and durable server-side entitlements, add user authentication plus a server-side subscription table and Stripe webhooks for consumer Pro. The current consumer flow securely verifies checkout/subscription state, but browser-local identity is not a substitute for a durable signed-in player account.

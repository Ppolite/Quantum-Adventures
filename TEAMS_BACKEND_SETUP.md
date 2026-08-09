# Beat AI for Teams backend setup

Beat AI for Teams now supports shared server-side workspaces, signed member/admin sessions, invite-code joins, live company/department leaderboards, weekly crown state, Stripe organization checkout, and Stripe webhook lifecycle reconciliation.

## Required Vercel environment variables

### Shared Teams storage
Connect a Vercel Marketplace Redis / Upstash-compatible store and expose either pair:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

or:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Teams session signing
- `TEAM_AUTH_SECRET` — a long random secret (32+ bytes recommended). Changing it invalidates existing Teams sessions.

### Teams billing
- `STRIPE_SECRET_KEY`
- `STRIPE_TEAM_PRICE_ID` — recurring per-seat price used by `/api/team-checkout`.
- `STRIPE_WEBHOOK_SECRET` — signing secret for the Stripe endpoint at `https://beatai.games/api/stripe-webhook`.

The existing consumer Pro billing variables remain unchanged.

## Stripe webhook configuration

Create a Stripe webhook endpoint for:

`https://beatai.games/api/stripe-webhook`

Subscribe it to these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Copy the endpoint signing secret (`whsec_...`) into Vercel as `STRIPE_WEBHOOK_SECRET`, then redeploy.

The webhook verifies Stripe signatures with a five-minute timestamp tolerance, ignores non-Beat-AI/non-Teams subscriptions, deduplicates event IDs in the Teams store, and reconciles subscription status, seat quantity, customer/subscription IDs, cancellation state and current-period end into the company workspace.

## Security model

- Workspace creation returns a signed 30-day admin session.
- Invite-link joins return signed 30-day member sessions.
- Admin-only mutations: add department, rotate invite code, remove member, start Teams checkout.
- Member/admin mutations: record game scores.
- Storage credentials and Stripe keys stay server-side.
- Private Stripe customer/subscription identifiers are stripped from workspace responses.
- Stripe webhook requests require a valid Stripe signature.

## What becomes live after configuration

- Multiple browsers can join the same company league through one invite link.
- Completed Beat AI runs automatically write member points into the shared company leaderboard.
- Department totals are calculated server-side from member scores.
- Admins can add departments, rotate invite codes, and start per-seat Teams checkout.
- Successful checkout activates the workspace immediately.
- Later seat changes, cancellations, subscription status changes, renewals and failed payments are reconciled automatically from Stripe webhooks.
- Workspace state persists across browsers and devices because the source of truth is server-side.

## Production hardening after first paid pilots

Before larger deployments, add verified email/SSO identity, rate limiting/abuse controls, audit logs, and a relational database schema if Teams usage outgrows the Redis document model.

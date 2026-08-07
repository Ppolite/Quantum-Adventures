# Beat AI for Teams backend setup

Beat AI for Teams now supports shared server-side workspaces, signed member/admin sessions, invite-code joins, live company/department leaderboards, weekly crown state, and Stripe organization checkout.

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

The existing consumer Pro billing variables remain unchanged.

## Security model

- Workspace creation returns a signed 30-day admin session.
- Invite-code joins return signed 30-day member sessions.
- Admin-only mutations: add department, rotate invite code, remove member, start Teams checkout.
- Member/admin mutations: record game scores.
- Storage credentials and Stripe keys stay server-side.
- Private Stripe customer/subscription identifiers are stripped from workspace responses.

## Production hardening after first paid pilots

Before larger deployments, add verified email/SSO identity, Stripe webhook subscription reconciliation, rate limiting/abuse controls, audit logs, and a relational database schema if Teams usage outgrows the Redis document model.

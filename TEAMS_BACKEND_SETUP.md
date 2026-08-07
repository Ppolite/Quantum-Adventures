# Beat AI for Teams backend setup

The Teams workspace now supports shared server-side persistence, signed member/admin sessions, invite-code joins, live leaderboards, department standings, weekly crown state, and Stripe organization checkout.

## Required Vercel environment variables

### Shared Teams storage
Use a Vercel Marketplace Redis/Upstash-compatible store and expose either pair:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

or:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Teams session signing
- `TEAM_AUTH_SECRET` — a long random secret (32+ bytes recommended). Changing it invalidates existing Teams sessions.

### Teams billing
- `STRIPE_SECRET_KEY`
- `STRIPE_TEAM_PRICE_ID` — Stripe recurring per-seat price used by `/api/team-checkout`.

The existing consumer Pro billing variables remain unchanged.

## Current security model

- Workspace creation returns a signed 30-day admin session.
- Invite-code joins return signed 30-day member sessions.
- Admin-only mutations: add department, rotate invite code, remove member, start Teams checkout.
- Member/admin mutations: record scores.
- Storage credentials and Stripe keys stay server-side.
- Private Stripe customer/subscription identifiers are stripped from workspace responses.

## Next hardening step before larger paid deployments

Add verified email/SSO identity, Stripe webhook subscription reconciliation, rate limiting/abuse controls, audit logs, and a managed database schema if Teams usage outgrows the current Redis document model.

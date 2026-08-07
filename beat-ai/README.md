# Beat AI MVP

Beat AI is a mobile-first daily challenge game built around a five-round “human vs machine” loop.

## What is implemented

- Five-round daily challenge game
- Deterministic fallback challenge set so the game remains playable offline/from static hosting
- Daily score, streak, best-score persistence in the browser
- Shareable emoji result card
- Practice replay mode
- Beat AI Pro $5.99/mo product surface
- `api/daily.js`: OpenAI-powered daily challenge generation with graceful fallback
- `api/scores.js`: server-side leaderboard read/write API
- `supabase.sql`: production tables/indexes with RLS enabled
- `vercel.json`: standalone Vercel configuration
- GitHub Pages workflow for a public static prototype

## Production architecture

Deploy this `beat-ai/` directory as the root of its own Vercel project. Set these server-side environment variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional; defaults to `gpt-5-mini`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Run `supabase.sql` once in the Supabase SQL editor. The browser never receives the service-role key. Daily generated sets are cached by date so OpenAI does not need to regenerate the same game for every player.

## Static launch

`.github/workflows/beat-ai-pages.yml` deploys the `beat-ai/` directory to GitHub Pages from the `beat-ai-mvp` branch. The existing local challenge engine remains playable there even without server environment variables.

## Before taking payments

The Pro button is intentionally a product/checkout placeholder. Add Stripe or native app-store billing only after retention validates the game loop. The first metrics worth measuring are daily completion rate, D1/D7 retention, shares per completed game, and average practice rounds after the daily five.

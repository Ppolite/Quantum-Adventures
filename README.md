# Beat AI

**Live:** https://quantum-adventures.vercel.app

Beat AI is a mobile-first daily human-vs-machine challenge game. Players answer five fast questions, build streaks, compare scores, and try to outsmart AI.

## Current features

- Five-question daily challenge
- Instant answer feedback and explanations
- Score tracking and local streaks
- Shareable result grid
- Practice mode
- Beat AI Pro product surface
- OpenAI-powered daily challenge API with fallback questions
- Supabase-ready leaderboard API
- Vercel deployment support

## Project direction

Quantum Adventures is now the single home for Beat AI. The deleted `videogame` Vercel project is no longer used.

## Production services

For the AI-generated daily set and real leaderboard, configure these server-side variables in Vercel:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The game remains playable with built-in fallback challenges if those services are unavailable.

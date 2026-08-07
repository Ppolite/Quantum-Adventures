# Beat AI engagement systems

This pass keeps the five-question daily loop simple while layering retention and competition around it.

Implemented in the root web app:
- rotating AI opponent personalities and trash talk
- Arena rating changes after competitive runs
- XP, levels, and player titles
- daily streaks and best score
- confidence multipliers with risk/reward scoring
- Lightning mode with a 10-second timer
- weekly 10-round Boss Battle
- unlimited practice mode
- friend challenge sharing
- daily Impossible / 1% question
- category skill tracking
- achievements and unlock notifications
- mystery cosmetic crates every five completed runs
- daily leaderboard crown
- live activity feed
- monthly seasons
- sound and haptic feedback
- concise AI replay explanations after each answer
- Beat AI Pro product surface

The daily OpenAI generator now returns `category` and `aiTake` fields so skill tracking and AI replay explanations are grounded in each generated challenge. The app falls back to bundled content when the API or database is unavailable.

## Smoke tests

Run:

```bash
node test.js
```

The test parses the inline game JavaScript, checks the serverless functions for JavaScript syntax, and asserts the major engagement surfaces are present. GitHub Actions runs the same smoke test on relevant pull requests.

# Beat AI: Casino

Beat AI: Casino is a social-casino expansion inside the existing Beat AI product.

## Current playable MVP

- Casino lobby with Blackjack and AI Poker live; Roulette / Beat the House surfaced as upcoming modes
- Playable blackjack engine against Vincent
- Playable heads-up Texas Hold'em MVP against Maya “Cold Read” Cross
- Maya has a tight-aggressive profile, controlled bluff probability, board/hand-strength awareness, and pressure reactions
- Rival memory currently tracks the player's cumulative poker raises and changes Maya's dialogue / decisions as pressure history builds
- Hold'em streets: pre-flop, flop, turn, river, showdown
- Player actions: check/call, raise, fold
- Simplified poker hand evaluator covering pairs through straight flushes
- 10,000 starting Royale Chips
- 100 / 250 / 500 / 1,000 virtual-chip stakes
- Blackjack 3:2 payout; dealer stands on 17
- Local bankroll, total wins, poker wins, raise history, and casino-level progression
- Mobile-first UI
- Explicit non-cash virtual currency model: chips cannot be redeemed, transferred, or cashed out

## Next build targets

1. Expand Poker with multiple rivals, richer hand evaluation/tiebreakers, opponent archetypes, and session memory
2. Daily Beat the House bankroll challenge
3. Shared Beat AI XP/profile progression across daily game and casino
4. Casino career tiers and unlockable environments
5. Roulette Royale missions and streak system
6. Leaderboards and authenticated persistence
7. Cosmetic-only / subscription monetization surfaces after legal/product review

The casino prototype lives at `beat-ai/casino/index.html`.

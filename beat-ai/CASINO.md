# Beat AI: Casino

Beat AI: Casino is a social-casino expansion inside the existing Beat AI product.

## Current playable MVP

- Casino lobby with Blackjack and AI Poker live; Roulette / Beat the House surfaced as upcoming modes
- Playable blackjack engine against Vincent
- Playable heads-up Texas Hold'em MVP against Maya “Cold Read” Cross
- Dedicated `poker-arena.html` Rival Circuit with four opponent archetypes
- Maya “Cold Read” Cross: tight-aggressive, patient, selective bluffing
- Rex “All Gas” Mercer: maniac aggression and high bluff frequency
- Eli “The Accountant” Stone: conservative grinder with very low bluff frequency
- ARCHON: adaptive boss that changes aggression and bluffing from the player's stored raise/call/fold tendencies
- ARCHON unlocks after defeating Maya, Rex, and Eli at least once
- Persistent machine read classifies the player as aggressive, cautious, sticky, or balanced from recorded decisions
- Rival-specific defeat tracking and persistent poker wins
- Hold'em streets: pre-flop, flop, turn, river, showdown
- Player actions: check/call, raise, fold
- Simplified poker strength engine covering high card through premium made hands
- 10,000 starting Royale Chips
- 100 / 250 / 500 / 1,000 virtual-chip stakes
- Blackjack 3:2 payout; dealer stands on 17
- Shared local bankroll, total wins, poker wins, player-tendency history, and casino-level progression
- Mobile-first UI
- Explicit non-cash virtual currency model: chips cannot be redeemed, transferred, or cashed out

## Next build targets

1. Link the Rival Circuit directly from the primary casino lobby and refine full poker hand tiebreakers
2. Daily Beat the House bankroll challenge
3. Shared Beat AI XP/profile progression across daily game and casino
4. Casino career tiers and unlockable environments
5. Roulette Royale missions and streak system
6. Leaderboards and authenticated persistence
7. Cosmetic-only / subscription monetization surfaces after legal/product review

The casino prototype lives at `beat-ai/casino/index.html` and the expanded Poker Rival Circuit lives at `beat-ai/casino/poker-arena.html`.

# Custom Bracket Logic & QoL Features

## Goal Description
Refactor the tournament application to implement a custom hardcoded bracket routing for 2-8 teams (replacing the generic double-elimination algorithm with specific user-requested paths, including cross-matching), add a score deduction feature (minus button) to correct mistakes, and add a delete button for individual players in the input phase.

## Proposed Changes

### src/app/input/page.tsx
- [MODIFY] Change the remove button icon from `X` to `Trash2`.
- [MODIFY] Remove the `opacity-0 group-hover:opacity-100` classes so the trash icon is always visible, and style it with a dim red accent by default.

### src/components/Scoreboard/ScoreboardModal.tsx
- [MODIFY] Add a Minus (-) button below the +1 Poin button for both Team A and Team B.
- [MODIFY] Call a new `decrementScore` function from the store when clicked.

### src/store/tournamentStore.ts
- [MODIFY] Add `decrementScore: (side: 'A' | 'B') => void` to the store.
- [MODIFY] Logic for `decrementScore`: Reduce the score (min 0). If the match was marked as `finished` (has a winner), but the new score no longer meets the win condition, revert the status to `ongoing` and clear `winner`/`loser`.
- [MODIFY] Update `saveMatch` to support a 2-team Bo3 scenario (if `teams.length === 2`, check if a team has reached 2 wins before declaring them champion, skipping the bracket reset logic).

### src/lib/bracketGenerator.ts
- [MODIFY] Completely rewrite `generateDoubleEliminationBracket` to use a `switch(teams.length)` and hardcode the match creations for `n = 2, 3, 4, 5, 6, 7, 8`.
- [MODIFY] Implement the specific UB and LB routing rules requested by the user, including the mandatory cross-matching when teams drop from the UB Semifinals to the LB.

## Open Questions
- For the 2-team Bo3 scenario, I will generate 3 matches in the 'grand_final' bracket. The UI will render them as Round 1, Round 2, Round 3. Is this visually acceptable? (The logic will crown the champion as soon as a team wins 2 matches).

## Verification Plan
1. Test adding/removing players in the input phase.
2. Test generating brackets for 2, 3, 4, 5, 6, 7, and 8 teams to ensure the exact requested paths and cross-matches are formed.
3. Test the scoreboard minus button, especially when reverting a finished match back to ongoing.

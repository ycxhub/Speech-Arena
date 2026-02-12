# PRD 10: ELO Rating System

## Introduction / Overview

TTS Arena uses an ELO rating system to rank TTS models/voices based on blind A/B test results. When a user votes for Voice A over Voice B, Voice A's rating increases and Voice B's rating decreases, proportional to the expected outcome. Over many matches, the ratings converge to a meaningful quality ranking.

This PRD defines the rated entities, the rating structure (global and per-language), the ELO update algorithm, K-factor policy, storage schema, update strategy, and recomputation logic.

## Goals

1. Implement a mathematically sound ELO rating system that updates in real-time on each vote.
2. Maintain dual ratings per model: one global and one per-language.
3. Use dynamic K-factors that adapt based on the number of matches a model has played.
4. Provide a nightly verification/recomputation job to ensure rating integrity.
5. Store ELO snapshots on each test event for audit and historical analysis.

## User Stories

- **As a user**, I want the Overall Leaderboard to reflect the latest vote results promptly.
- **As a user**, I want to know which TTS models are best for a specific language (per-language ratings).
- **As an admin**, I want confidence that the ratings are correct, even if there were bugs or edge cases in individual updates (nightly verification).
- **As a developer**, I want a clean, well-documented ELO update function that I can unit test.

## Functional Requirements

### Rated Entity

1. The unit of rating is the **model/voice** (`models` table). Each model has its own ELO rating. Providers are NOT rated directly — provider-level performance can be derived by aggregating their models' ratings.

### Rating Structure

2. **Global rating** (`elo_ratings_global` table): One rating per model, updated on every match regardless of language. Represents the model's overall perceived quality.

3. **Per-language rating** (`elo_ratings_by_language` table): One rating per (model, language) pair. Updated only when the match involves that specific language. Represents the model's quality for a specific language.

4. **Justification**: TTS quality varies significantly by language. A model might excel at English but perform poorly in Hindi. Per-language ratings capture this nuance. Global ratings provide a useful summary for cross-language comparison.

### ELO Algorithm

5. **Initial rating**: Every new model starts at **1500** for both global and all per-language ratings.

6. **Expected score calculation**:
   ```
   E_A = 1 / (1 + 10^((R_B - R_A) / 400))
   E_B = 1 / (1 + 10^((R_A - R_B) / 400))
   ```
   Where `R_A` and `R_B` are the current ratings of the two models.

7. **Actual score**: The winner gets `S = 1`, the loser gets `S = 0`. There are no draws (the UI forces a binary choice).

8. **Rating update**:
   ```
   R_A_new = R_A + K * (S_A - E_A)
   R_B_new = R_B + K * (S_B - E_B)
   ```

9. **Rating bounds**: Ratings are NOT clamped — they can go below 0 or above 3000 in theory. In practice, the ELO system self-balances.

### K-Factor Policy

10. **Dynamic K-factor** based on the number of matches the model has played:

    | Matches Played | K-Factor | Rationale |
    |---|---|---|
    | 0 - 30 | 40 | New model, ratings should change quickly to find true level |
    | 31 - 100 | 20 | Moderate adjustment, rating is stabilizing |
    | 101+ | 10 | Established model, small adjustments only |

11. **K-factor is per-model, per-rating-type**: A model's global K-factor is based on its global `matches_played`, and its per-language K-factor is based on that language's `matches_played`. They can differ.

12. **Provisional badge**: Models with < 30 matches (K=40 zone) are marked as "provisional" in the leaderboard UI (handled by PRD 12, but the data comes from `matches_played`).

### ELO Update Function

13. **Function signature** (`src/lib/elo/calculator.ts`):

    ```typescript
    export interface EloUpdateResult {
      winnerNewRating: number;
      loserNewRating: number;
      winnerRatingDelta: number;
      loserRatingDelta: number;
    }

    export function calculateEloUpdate(params: {
      winnerRating: number;
      loserRating: number;
      winnerMatchesPlayed: number;
      loserMatchesPlayed: number;
    }): EloUpdateResult
    ```

    This is a pure function with no side effects — easy to unit test.

14. **K-factor helper**:
    ```typescript
    export function getKFactor(matchesPlayed: number): number {
      if (matchesPlayed <= 30) return 40;
      if (matchesPlayed <= 100) return 20;
      return 10;
    }
    ```

### Update Flow (On Each Vote)

15. When a vote is submitted (from PRD 09), the vote Server Action triggers the ELO update:

    1. Fetch current global ratings for both models from `elo_ratings_global`.
    2. Fetch current per-language ratings for both models from `elo_ratings_by_language` (for the match's language).
    3. Calculate the ELO update for both global and per-language ratings using `calculateEloUpdate`.
    4. **Update `elo_ratings_global`** for both models: set new `rating`, increment `matches_played`, increment `wins` or `losses`, set `last_updated`.
    5. **Update `elo_ratings_by_language`** for both models (scoped to the match's language): same fields.
    6. **Snapshot on test event**: Update the `test_events` row with `elo_before_winner`, `elo_before_loser`, `elo_after_winner`, `elo_after_loser` (using the global ratings for the snapshot).
    7. All updates should be in a single database transaction to maintain consistency.

16. **Transaction approach**: Use a Supabase RPC (database function) that performs all updates atomically:
    ```sql
    CREATE OR REPLACE FUNCTION process_vote(
      p_test_event_id uuid,
      p_winner_id uuid,
      p_loser_id uuid,
      p_language_id uuid,
      p_listen_time_a_ms integer,
      p_listen_time_b_ms integer
    ) RETURNS void AS $$
    DECLARE
      v_winner_global_rating real;
      v_loser_global_rating real;
      -- ... more variables
    BEGIN
      -- Fetch current ratings
      -- Calculate new ratings (using plpgsql math)
      -- Update elo_ratings_global for both
      -- Upsert elo_ratings_by_language for both
      -- Update test_events with results and ELO snapshots
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```

### Rating Initialization

17. When a new model is created (PRD 06), a row should be inserted into `elo_ratings_global` with `rating = 1500, matches_played = 0, wins = 0, losses = 0`.

18. Per-language ratings are created lazily: when a model first participates in a match for a given language, the ELO update function checks if a `elo_ratings_by_language` row exists. If not, it creates one with `rating = 1500` (upsert pattern).

### Nightly Verification Job

19. A nightly job (Vercel Cron, scheduled at e.g., 3:00 AM UTC) that:
    1. Recomputes all global and per-language ratings from scratch by replaying all `test_events` with `status = 'completed'` in chronological order.
    2. Compares recomputed ratings to current stored ratings.
    3. If any rating differs by more than 1 point (floating-point tolerance), logs a warning with the model ID and the discrepancy.
    4. **Does NOT automatically overwrite** current ratings (to avoid disrupting live leaderboards). Admin can trigger a manual override if discrepancies are found.

20. The verification job also recalculates `matches_played`, `wins`, and `losses` from the event log and compares.

### Per-User Ratings (Derived)

21. TTS Arena does NOT maintain a separate per-user ELO table. Instead, the "My Results" page (PRD 11) computes user-specific model rankings on the fly by aggregating the user's own `test_events`. This is simpler and avoids maintaining a third rating table.

## Non-Goals (Out of Scope)

- Glicko-2 or TrueSkill rating systems (ELO is simpler and sufficient for MVP).
- Rating decay (inactive models' ratings do not decrease over time).
- Team/provider-level ratings (derivable from model ratings).
- User skill ratings (this is not a competitive game; we're rating TTS models, not users).
- Real-time rating update push to connected clients (leaderboard refreshes on page load).

## Design Considerations

- No UI in this PRD — the ELO system is a backend module. Its outputs are consumed by PRD 11 (My Results), PRD 12 (Overall Leaderboard), and PRD 08 (Matchmaking).

## Technical Considerations

- The `process_vote` database function should use `SELECT ... FOR UPDATE` on the ELO rating rows to prevent lost updates from concurrent votes involving the same model. This provides row-level locking within the transaction.
- The ELO update must complete quickly (< 100ms) since it is in the critical path of the vote action. Database functions (plpgsql) are faster than multiple round-trip queries from the application layer.
- The `calculateEloUpdate` TypeScript function is used for the nightly verification job (replaying events in application code). The database function is used for the real-time path.
- Both functions must produce identical results. Unit tests should verify they agree.
- Floating-point precision: Use `real` (32-bit float) in Postgres and `number` in TypeScript. Ratings are displayed rounded to the nearest integer in the UI.

## Success Metrics

- ELO ratings update within 200ms of a vote being submitted.
- The nightly verification job finds zero discrepancies (or < 0.1% of models with > 1-point drift).
- Over 500+ matches, ratings correlate with human perception of TTS quality (subjective validation by the team).
- New models reach a stable rating within ~50 matches (K-factor policy works as designed).
- The `calculateEloUpdate` function has 100% unit test coverage.

## Open Questions

1. Should we implement "rating floors" (e.g., a model can never go below 1000)? Recommendation: no — let the math work naturally. A very bad model deserves a low rating.
2. Should the nightly job have the option to automatically fix discrepancies? Recommendation: not in MVP — log only. Manual override by admin if needed.
3. Should we track "rating history" (a time series of each model's rating)? Recommendation: defer — the `test_events` table with ELO snapshots provides this data implicitly. A dedicated history table can be added later for charting.
4. Should the per-language rating or the global rating be used for matchmaking? Recommendation: per-language rating (since matchmaking is language-specific). Documented in PRD 08.

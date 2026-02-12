# PRD 08: Matchmaking Engine

## Introduction / Overview

The matchmaking engine is responsible for selecting the two TTS models, the sentence, and the A/B ordering for each blind test round. Good matchmaking is critical — it determines how quickly the ELO ratings converge to meaningful rankings and how diverse the user's testing experience feels.

This PRD defines the algorithm for candidate selection, sentence selection, constraint enforcement (language, gender, no-repeat rules), and the API that the Blind Test UI calls to get the next round.

## Goals

1. Select two models per round that produce informative comparisons (similar ratings) while also exploring under-tested models.
2. Select a sentence appropriate for the chosen language.
3. Enforce constraints: same language support, same gender, no-repeat pairs for the same user.
4. Randomize A/B ordering to prevent position bias.
5. Expose a single server-side function that returns a fully prepared round (sentence, models, audio URLs).

## User Stories

- **As a user**, I want each test round to feel fresh — not the same two voices repeatedly.
- **As a user**, I want to hear voices that are somewhat comparable in quality so my vote is meaningful (not a clearly terrible voice vs. a clearly great one every time).
- **As the system**, I need to gather enough data on every model to produce reliable ratings, so I must occasionally serve under-tested models.
- **As the system**, I need to respect language and gender constraints so users always hear audio in their chosen language with consistent voice characteristics.

## Functional Requirements

### Round Preparation API

1. **Function signature** (`src/lib/matchmaking/engine.ts`):

   ```typescript
   export async function prepareNextRound(params: {
     userId: string;
     languageId: string;
   }): Promise<{
     testEventId: string;
     sentence: { id: string; text: string };
     audioA: { url: string };
     audioB: { url: string };
   }>
   ```

   This function is called by a Server Action when the Blind Test page needs a new round. It:
   1. Selects a sentence.
   2. Selects two models.
   3. Generates (or retrieves cached) audio for both.
   4. Creates a `test_events` row with `status = 'pending'`.
   5. Returns the data needed by the client (no model identities revealed).

### Sentence Selection

2. **Random sentence selection**:
   - Query active sentences WHERE `language_id` matches the user's chosen language.
   - Exclude sentences that the user has seen in their last N rounds (configurable, default N=10) to avoid repetition.
   - Select one at random from the remaining pool.
   - If the pool is exhausted (user has seen all sentences recently), relax the constraint and allow repeats.

3. **SQL approach** (efficient):
   ```sql
   SELECT id, text FROM sentences
   WHERE language_id = :languageId
     AND is_active = true
     AND id NOT IN (
       SELECT sentence_id FROM test_events
       WHERE user_id = :userId
       ORDER BY created_at DESC
       LIMIT :recentWindow
     )
   ORDER BY random()
   LIMIT 1;
   ```

### Model Selection

4. **Candidate pool**: Query all models WHERE:
   - `models.is_active = true`
   - `providers.is_active = true` (join to provider)
   - Model supports the chosen language (exists in `model_languages` with the matching `language_id`)
   - Provider has at least one `active` API key

5. **Selection strategy — two modes**:

   **Balanced mode (80% of rounds):**
   - Pick the first model randomly from the candidate pool.
   - Pick the second model from candidates within a rating window of the first model's ELO (e.g., +/- 200 rating points in `elo_ratings_by_language` for the chosen language).
   - If no candidates exist within the window, widen to +/- 400, then fall back to random.

   **Exploration mode (20% of rounds):**
   - Pick at least one model with fewer than 30 matches (low-data model that needs more exposure).
   - The other model can be any candidate (prefer one with a similar rating for informative comparison).
   - If no low-data models exist, fall back to Balanced mode.

6. **Mode selection**: Use `Math.random()` — if < 0.2, use Exploration mode; otherwise Balanced mode.

### Gender Constraint

7. Both selected models must have the same `gender` value. The engine:
   - First selects Model A.
   - Then filters the candidate pool for Model B to only include models with the same `gender` as Model A.
   - If no same-gender candidates exist, select Model A again from a pool that guarantees at least two same-gender models exist.

### Anti-Repeat Rules

8. **Pair anti-repeat**: The same two models (regardless of A/B order) should not be matched for the same user within the last 20 rounds.
   - Check: query the user's last 20 `test_events` and extract all `(model_a_id, model_b_id)` pairs.
   - When selecting Model B, exclude any model that was already paired with Model A in this window.

9. **If constraints are too tight** (e.g., very few models for a language), progressively relax:
   - First: reduce anti-repeat window from 20 to 5.
   - Then: allow same-pair repeats.
   - Never relax the language constraint.

### A/B Ordering

10. After selecting the two models, randomly assign which is "A" and which is "B" (50/50 coin flip). This prevents any systematic position bias.

### Audio Preparation

11. For both selected models, call `generateAndStoreAudio(modelId, sentenceId)` from PRD 07 in parallel.
12. If either audio generation fails after retries, discard this round, log the failure, and call `prepareNextRound` recursively (up to 3 retries before returning an error to the client).

### Test Event Creation

13. After successful audio generation for both models, insert a `test_events` row:
    - `user_id`, `sentence_id`, `language_id`
    - `model_a_id`, `model_b_id` (reflecting the randomized A/B assignment)
    - `audio_a_id`, `audio_b_id`
    - `status = 'pending'`
    - `winner_id = NULL`, `loser_id = NULL` (populated when the user votes)

14. Return the `testEventId`, sentence text, and signed audio URLs (but NOT the model names/IDs) to the client.

## Non-Goals (Out of Scope)

- User-configurable matchmaking preferences (e.g., "only compare neural models").
- Gender preference selection by the user (the engine ensures same-gender pairing, but the user does not choose which gender).
- Tournament-style brackets or elimination formats.
- Real-time matchmaking against other users (this is a single-user experience).

## Design Considerations

- This PRD is entirely backend — no UI. The matchmaking engine is invoked by the Blind Test Server Action.
- The engine must be fast. The user is waiting for the next round. Target: < 2 seconds total for matchmaking + audio retrieval (cache hit), < 12 seconds for matchmaking + audio generation (cache miss).

## Technical Considerations

- **Database queries**: The matchmaking algorithm requires several queries (candidate models, recent test events, ELO ratings). Aim to consolidate into 2-3 queries maximum:
  1. Candidate models with their ELO ratings (JOIN `models`, `providers`, `model_languages`, `elo_ratings_by_language`).
  2. Recent test events for the user (for anti-repeat and sentence exclusion).
  3. Random sentence selection.

- **Race conditions**: Two concurrent round preparations for the same user could produce the same pair. This is acceptable — the anti-repeat check is a best-effort optimization, not a hard constraint.

- **Performance**: For the Balanced mode rating window, it is more efficient to fetch all candidates with their ratings into application memory and filter there (typically < 100 candidates for a given language) rather than multiple database round-trips.

- **Fallback**: If there are fewer than 2 eligible models for the chosen language, return an error to the client: "Not enough models available for this language. Please try another language."

- **Randomness**: Use `Math.random()` for JavaScript-level randomness and `ORDER BY random()` for Postgres-level randomness. No need for cryptographic randomness.

## Success Metrics

- 95% of rounds are prepared successfully on the first attempt (no retries needed).
- Average round preparation time is < 3 seconds (including audio cache hit or generation).
- Over 1000 rounds, each active model is selected at least once (exploration works).
- The same pair does not appear for the same user in consecutive rounds.
- Users perceive variety: informal feedback indicates rounds do not feel repetitive.

## Open Questions

1. Should the Balanced mode rating window (+/- 200) be configurable by admins? Recommendation: hardcode for MVP, make configurable later.
2. Should Exploration mode frequency (20%) be adjustable? Recommendation: hardcode for MVP.
3. Should the engine track "matchup completeness" (ensuring every possible pair gets tested at least N times globally)? Recommendation: defer — the current random + exploration approach should provide adequate coverage for MVP.
4. How should the engine handle a language with only 2-3 models? Recommendation: it will repeat pairs more often, but this is acceptable. The anti-repeat window shrinks automatically when constraints are relaxed.

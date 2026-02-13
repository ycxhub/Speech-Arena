# Tasks: Matchmaking Engine (PRD 08)

Implementation tasks for the matchmaking engine that selects sentence + models, generates audio in parallel, and creates test events for blind test rounds.

**Note:** A basic `prepareNextRound` implementation already exists in `src/lib/matchmaking/engine.ts`. These tasks focus on bringing it into full PRD compliance: Balanced/Exploration modes, ELO-based selection, constraint relaxation, and query optimization.

---

## Relevant Files

- `src/lib/matchmaking/engine.ts` - Main matchmaking engine; contains `prepareNextRound`.
- `src/lib/matchmaking/engine.test.ts` - Unit tests for the matchmaking engine (if added).
- `src/lib/tts/generate.ts` - `generateAndStoreAudio` / `generateAndStoreAudioPair` for audio generation.
- `src/types/database.ts` - Database types for models, providers, elo_ratings_by_language, test_events.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `engine.ts` and `engine.test.ts` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/matchmaking-engine`)
- [x] 1.0 Consolidate and optimize database queries
  - [x] 1.1 Create a single candidate-models query: JOIN `models`, `providers` (filter `providers.is_active = true`), `model_languages`, `elo_ratings_by_language` (LEFT JOIN for models without ratings); filter `models.is_active`, `language_id` match; ensure provider has at least one active API key (subquery or join)
  - [x] 1.2 Create a single query for recent test events: select `sentence_id`, `model_a_id`, `model_b_id` for the user, ordered by `created_at` DESC, limit configurable (used for both sentence exclusion and pair anti-repeat)
  - [x] 1.3 Replace two-step sentence selection with one query: use `NOT IN` subquery for recent sentence IDs and `ORDER BY random()` (or equivalent) to select one sentence; fall back to any sentence if pool is empty
- [x] 2.0 Implement Balanced mode (80%) — ELO rating window selection
  - [x] 2.1 Add mode selection at start of model selection: if `Math.random() < 0.2` use Exploration mode, else Balanced mode
  - [x] 2.2 For Balanced mode: pick Model A randomly from candidates (restrict to genders with ≥2 models for same-gender constraint)
  - [x] 2.3 For Balanced mode: filter Model B candidates to those within ±200 ELO of Model A (use `elo_ratings_by_language`; default 1500 if no rating)
  - [x] 2.4 If no candidates in ±200: widen to ±400
  - [x] 2.5 If still no candidates: fall back to random selection from same-gender pool
- [x] 3.0 Implement Exploration mode (20%) — low-data model exposure
  - [x] 3.1 Ensure candidate models include `matches_played` from `elo_ratings_by_language` (default 0 if no row)
  - [x] 3.2 Define low-data threshold: `matches_played < 30`
  - [x] 3.3 For Exploration mode: pick Model A from low-data pool (random); pick Model B from any candidate, preferring similar ELO
  - [x] 3.4 If no low-data models exist: fall back to Balanced mode
- [x] 4.0 Add constraint relaxation (anti-repeat window fallback)
  - [x] 4.1 When selecting Model B: if no candidates after excluding recent pairs (window = 20), retry with window = 5
  - [x] 4.2 If still no candidates: allow same-pair repeats (skip anti-repeat filter)
  - [x] 4.3 Ensure relaxation order: never relax language constraint; only relax anti-repeat
- [x] 5.0 Add provider.is_active filter and ensure full PRD compliance
  - [x] 5.1 Verify `providers.is_active = true` is included in the candidate models query (from 1.1)
  - [x] 5.2 Ensure error message matches PRD: "Not enough models available for this language. Please try another language."
  - [x] 5.3 Implement Model A re-selection: when picking Model A, restrict to genders that have ≥2 models so Model B always has a same-gender candidate

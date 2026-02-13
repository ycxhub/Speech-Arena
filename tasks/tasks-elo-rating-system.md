# Tasks: ELO Rating System (PRD 10)

Implementation tasks for the ELO rating system: dual ratings (global + per-language), dynamic K-factor, real-time updates on vote, and nightly verification.

**Note:** The schema already includes `elo_ratings_global`, `elo_ratings_by_language`, and ELO snapshot columns on `test_events`. The vote flow in `src/app/blind-test/actions.ts` has a TODO for PRD 10.

---

## Relevant Files

- `src/lib/elo/calculator.ts` - ELO update and K-factor pure functions.
- `src/lib/elo/calculator.test.ts` - Unit tests for the ELO calculator.
- `jest.config.ts` - Jest configuration (uses next/jest).
- `src/app/blind-test/actions.ts` - Vote submission; will call `process_vote` RPC.
- `src/app/admin/providers/[providerId]/models/actions.ts` - Model creation; needs to insert `elo_ratings_global`.
- `supabase/migrations/20260213140000_backfill_elo_ratings_global.sql` - Backfill `elo_ratings_global` for existing models.
- `supabase/migrations/20260213150000_process_vote_rpc.sql` - `process_vote` RPC function.
- `src/app/api/cron/elo-verify/route.ts` - Nightly ELO verification cron endpoint.
- `vercel.json` - Cron schedule for verification job.

### Notes

- Unit tests should typically be placed alongside the code files they are testing.
- Use `npx jest [optional/path/to/test/file]` to run tests.
- The `calculateEloUpdate` TypeScript function must produce identical results to the plpgsql logic in `process_vote` (verified by tests).

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/elo-rating-system`)
- [x] 1.0 Implement ELO calculator and K-factor (TypeScript)
  - [x] 1.1 Create `src/lib/elo/calculator.ts` with `getKFactor(matchesPlayed: number): number` returning 40 for 0–30, 20 for 31–100, 10 for 101+
  - [x] 1.2 Add `EloUpdateResult` interface and `calculateEloUpdate` with expected score `E = 1/(1+10^((R_B-R_A)/400))`, actual score S_winner=1/S_loser=0, and update `R_new = R + K*(S-E)`
  - [x] 1.3 Create `src/lib/elo/calculator.test.ts` with unit tests for `getKFactor` (boundary cases: 0, 30, 31, 100, 101)
  - [x] 1.4 Add unit tests for `calculateEloUpdate` (equal ratings, winner higher/lower than loser, K-factor boundary cases)
  - [x] 1.5 Ensure 100% test coverage for `calculator.ts`
- [x] 2.0 Rating initialization (global ratings for new and existing models)
  - [x] 2.1 In `createModel` action: after inserting model, insert `elo_ratings_global` row with `rating=1500`, `matches_played=0`, `wins=0`, `losses=0`
  - [x] 2.2 Create migration to backfill `elo_ratings_global` for existing models that don't have a row (`INSERT ... SELECT ... WHERE NOT EXISTS`)
- [x] 3.0 process_vote RPC and vote flow integration
  - [x] 3.1 Create migration with `process_vote` function: params `(p_test_event_id, p_winner_id, p_loser_id, p_language_id, p_listen_time_a_ms, p_listen_time_b_ms)`
  - [x] 3.2 In `process_vote`: use `SELECT ... FOR UPDATE` on `elo_ratings_global` for winner and loser to lock rows; ensure rows exist (insert with 1500 if missing for backfill edge case)
  - [x] 3.3 In `process_vote`: implement K-factor logic in plpgsql (0–30→40, 31–100→20, 101+→10) and ELO formula (expected score, rating update) for both global and per-language
  - [x] 3.4 In `process_vote`: update `elo_ratings_global` for both models; upsert `elo_ratings_by_language` (lazy create with 1500 when no row exists)
  - [x] 3.5 In `process_vote`: update `test_events` with `winner_id`, `loser_id`, `listen_time_a_ms`, `listen_time_b_ms`, `status='completed'`, `voted_at`, and ELO snapshots (`elo_before_winner`, `elo_before_loser`, `elo_after_winner`, `elo_after_loser`)
  - [x] 3.6 In `submitVote`: replace direct `test_events` update with call to `process_vote` RPC via admin client; remove TODO comment
  - [x] 3.7 Add a test that replays sample events with TypeScript `calculateEloUpdate` and verifies results match plpgsql (or document manual verification)
- [x] 4.0 Nightly verification job
  - [x] 4.1 Create `src/app/api/cron/elo-verify/route.ts` with `CRON_SECRET` auth (same pattern as pre-generate)
  - [x] 4.2 Fetch all `test_events` with `status='completed'` in chronological order
  - [x] 4.3 Replay events using `calculateEloUpdate` to recompute global and per-language ratings, plus `matches_played`, `wins`, `losses`
  - [x] 4.4 Compare recomputed ratings to stored ratings; log warning for any model where difference > 1 point (floating-point tolerance)
  - [x] 4.5 Compare recomputed `matches_played`, `wins`, `losses` to stored values; log discrepancies
  - [x] 4.6 Add `/api/cron/elo-verify` to `vercel.json` crons with schedule `0 3 * * *` (3:00 AM UTC)

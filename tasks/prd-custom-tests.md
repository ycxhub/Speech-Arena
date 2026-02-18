# PRD 12: Custom Tests

## Introduction / Overview

Unlike blind tests where models A and B are chosen at random by the matchmaking engine, **Custom Tests** let users explicitly pick which two TTS models they want to compare. Users select a language, choose Model A and Model B from dropdowns, and the system serves a random sentence rendered by both models. Users listen, vote, and can view their custom test history in My Results — with no ELO (custom tests are personal only, showing win rate and history).

This feature serves users who want to directly compare specific models (e.g., "ElevenLabs vs Murf on this sentence") without relying on random matchmaking.

## Goals

1. Allow users to pick Model A and Model B for a head-to-head comparison.
2. Serve a random sentence for the chosen language, rendered by both selected models.
3. Provide the same listen-and-vote experience as blind tests (listen time enforcement, Vote A / Vote B).
4. Store custom test results separately from blind tests (no ELO updates).
5. Show custom test history and win rate in My Results with a Blind/Custom toggle.
6. Support CSV export of custom test history.

## User Stories

- **As a user**, I want to select a language and then pick two specific models to compare so I can evaluate them head-to-head.
- **As a user**, I want to listen to both clips and vote for my preferred one, just like in blind tests.
- **As a user**, I want to see all custom tests I have run in My Results.
- **As a user**, I want to view My Results filtered by "Blind Test" or "Custom Test" so I can focus on one type at a time.
- **As a user**, I want to export my custom test history as a CSV for personal analysis.
- **As a new user**, I want to run and view custom test results immediately without any minimum test gate.

## Functional Requirements

### Navigation

1. **New top-level nav tab**: Add "Custom Test" to the navigation bar alongside "Blind Test", "My Results", and "Leaderboard".
   - Route: `/custom-test`
   - Active tab detection: `pathname.startsWith("/custom-test")` → `custom-test`

### Custom Test Page (`/custom-test`)

2. **Language picker** at the top:
   - GlassSelect dropdown listing all active languages (fetched from `languages` table).
   - Default: user's last-used language (localStorage) or first language in list.
   - Changing language updates the Model A and Model B dropdowns to show only models that support that language.

3. **Model A selector**:
   - GlassSelect dropdown listing models that support the selected language (via `model_languages`).
   - Each option shows: `model name (provider name)` for clarity.
   - Options: `models` JOIN `model_languages` WHERE `language_id = selectedLanguage`, JOIN `providers` for name.
   - Must be different from Model B.

4. **Model B selector**:
   - Same as Model A, but must be different from Model A.
   - Validation: if both selected and equal, show error or disable "Start Test".

5. **Start Test button**:
   - Enabled when: language selected, Model A selected, Model B selected, Model A ≠ Model B.
   - On click: fetch random sentence for language, generate audio for both models, create `test_events` row with `test_type = 'custom'`, show the A/B listening UI.

6. **Listening and voting UI** (same as blind test):
   - Two GlassCards side by side (on desktop) or stacked (on mobile), labeled "A" and "B".
   - Each card: audio player, play/pause, progress bar, listen-time progress indicator (3-second minimum per clip).
   - Vote A and Vote B buttons enabled only when both clips have ≥ 3 seconds listen time.
   - Skip button if audio fails to load (same as blind test).
   - After vote: show "Vote recorded" toast, then show "Run Another Test" or "Select New Models" — user can choose new A/B and run again, or stay on the same pair for another round.

7. **Post-vote flow**:
   - Option A: Show "Run Another" (same A/B, new sentence) and "Change Models" (back to picker).

8. **Data persistence**:
   - Each custom test round creates a `test_events` row with `test_type = 'custom'`.
   - Vote action updates `winner_id`, `loser_id`, `listen_time_a_ms`, `listen_time_b_ms`, `status = 'completed'`, `voted_at`.
   - **Do NOT** call `process_vote` RPC (which updates global ELO). Custom tests are personal only.

### My Results Page Updates

9. **Test type toggle** at the top of the My Results page:
   - Two options: "Blind Test" | "Custom Test" (e.g., GlassTabs or segmented control).
   - Default: "Blind Test" (matches current behavior).
   - URL param: `?type=blind` or `?type=custom`.

10. **When "Blind Test" is selected**:
    - Show current behavior: personal leaderboard (with ELO), test history, filters, CSV export.
    - Apply gate: 20 tests minimum for full leaderboard (unchanged).
    - Filter: `test_events` WHERE `test_type = 'blind'` (or `test_type IS NULL` for backward compatibility).

11. **When "Custom Test" is selected**:
    - **No gate**: Show full custom test history immediately.
    - **No personal leaderboard with ELO**: Custom tests do not use ELO.
    - **Win rate summary** (optional): Show a simple summary: "Model X vs Model Y: X won 3, Y won 2" or per-model win count in custom tests. For MVP, a simple list of custom tests is sufficient.
    - **Test history table**: Same columns as blind test history (Timestamp, Language, Sentence, Winner, Loser, Audio A, Audio B). Paginated, 20 per page.
    - **Filters**: Language, Provider, Model, Date range (same as blind test filters, but filtered to custom tests only).
    - **Export CSV**: Same format as blind test export, but filtered to custom tests only. Filename: `my-custom-tests-YYYY-MM-DD.csv`.

12. **Custom test list**:
    - Data source: `test_events` WHERE `user_id = currentUser AND status = 'completed' AND test_type = 'custom'`, ordered by `voted_at DESC`.
    - User can see all custom tests they have run.
    - Pagination, filters, and export apply to this list.

### Database Schema

13. **Add `test_type` column to `test_events`**:
    - Type: `text` NOT NULL DEFAULT `'blind'`.
    - Check constraint: `test_type IN ('blind', 'custom')`.
    - Migration: `ALTER TABLE test_events ADD COLUMN test_type text NOT NULL DEFAULT 'blind' CHECK (test_type IN ('blind', 'custom'));`
    - Index: `idx_test_events_test_type` for filtering by `test_type` in My Results queries.

### Vote Flow for Custom Tests

14. **Custom test vote action**:
    - When `test_events.test_type = 'custom'`:
      - Update `test_events` directly: set `winner_id`, `loser_id`, `listen_time_a_ms`, `listen_time_b_ms`, `status = 'completed'`, `voted_at`.
      - Do **not** call `process_vote` RPC (which updates global and per-language ELO).
    - Same validation as blind test: user ownership, listen times, rate limiting.

### Audio Generation

15. **Reuse existing pipeline**:
    - Use `generateAndStoreAudio` or `generateAndStoreAudioPair` from `@/lib/tts` for each model.
    - Random sentence: use `get_random_sentence` RPC (or equivalent) with `p_language_id` and `p_user_id` for sentence exclusion.

### Model Picker Data

16. **Fetch models for language**:
    - Server Action or RPC: given `language_id`, return models that support that language.
    - Query: `models` JOIN `model_languages` ON `model_id = models.id` AND `language_id = :language_id`, JOIN `providers` for name.
    - Filter: `models.is_active = true`, `providers.is_active = true`.
    - Provider must have at least one active API key (same as matchmaking).

## Non-Goals (Out of Scope)

- Custom tests contributing to global ELO or leaderboard.
- User typing their own sentence (random only for MVP).
- User picking from a list of sentences.
- ELO or rating-based leaderboard for custom tests.
- Same-gender constraint for custom tests (user picks any two models; no enforcement).
- Minimum test gate for custom test results.

## Design Considerations

- Custom Test page layout: Setup section (language + Model A + Model B + Start Test) at top; when test is running, show the same A/B layout as blind test.
- Model dropdowns: "Model Name (Provider Name)" format for clarity.
- My Results toggle: Use same GlassTabs or segmented control style as nav bar for consistency.
- Custom test history: Same table layout as blind test history (timestamp, language, sentence, winner, loser, audio replay). No ELO column.

## Technical Considerations

- **Schema migration**: Add `test_type` to `test_events`. Existing rows default to `'blind'`.
- **Vote logic**: The blind test `submitVote` action calls `process_vote` RPC. For custom tests, either:
  - **Option A**: Extend `submitVote` to check `test_type`; if `custom`, skip `process_vote` and only update `test_events` directly.
  - **Option B**: Create a separate `submitCustomVote` action that only updates `test_events`.
  - Recommendation: Option A (single action, conditional logic).
- **My Results**: `getPersonalLeaderboard`, `getTestHistory`, `getFilterOptions`, `exportMyResultsCsv` must accept a `testType` filter (`'blind' | 'custom'`). When `testType === 'custom'`, exclude leaderboard (or show a simplified win-rate summary without ELO) and filter history/export to `test_type = 'custom'`.
- **Model list for language**: Create a Server Action or reuse `get_matchmaking_candidates_by_model` logic but return full model list (no ELO filtering). Or add a simple RPC: `get_models_for_language(p_language_id)` returning `id, name, provider_id, provider_name`.
- **Custom test round creation**: Similar to `prepareNextRound` in matchmaking engine, but for custom tests: user provides `modelAId`, `modelBId`, `languageId`. Fetch random sentence, generate audio for both, insert `test_events` with `test_type = 'custom'`. No matchmaking logic.
- **Audio generation**: Same `generateAndStoreAudio` / `generateAndStoreAudioPair` from `@/lib/tts`. Verify provider has active API key before allowing model selection.

## Success Metrics

- Users can complete a custom test (pick A/B, listen, vote) in under 2 minutes.
- Custom test results appear in My Results immediately after voting.
- CSV export of custom tests completes in < 3 seconds for up to 10,000 rows.
- No custom test votes affect the global ELO leaderboard.

## Open Questions

1. **Win rate summary for custom tests**: Should we show a simple "Model X vs Model Y: X won 3, Y won 2" breakdown, or is the raw history table sufficient for MVP? Recommendation: history table suffices; add summary later if requested.
2. **Same-pair repeat**: Can the user run the same A/B pair multiple times with different sentences? Yes — each run creates a new `test_events` row.
3. **Rate limiting**: Should custom tests have the same vote rate limit (10 per minute) as blind tests? Recommendation: yes, same limit.

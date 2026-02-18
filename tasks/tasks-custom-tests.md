# Tasks: Custom Tests (PRD 12)

Implementation tasks for Custom Tests: user-picked model comparison, custom test page, My Results Blind/Custom toggle, and CSV export.

---

## Relevant Files

- `supabase/migrations/` - New migration for `test_type` column on `test_events`.
- `src/types/database.ts` - Add `test_type` to `test_events` Row/Insert/Update types.
- `src/components/layout/nav-bar.tsx` - Add Custom Test nav tab.
- `src/app/custom-test/page.tsx` - Server component; auth guard, fetch languages.
- `src/app/custom-test/custom-test-client.tsx` - Client component: model picker, listening UI, vote flow.
- `src/app/custom-test/actions.ts` - Server Actions: `getModelsForLanguage`, `prepareCustomRound`, vote handling.
- `src/app/blind-test/actions.ts` - Extend `submitVote` to skip `process_vote` when `test_type = 'custom'`.
- `src/app/my-results/page.tsx` - Pass `testType` from URL param to actions.
- `src/app/my-results/my-results-client.tsx` - Add Blind/Custom toggle; conditionally show leaderboard.
- `src/app/my-results/actions.ts` - Add `testType` filter to `getCompletedTestCount`, `getPersonalLeaderboard`, `getTestHistory`, `getFilterOptions`, `exportMyResultsCsv`.
- `src/lib/tts/generate.ts` - Reuse `generateAndStoreAudio` / `generateAndStoreAudioPair`.
- `src/components/blind-test/audio-card.tsx` - Reuse for custom test listening UI.
- `src/app/blind-test/blind-test-client.tsx` - Reference for layout and vote flow patterns.

### Notes

- Custom tests do NOT call `process_vote` RPC — only update `test_events` directly.
- Blind test gate (20 tests) applies only to blind tests; `getCompletedTestCount` must filter by `test_type = 'blind'` when used for blind results.
- Model picker: `models` JOIN `model_languages` JOIN `providers`; filter `is_active`, provider has active API key.
- `get_random_sentence` RPC already exists; reuse for custom test sentence selection.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/custom-tests`)

- [x] 1.0 Database schema migration
  - [x] 1.1 Create migration file: `ALTER TABLE test_events ADD COLUMN test_type text NOT NULL DEFAULT 'blind' CHECK (test_type IN ('blind', 'custom'));`
  - [x] 1.2 Add index: `CREATE INDEX idx_test_events_test_type ON test_events(test_type);`
  - [x] 1.3 Update `src/types/database.ts` to add `test_type: string` to `test_events` Row, Insert, and Update types
  - [x] 1.4 Run migration locally and verify existing rows have `test_type = 'blind'`

- [x] 2.0 Navigation
  - [x] 2.1 Add `{ id: "custom-test", label: "Custom Test", href: "/custom-test" }` to `NAV_TABS` in `nav-bar.tsx`
  - [x] 2.2 Update `getActiveTab` to return `"custom-test"` when `pathname.startsWith("/custom-test")`
  - [x] 2.3 Ensure Custom Test tab appears between Blind Test and My Results (or as specified in PRD)

- [x] 3.0 Custom Test page structure
  - [x] 3.1 Create `src/app/custom-test/page.tsx`: server component, auth redirect if not signed in, fetch active languages
  - [x] 3.2 Create `src/app/custom-test/custom-test-client.tsx` as client component with two modes: "setup" (model picker) and "testing" (A/B listening)
  - [x] 3.3 Setup mode: Language GlassSelect, Model A GlassSelect, Model B GlassSelect, Start Test GlassButton
  - [x] 3.4 Default language from localStorage key (e.g., `custom-test-language-id`) or first language; persist on change
  - [x] 3.5 Validate Model A ≠ Model B; disable Start Test or show error if same
  - [x] 3.6 Start Test enabled only when: language selected, Model A selected, Model B selected, Model A ≠ Model B

- [x] 4.0 Model picker server actions
  - [x] 4.1 Create `src/app/custom-test/actions.ts` with Server Action `getModelsForLanguage(languageId)`
  - [x] 4.2 Query: `models` JOIN `model_languages` ON `language_id = languageId`, JOIN `providers` for name; filter `models.is_active`, `providers.is_active`
  - [x] 4.3 Ensure provider has at least one active API key (subquery or join on `api_keys` where `status = 'active'`)
  - [x] 4.4 Return `{ id, name, providerName }[]` for dropdown options; display as "Model Name (Provider Name)"
  - [x] 4.5 On language change in client: call `getModelsForLanguage`, update Model A and Model B dropdowns, reset selections

- [x] 5.0 Custom test round creation
  - [x] 5.1 Create Server Action `prepareCustomRound(languageId, modelAId, modelBId)` in `custom-test/actions.ts`
  - [x] 5.2 Validate user is authenticated; validate modelAId ≠ modelBId; validate both models support language
  - [x] 5.3 Call `get_random_sentence` RPC with `p_language_id`, `p_user_id`, `p_exclude_window` (e.g., 10)
  - [x] 5.4 Call `generateAndStoreAudioPair` (or two `generateAndStoreAudio`) for both models with the sentence
  - [x] 5.5 On audio generation failure: return error; optionally retry once
  - [x] 5.6 Insert `test_events` row: `user_id`, `sentence_id`, `language_id`, `model_a_id`, `model_b_id`, `audio_a_id`, `audio_b_id`, `status = 'pending'`, `test_type = 'custom'`
  - [x] 5.7 Return `{ testEventId, sentence, audioA: { url }, audioB: { url } }` (same shape as blind test)
  - [x] 5.8 On Start Test click: call `prepareCustomRound`, switch to testing mode with round data

- [x] 6.0 Custom test listening and voting UI
  - [x] 6.1 Reuse `AudioCard` from `@/components/blind-test/audio-card` for A and B cards
  - [x] 6.2 Implement same listen-time enforcement: 3 seconds per clip, progress indicator, Vote A / Vote B enabled when both met
  - [x] 6.3 Add Skip button for audio load failure; call `markRoundInvalid` (reuse from blind-test actions or create custom-test variant)
  - [x] 6.4 On vote: call `submitVote` (shared with blind test; will be extended in 7.0)
  - [x] 6.5 After vote: show "Vote recorded" toast; show "Run Another" (same A/B, new sentence) and "Change Models" (back to setup)
  - [x] 6.6 "Run Another": call `prepareCustomRound` again with same languageId, modelAId, modelBId
  - [x] 6.7 "Change Models": switch back to setup mode, reset model selections

- [x] 7.0 Custom test vote logic (no ELO)
  - [x] 7.1 In `submitVote` (blind-test/actions.ts): fetch `test_event` including `test_type` column
  - [x] 7.2 If `test_type === 'custom'`: update `test_events` directly with `winner_id`, `loser_id`, `listen_time_a_ms`, `listen_time_b_ms`, `status = 'completed'`, `voted_at`; do NOT call `process_vote` RPC
  - [x] 7.3 If `test_type === 'blind'` (or null/undefined for backward compat): keep existing behavior (call `process_vote`)
  - [x] 7.4 Ensure `markRoundInvalid` works for custom tests (updates only `test_events.status`; no ELO to revert)

- [x] 8.0 My Results: Blind/Custom toggle
  - [x] 8.1 Add `type` URL param to My Results: `?type=blind` or `?type=custom`; default `type=blind`
  - [x] 8.2 Add Blind/Custom toggle (GlassTabs or segmented control) at top of My Results; updating toggle updates URL
  - [ ] 8.3 Pass `testType: 'blind' | 'custom'` from page to all data-fetching calls based on `type` param

- [x] 9.0 My Results: Filter by test type
  - [ ] 9.1 Update `getCompletedTestCount(userId, testType?)`: when `testType === 'blind'`, add `.eq('test_type', 'blind')`; when `testType === 'custom'`, add `.eq('test_type', 'custom')`; when undefined, count all (for backward compat)
  - [ ] 9.2 Update `getPersonalLeaderboard(userId, filters?, testType?)`: when `testType === 'custom'`, return empty array (no leaderboard for custom); when `testType === 'blind'`, add `.eq('test_type', 'blind')` to query
  - [ ] 9.3 Update `getTestHistory(userId, page, filters?, testType?)`: add `.eq('test_type', testType)` when testType is provided
  - [ ] 9.4 Update `getFilterOptions(userId, testType?)`: when testType provided, derive filter options only from events with that test_type
  - [ ] 9.5 Update `exportMyResultsCsv(filters?, testType?)`: add `.eq('test_type', testType)` when testType provided; use filename `my-custom-tests-YYYY-MM-DD.csv` when testType === 'custom'
  - [x] 9.6 In My Results page: pass `testType` from `params.type` to all actions

- [x] 10.0 My Results: Custom test view
  - [x] 10.1 When `testType === 'custom'`: hide personal leaderboard (or show empty state: "Custom tests don't use ELO")
  - [x] 10.2 When `testType === 'custom'`: show test history table with same columns (Timestamp, Language, Sentence, Winner, Loser, Audio A, Audio B)
  - [x] 10.3 When `testType === 'custom'`: no minimum test gate — show full history immediately
  - [x] 10.4 When `testType === 'custom'`: filters (Language, Provider, Model, Date range) apply to custom test history
  - [x] 10.5 When `testType === 'custom'`: Export CSV button exports only custom tests with filename `my-custom-tests-YYYY-MM-DD.csv`

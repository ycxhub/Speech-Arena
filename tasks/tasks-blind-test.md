# Tasks: Blind Test (Battle Royale) Experience

Generated from [PRD 09: Blind Test (Battle Royale) Experience](prd-blind-test.md).

## Relevant Files

- `src/app/blind-test/page.tsx` - Server component wrapper; fetches user session and languages, passes to client.
- `src/app/blind-test/blind-test-client.tsx` - Client component: language picker, sentence, audio cards, vote buttons, round flow.
- `src/app/blind-test/actions.ts` - Server Actions: `getActiveLanguages`, `prepareNextRoundAction`, `submitVote`, `markRoundInvalid`.
- `src/app/api/vote/route.ts` - API route for vote submission (alternative to Server Action; use if client prefers fetch).
- `src/components/blind-test/audio-card.tsx` - Reusable audio card component (label A/B, play/pause, progress, listen-time indicator).
- `src/components/blind-test/audio-card.test.tsx` - Unit tests for `audio-card.tsx`.
- `src/lib/matchmaking/engine.ts` - Contains `prepareNextRound`; used by Blind Test actions.
- `src/lib/supabase/admin.ts` - Admin client for vote updates (bypasses RLS).
- `src/lib/supabase/server.ts` - Server client for auth and user-scoped queries.
- `src/components/ui/glass-card.tsx` - GlassCard for layout.
- `src/components/ui/glass-button.tsx` - GlassButton for vote buttons and play controls.
- `src/components/ui/glass-select.tsx` - GlassSelect for language picker.
- `src/types/database.ts` - Database types for `test_events`, `languages`, `audio_files`.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `audio-card.tsx` and `audio-card.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- The vote Server Action uses the Supabase service role client (`getAdminClient`) to update `test_events` (RLS does not allow direct user updates).

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/blind-test`)
- [x] 1.0 Set up Blind Test page structure and routing
  - [x] 1.1 Create a server component wrapper at `src/app/blind-test/page.tsx` that fetches the user session and passes the user ID to the client component.
  - [x] 1.2 Create `src/app/blind-test/blind-test-client.tsx` as a client component (`"use client"`) with the main layout: sentence display, two audio cards, vote buttons.
  - [x] 1.3 Add the sentence display above the two audio cards in a GlassCard: full sentence text, `text-lg`, centered.
  - [x] 1.4 Layout: two GlassCards side by side on desktop (grid), stacked on narrow screens (responsive).
  - [x] 1.5 Add a small round counter in the corner showing "Round X" (session-only state, incrementing per round).
- [x] 2.0 Implement language selection
  - [x] 2.1 Fetch active languages from `languages` table (filter `is_active = true`) in a server action or on page load.
  - [x] 2.2 Add a GlassSelect at the top of the Blind Test page for language selection.
  - [x] 2.3 Default: user's last-used language from `localStorage` key (e.g., `blind-test-language-id`), or first language in list.
  - [x] 2.4 On language change: persist to `localStorage` and immediately trigger a new round via `prepareNextRound` (reset state, load new round).
  - [x] 2.5 Keep the language picker visible during testing so the user can switch at any time.
- [x] 3.0 Build audio player UI and controls
  - [x] 3.1 Create `src/components/blind-test/audio-card.tsx`: accept label ("A" or "B"), audio URL, loading state, error state.
  - [x] 3.2 Each card: large label ("A" or "B") as watermark (`text-6xl font-bold text-white/20`), centered.
  - [x] 3.3 Use hidden native `<audio>` element controlled via ref; custom-styled UI: large Play/Pause GlassButton, slim progress bar, current time / total duration (e.g., "0:03 / 0:07").
  - [x] 3.4 Show loading spinner or pulsing placeholder while audio loads (`canplay` event); hide when ready.
  - [x] 3.5 Apply subtle color accents: Card A blue accent, Card B purple accent (per design).
- [x] 4.0 Implement listen-time enforcement
  - [x] 4.1 Maintain `listenTimeA` and `listenTimeB` state (milliseconds) in the Blind Test client.
  - [x] 4.2 Use `timeupdate` on each `<audio>` element; on each event, calculate delta since last update (using `performance.now()`) and add to accumulated time.
  - [x] 4.3 Ensure seeking backward does NOT reduce accumulated time (cumulative play time only).
  - [x] 4.4 Add visual progress indicator per card: circular or linear progress (0–100% as listen time goes 0→3s).
  - [x] 4.5 When minimum met: show checkmark icon (accent green) replacing progress; text: "Ready to vote" with checkmark.
  - [x] 4.6 When not met: text "Listen for X more seconds".
  - [x] 4.7 Position "Vote A" and "Vote B" buttons below the cards; initially disabled with tooltip "Listen to both clips first".
  - [x] 4.8 Enable vote buttons only when both `listenTimeA >= 3000` and `listenTimeB >= 3000`.
- [x] 5.0 Implement voting, API, and infinite loop flow
  - [x] 5.1 Create `src/app/blind-test/actions.ts` with Server Action `submitVote(testEventId, winner, listenTimeAMs, listenTimeBMs)`.
  - [x] 5.2 In `submitVote`: validate `testEventId` exists and `status = 'pending'`; validate `testEvent.user_id` matches current user.
  - [x] 5.3 Determine `winner_id` and `loser_id` from `winner` and `model_a_id` / `model_b_id`; update `test_events` with `winner_id`, `loser_id`, `listen_time_a_ms`, `listen_time_b_ms`, `status = 'completed'`, `voted_at = now()`.
  - [x] 5.4 Trigger ELO rating update (PRD 10) — implement or integrate existing ELO update logic.
  - [x] 5.5 On vote click: immediately disable both buttons; call `submitVote`; show brief feedback (accent flash on winning card or "Vote recorded" toast) for 500ms.
  - [x] 5.6 After feedback: call `prepareNextRound` (from matchmaking engine); show loading state (pulsing cards or "Loading next round...").
  - [x] 5.7 On new round data: update sentence, audio URLs, reset listen times, disable vote buttons, increment round counter.
  - [x] 5.8 Pre-fetch: start `prepareNextRound` while showing vote animation to overlap loading with animation.
- [x] 6.0 Handle edge cases and data persistence
  - [x] 6.1 Audio load failure: on `error` event, show "Audio failed to load" on that card; add "Skip Round" button.
  - [x] 6.2 Create server action `markRoundInvalid(testEventId)`: set `status = 'invalid'`; call `prepareNextRound` to load next round.
  - [x] 6.3 Vote API failure: show toast "Failed to submit vote. Retrying..."; retry once; if still fails, show "Vote could not be submitted. Please check your connection."; do NOT load next round until vote confirmed.
  - [x] 6.4 Log audio load errors server-side when marking round invalid (optional: add API endpoint for error reporting).
  - [x] 6.5 Ensure `test_events` row is created by matchmaking (already done); vote action updates it with `winner_id`, `loser_id`, `listen_time_a_ms`, `listen_time_b_ms`, `status`, `voted_at`.

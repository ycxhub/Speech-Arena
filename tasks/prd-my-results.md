# PRD 11: My Results -- Personal Dashboard

## Introduction / Overview

After running blind tests, users want to see their personal data: which TTS models they prefer, their voting history, and how their preferences compare to the global consensus. The "My Results" page provides a personal leaderboard (derived from the user's own votes), a detailed test history table, and filtering/export capabilities.

This page incentivizes users to run more tests ("complete ~20 tests to see meaningful results") and gives them a sense of ownership over their contributions.

## Goals

1. Show a personal leaderboard of TTS models ranked by the user's own voting patterns.
2. Display a paginated, filterable test history with links to replay audio.
3. Communicate data confidence clearly ("not enough data" indicators for low sample sizes).
4. Support CSV export of the user's test history.
5. Gate meaningful results behind a minimum test count (~20) to set accurate expectations.

## User Stories

- **As a user**, I want to see which TTS models I consistently prefer so I know my personal favorites.
- **As a user**, I want to review my past tests — see what sentence was played, which model won, and replay the audio.
- **As a user**, I want to filter my history by language, provider, or date range to focus on specific comparisons.
- **As a user**, I want to export my history as a CSV for personal analysis.
- **As a new user with < 20 tests**, I want to see a prompt encouraging me to run more tests, with a progress indicator.

## Functional Requirements

### Access Gate (Minimum Tests)

1. When the user has completed fewer than 20 tests:
   - Show a GlassCard with a message: "Complete at least 20 tests to unlock your full results."
   - Show a progress bar: "X / 20 tests completed" with accent-blue fill.
   - Below the progress bar, show a partial/preview of the personal leaderboard (if any data exists) with a "not enough data" overlay or reduced opacity.
   - Link to the Blind Test page: "Start Testing" button.

2. When the user has completed 20+ tests:
   - Show the full personal leaderboard and test history without restrictions.

### Personal Leaderboard

3. **Data source**: Computed server-side by aggregating the user's `test_events` (WHERE `user_id = currentUser AND status = 'completed'`).

4. **Computation**:
   - For each model the user has encountered (as either model_a or model_b):
     - `matches_played`: Count of test events involving this model.
     - `wins`: Count of test events where this model was the `winner_id`.
     - `losses`: Count of test events where this model was the `loser_id`.
     - `win_rate`: `wins / matches_played` (as a percentage).
     - `user_elo`: Computed by replaying the user's votes in chronological order through the ELO algorithm (starting each model at 1500, using the user's votes only). This gives a personalized rating reflecting the user's preferences.
   - Sort by `user_elo` descending.

5. **Leaderboard table** (GlassTable):
   - Columns: Rank, Model Name, Provider, Win Rate, Matches, User ELO, Confidence.
   - Confidence indicator:
     - "Strong" (green badge): 30+ matches with this model.
     - "Moderate" (yellow badge): 10-29 matches.
     - "Low" (red/gray badge): < 10 matches, with tooltip: "Not enough data for reliable ranking."

6. **Sorting**: Default sort by User ELO descending. Clickable column headers to sort by win rate, matches, or name.

### Test History Table

7. **Data source**: `test_events` WHERE `user_id = currentUser AND status = 'completed'`, ordered by `voted_at DESC`.

8. **History table** (GlassTable, paginated, 20 rows per page):
   - Columns:
     - Timestamp (`voted_at`, formatted as "Feb 12, 2026 3:45 PM").
     - Language (language name).
     - Sentence (text, truncated to 60 chars with tooltip for full text).
     - Winner (model name, with green accent).
     - Loser (model name, with red accent).
     - Audio A (play icon button — opens a small inline player or modal to replay).
     - Audio B (play icon button — same).
   - Pagination: Previous / Next buttons, page number indicator.

9. **Audio replay**: Clicking the play icon for Audio A or Audio B generates a signed URL on-demand (Server Action fetches `audio_files.r2_key` and creates a signed URL) and plays it in a small inline audio player or a mini-modal. The signed URL has a short expiry (5 minutes).

### Filters

10. **Filter bar** at the top of the history table (inside a GlassCard):
    - **Language**: Dropdown of languages the user has tested.
    - **Provider**: Dropdown of providers the user has encountered.
    - **Model/Voice**: Dropdown (dependent on selected provider, if any).
    - **Date range**: Two date inputs (From, To).
    - **Apply** button and **Clear** button.
    - Filters apply to BOTH the personal leaderboard and the history table.

11. **URL-based filters**: Filter state is stored in URL query params (`?language=en&provider=elevenlabs&from=2026-01-01&to=2026-02-12`) so filtered views are bookmarkable and shareable.

### CSV Export

12. **Export button**: A GlassButton labeled "Export CSV" in the filter bar area.
    - On click: Server Action queries the user's test events (with current filters applied) and generates a CSV.
    - CSV columns: `timestamp`, `language`, `sentence_text`, `winner_model`, `winner_provider`, `loser_model`, `loser_provider`, `listen_time_a_ms`, `listen_time_b_ms`.
    - The CSV is returned as a downloadable file (`Content-Disposition: attachment; filename="my-results-YYYY-MM-DD.csv"`).
    - Maximum export: 10,000 rows (paginated export for users with massive history — show a warning if exceeded).

13. **No model IDs or audio URLs in CSV**: The export contains human-readable names only. Audio URLs are signed and would expire, so they are excluded.

## Non-Goals (Out of Scope)

- Comparing the user's personal rankings to the global rankings side-by-side (could be a future feature).
- Charting/graphing the user's ELO history over time (table only for MVP).
- Sharing results publicly (no public profile URL).
- User profile editing (display name, avatar).
- Deleting or modifying past test results.

## Design Considerations

- The page has two main sections: Personal Leaderboard (top) and Test History (bottom), each in their own GlassCard.
- The "minimum 20 tests" gate should feel encouraging, not punishing — use a progress bar with accent-blue fill and motivational copy.
- The confidence badges (Strong/Moderate/Low) should be clearly visible next to each model's row in the leaderboard.
- Audio replay buttons should be small and unobtrusive — a play icon (triangle) inside a small circle.
- The filter bar should collapse into a single row on desktop with all filters visible.

## Technical Considerations

- **User ELO computation**: For MVP, compute the user's personal ELO on every page load by replaying their vote history. For users with < 1000 votes, this is fast (< 100ms). If performance becomes an issue, cache the computation in a `user_model_ratings` table and invalidate on new votes.
- **Pagination**: Server-side pagination using `LIMIT` / `OFFSET` on the `test_events` query. Page number and size passed as query params.
- **Audio replay signed URLs**: Generated on demand (not pre-generated for every row) to avoid unnecessary R2 operations. The play button triggers a small fetch to get the signed URL, then plays.
- **Data joins**: The history table requires joining `test_events` → `models` (for names) → `providers` (for provider names) → `sentences` (for text) → `languages` (for language name). This is a complex query — consider a Supabase view or a well-structured `.select()` with nested relations:
  ```typescript
  supabase.from('test_events')
    .select(`
      *,
      sentence:sentences(text, language:languages(name, code)),
      model_a:models!model_a_id(name, provider:providers(name)),
      model_b:models!model_b_id(name, provider:providers(name)),
      winner:models!winner_id(name),
      loser:models!loser_id(name)
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('voted_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
  ```
- **CSV generation**: Use a simple string builder or a lightweight library like `json2csv`. Generate the CSV in a Server Action and return it as a `Response` with the appropriate headers.

## Success Metrics

- Users who reach 20 tests visit the My Results page at least once (measurable via page view analytics).
- The personal leaderboard loads in < 1 second for users with up to 500 tests.
- CSV export completes in < 3 seconds for up to 10,000 rows.
- Users find the confidence indicators helpful (qualitative feedback).

## Open Questions

1. Should the personal ELO be computed per-language or globally? Recommendation: globally for MVP (simpler); add per-language toggle later.
2. Should we show how the user's personal ranking differs from the global ranking (e.g., "You rank Model X #2, global ranks it #5")? Recommendation: defer — interesting but complex.
3. Should the minimum test count (20) be configurable? Recommendation: hardcode for MVP.
4. Should audio replay work for very old tests where the R2 file might have been cleaned up? Recommendation: for MVP, assume audio files are never deleted. Add retention policies later if R2 storage costs become an issue.

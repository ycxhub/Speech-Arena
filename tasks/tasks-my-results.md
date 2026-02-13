# Tasks: My Results — Personal Dashboard (PRD 11)

Implementation tasks for the My Results page: personal leaderboard, test history table, filters, CSV export, and minimum test gate.

---

## Relevant Files

- `src/app/my-results/page.tsx` - Main page component (currently placeholder).
- `src/app/my-results/actions.ts` - Server Actions for data fetching, user ELO computation, signed URLs, CSV export.
- `src/app/my-results/my-results-client.tsx` - Client component for interactive elements (filters, pagination, audio replay).
- `src/lib/elo/calculator.ts` - ELO calculator for replaying user votes (personal ELO).
- `src/lib/r2/storage.ts` - getSignedUrl for audio replay.
- `src/components/ui/glass-table.tsx` - GlassTable for leaderboard and history.
- `src/components/ui/glass-card.tsx` - GlassCard containers.
- `src/components/ui/glass-button.tsx` - GlassButton for actions.
- `src/components/ui/glass-select.tsx` - GlassSelect for filters.
- `src/components/ui/glass-badge.tsx` - GlassBadge for confidence indicators.
- `src/types/database.ts` - Database types.

### Notes

- User ELO: replay user's votes chronologically through ELO algorithm (start each model at 1500).
- Signed URLs: 5-minute expiry, generated on-demand when play button clicked.
- CSV export: max 10,000 rows, human-readable names only.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/my-results`)
- [x] 1.0 Access gate and minimum test count
  - [x] 1.1 Create Server Action to count user's completed test events
  - [x] 1.2 When < 20 tests: render GlassCard with "Complete at least 20 tests to unlock your full results", progress bar (X/20), partial leaderboard preview with overlay, "Start Testing" link
  - [x] 1.3 When 20+ tests: show full leaderboard and history without restrictions
- [x] 2.0 Personal leaderboard
  - [x] 2.1 Create Server Action to fetch user's completed test_events and compute per-model stats (matches_played, wins, losses, win_rate)
  - [x] 2.2 Implement user ELO computation: replay votes chronologically through ELO algorithm (start 1500)
  - [x] 2.3 Render GlassTable with columns: Rank, Model Name, Provider, Win Rate, Matches, User ELO, Confidence
  - [x] 2.4 Add confidence badges: Strong (30+), Moderate (10-29), Low (<10) with tooltip
  - [x] 2.5 Add sortable column headers (default: User ELO desc)
- [x] 3.0 Test history table
  - [x] 3.1 Create Server Action to fetch paginated test_events (20 per page) with joins (sentence, models, providers, languages)
  - [x] 3.2 Render GlassTable: Timestamp, Language, Sentence (truncated 60 chars), Winner, Loser, Audio A, Audio B
  - [x] 3.3 Add pagination: Previous/Next, page indicator
  - [x] 3.4 Create Server Action for signed audio URL (5 min expiry)
  - [x] 3.5 Add play buttons for Audio A/B that fetch signed URL and play inline
- [x] 4.0 Filters
  - [x] 4.1 Add filter bar: Language, Provider, Model/Voice, Date range (From/To), Apply, Clear
  - [x] 4.2 Store filter state in URL query params (?language=en&provider=elevenlabs&from=...&to=...)
  - [x] 4.3 Apply filters to both personal leaderboard and history table
- [x] 5.0 CSV export
  - [x] 5.1 Add "Export CSV" button in filter bar
  - [x] 5.2 Server Action: query test_events with filters, generate CSV (timestamp, language, sentence_text, winner_model, winner_provider, loser_model, loser_provider, listen_time_a_ms, listen_time_b_ms)
  - [x] 5.3 Return downloadable file with Content-Disposition; max 10,000 rows with warning if exceeded

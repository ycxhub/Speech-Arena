# Tasks: Overall Leaderboard (PRD 12)

Implementation tasks for the public leaderboard: global ELO rankings, per-language view, filters, provisional badges, and summary stats.

---

## Relevant Files

- `src/app/leaderboard/page.tsx` - Main leaderboard page (currently placeholder).
- `src/app/leaderboard/leaderboard-client.tsx` - Client component for filters, search, sort.
- `src/app/leaderboard/actions.ts` - Server Actions for fetching elo_ratings_global and elo_ratings_by_language.
- `src/components/ui/glass-table.tsx` - GlassTable for leaderboard.
- `src/components/ui/glass-card.tsx` - GlassCard containers.
- `src/components/ui/glass-select.tsx` - GlassSelect for filters.
- `src/components/ui/glass-badge.tsx` - GlassBadge for provisional.
- `src/components/ui/glass-input.tsx` - GlassInput for search.
- `src/types/database.ts` - Database types.

### Notes

- Leaderboard is public (no auth required) per PRD.
- Use ISR with revalidate: 300 for caching.
- Date range filter: defer for MVP (expensive query).
- Top 3 models: subtle gold/silver/bronze accent.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/overall-leaderboard`)
- [x] 1.0 Main leaderboard view
  - [x] 1.1 Create Server Action to fetch elo_ratings_global with model and provider joins (active only)
  - [x] 1.2 Render GlassTable: Rank, Model Name, Provider, ELO Rating, Matches, Win Rate, Last Updated
  - [x] 1.3 Add sortable column headers (Rank, ELO, Matches, Win Rate)
  - [x] 1.4 Add provisional badge (orange) for models with matches_played < 30
  - [x] 1.5 Exclude inactive models (is_active = false)
- [x] 2.0 Per-language view
  - [x] 2.1 Add GlassSelect "Language" dropdown: "All Languages" + active languages
  - [x] 2.2 When language selected: fetch from elo_ratings_by_language, filter by language_id
  - [x] 2.3 Update URL: /leaderboard?language=en
  - [x] 2.4 Show only models that support selected language (via model_languages)
- [x] 3.0 Filters and search
  - [x] 3.1 Add filter bar: Language, Provider, Tags (multi-select), Min Matches (number input)
  - [x] 3.2 Add search input (client-side filter by model name or provider name)
  - [x] 3.3 Store filters in URL query params
- [x] 4.0 Summary stats and empty state
  - [x] 4.1 Add summary GlassCards: Total Models Ranked, Total Matches, Active Languages
  - [x] 4.2 Add low-data banner if total matches < 500
  - [x] 4.3 Empty state: "No rankings yet. Be the first to run a blind test!" with link to Blind Test
- [x] 5.0 Polish
  - [x] 5.1 Sticky table header
  - [x] 5.2 Top 3 models: gold/silver/bronze accent on rank
  - [x] 5.3 Add ISR revalidate: 300 to page

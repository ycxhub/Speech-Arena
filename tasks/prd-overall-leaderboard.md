# PRD 12: Overall Leaderboard

## Introduction / Overview

The Overall Leaderboard is the public-facing ranking of all TTS models across all users' votes. It shows the aggregated ELO ratings, win rates, and match counts for every active model, allowing users to see which TTS voices are the most preferred by the community.

This page serves as the "results" destination — the global truth that all the blind testing contributes to. It also supports per-language views, filtering, and search.

## Goals

1. Display a ranked list of all active TTS models sorted by global ELO rating.
2. Support switching to per-language leaderboards.
3. Provide filters for provider, model tags, date range, and minimum matches.
4. Distinguish "provisional" models (< 30 matches) from established ones.
5. Deliver fast page loads via server-side rendering with caching.

## User Stories

- **As a user**, I want to see which TTS models are globally ranked highest so I can choose the best one for my needs.
- **As a user**, I want to filter the leaderboard by language to find the best model for Spanish, Hindi, etc.
- **As a user**, I want to see how many matches each model has played so I can judge the reliability of its ranking.
- **As a user**, I want to filter by provider to compare models within a specific company.
- **As a user**, I want models with very few matches to be clearly marked so I know their ranking is uncertain.

## Functional Requirements

### Main Leaderboard View

1. **Route**: `/leaderboard`

2. **Default view**: All active models ranked by `rating` from `elo_ratings_global`, descending.

3. **Leaderboard table** (GlassTable):
   - Columns:
     - **Rank**: Sequential number (1, 2, 3, ...).
     - **Model Name**: Display name of the model.
     - **Provider**: Provider name (with small provider logo/icon if available, otherwise text only).
     - **ELO Rating**: Current rating, displayed as a rounded integer (e.g., "1647").
     - **Matches**: Total matches played.
     - **Win Rate**: `wins / matches_played` as a percentage (e.g., "64.2%").
     - **Last Updated**: Relative time (e.g., "2 hours ago") or absolute date.
   - Rows are sortable by clicking column headers (Rank, ELO, Matches, Win Rate).

4. **Provisional badge**: Models with `matches_played < 30` display a GlassBadge labeled "Provisional" (orange accent) next to their name. Tooltip: "This model has fewer than 30 matches. Its rating may change significantly."

5. **Inactive models**: Models with `is_active = false` are NOT shown in the leaderboard by default. An admin-only toggle could show them (defer to future).

### Per-Language View

6. **Language toggle**: A GlassSelect dropdown labeled "Language" at the top of the page.
   - Options: "All Languages" (default, shows global ratings) + all active languages.
   - Selecting a language switches the data source from `elo_ratings_global` to `elo_ratings_by_language` WHERE `language_id` matches.
   - Only models that support the selected language are shown.
   - URL updates: `/leaderboard?language=en` for bookmarkability.

7. **Column adjustment**: When viewing a specific language:
   - The "ELO Rating" column shows the per-language rating.
   - The "Matches" column shows per-language matches.
   - The "Win Rate" shows per-language win rate.

### Filters

8. **Filter bar** (inside a GlassCard above the table):
   - **Language**: Dropdown (as described above).
   - **Provider**: Dropdown of all active providers. Selecting one filters the table to only show models from that provider.
   - **Tags**: Multi-select checkboxes or dropdown (neural, fast, premium, etc.). Filters models that have ANY of the selected tags.
   - **Min Matches**: Number input. Only show models with `matches_played >= X`. Default: 0 (show all). Common presets: 10, 30, 50, 100.
   - **Date Range**: From/To date pickers. Filters based on matches played within the date range. NOTE: This requires querying `test_events` within the range and recomputing stats on the fly, which is expensive. For MVP, this filter is optional — can show a "coming soon" label.

9. **Search**: A search input that filters the table by model name or provider name (client-side filtering on the loaded data, since the leaderboard is typically < 200 rows).

10. **URL-based state**: All filter selections are reflected in URL query params for bookmarkability: `/leaderboard?language=es&provider=elevenlabs&min_matches=30`.

### Global Confidence Indicator

11. **Summary stats** above the table (in a row of small GlassCards):
    - **Total Models Ranked**: Count of models with at least 1 match.
    - **Total Matches**: Sum of all matches across all models (divided by 2 since each match involves two models).
    - **Active Languages**: Count of languages with at least one model.

12. **Low-data warning**: If the total matches globally is below a threshold (e.g., < 500), show a banner: "The leaderboard is still early. Rankings will become more reliable as more tests are completed."

### Table Interactions

13. **Row click**: Clicking a model row could expand to show details (defer to future — for MVP, no row expansion).

14. **Sticky header**: The table header row should stick to the top of the scrollable area so column names are always visible when scrolling through a long list.

15. **Empty state**: If no models have any matches, show: "No rankings yet. Be the first to run a blind test!" with a link to the Blind Test page.

## Non-Goals (Out of Scope)

- Model detail pages (e.g., `/leaderboard/model/:id` with full match history).
- Rating trend charts (line graph of ELO over time per model).
- Head-to-head comparison tool (pick two models and see their matchup stats).
- Export of the leaderboard to CSV (admin-only analytics in PRD 13 covers this).
- Real-time updates (leaderboard refreshes on page load, not via WebSocket).

## Design Considerations

- The leaderboard should feel authoritative and clean — like a sports league standings table.
- The top 3 models could have subtle accent styling (gold/silver/bronze accents on the rank number or a small trophy icon).
- The provisional badge should be noticeable but not alarming — orange accent, small size.
- The summary stats cards above the table provide at-a-glance context.
- Use alternating row backgrounds for readability (`bg-white/[0.02]` and `bg-white/[0.05]`).

## Technical Considerations

- **Server-side rendering**: The leaderboard page should use React Server Components to fetch data and render the table server-side. This ensures fast initial load and good SEO (if relevant).

- **Caching / ISR**: The leaderboard data does not need to be real-time. Use Next.js ISR (Incremental Static Regeneration) with `revalidate: 300` (5 minutes) or SWR on the client to re-fetch periodically. This avoids hitting the database on every page view.

- **Query for global leaderboard**:
  ```typescript
  const { data } = await supabase
    .from('elo_ratings_global')
    .select(`
      rating, matches_played, wins, losses, last_updated,
      model:models!inner(
        id, name, gender, tags, is_active,
        provider:providers!inner(name, slug, is_active)
      )
    `)
    .eq('model.is_active', true)
    .eq('model.provider.is_active', true)
    .order('rating', { ascending: false });
  ```

- **Query for per-language leaderboard**: Same pattern but from `elo_ratings_by_language` with a `language_id` filter.

- **Client-side search**: Since the leaderboard is typically < 200 rows, the search filter can work client-side by filtering the already-loaded data array. No additional database query needed.

- **Date range filter**: Computing stats within a date range requires querying `test_events` and re-aggregating. This is an expensive query. For MVP, either defer this filter or use a materialized view / pre-computed daily snapshot table. Recommendation: defer.

## Success Metrics

- The leaderboard page loads in < 1 second (server-rendered, cached).
- Users visit the leaderboard page after their first Blind Test session (conversion tracking).
- The per-language filter is used by at least 30% of leaderboard visitors.
- Provisional models are clearly distinguishable from established models (qualitative user feedback).

## Open Questions

1. Should the leaderboard be accessible without authentication (public page)? Recommendation: yes — make it public to attract new users and demonstrate value. Only Blind Test and My Results require login.
2. Should we show the ELO change since the last period (e.g., +12 or -5 in the last 24 hours)? Recommendation: defer — requires rating history tracking which is not in MVP.
3. Should the top 3 models have special visual treatment (trophy icons, gold/silver/bronze)? Recommendation: yes — small touch, big impact on visual appeal.
4. Should the minimum matches threshold (30) for the "provisional" label be configurable by admin? Recommendation: hardcode for MVP.

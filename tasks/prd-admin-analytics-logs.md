# PRD 13: Admin -- Analytics and Test Log Viewer

## Introduction / Overview

Admins need visibility into how TTS Arena is being used: how many tests are run per day, which providers are failing, what the median generation latency is, and the ability to inspect any individual test event in detail. This PRD covers the admin-only analytics dashboard and the test log viewer with full querying, filtering, and CSV export capabilities.

This is the admin's operational command center — it enables data-driven decisions about which providers to keep, which models to deactivate, and whether the platform is healthy.

## Goals

1. Provide a test log viewer with powerful filtering and full row detail.
2. Display key analytics metrics (tests per day, error rates, latency, matchup distribution).
3. Support CSV export of filtered test logs.
4. Ensure all data access is admin-only (RBAC-protected).

## User Stories

- **As an admin**, I want to see how many tests are being run per day so I can track platform growth.
- **As an admin**, I want to query test logs by user, provider, model, language, or date so I can investigate issues.
- **As an admin**, I want to see the full detail of any test event — who voted, what sentence, which models, listen times, audio links, ELO changes — so I can audit suspicious activity.
- **As an admin**, I want to see error rates and latency per provider so I can identify underperforming providers.
- **As an admin**, I want to export test logs to CSV for offline analysis or reporting.

## Functional Requirements

### Test Log Viewer (`/admin/logs`)

1. **Log table** (GlassTable, paginated, 50 rows per page):
   - Columns:
     - **Timestamp** (`voted_at`, formatted).
     - **User** (user email or anonymized ID, depending on privacy settings).
     - **Language** (language name).
     - **Sentence** (truncated text, with tooltip for full).
     - **Model A** (model name + provider).
     - **Model B** (model name + provider).
     - **Winner** (model name, highlighted green).
     - **Loser** (model name, highlighted red).
     - **Status** (completed / pending / invalid, as GlassBadge).
   - Sortable by timestamp (default: newest first), status.
   - Clicking a row expands or opens a detail panel.

2. **Row detail** (expanded view or side panel):
   - Full sentence text.
   - User ID / email.
   - Language code and name.
   - Model A: name, provider, model ID, ELO before, ELO after.
   - Model B: name, provider, model ID, ELO before, ELO after.
   - Audio A: play button (generates signed URL on demand) + generation latency.
   - Audio B: play button + generation latency.
   - Listen time A (ms) and Listen time B (ms).
   - Is Valid flag.
   - Created at and Voted at timestamps.
   - Provider request IDs (for debugging provider issues).

3. **Filter bar** at the top:
   - **User ID / Email**: Text input (search by partial match).
   - **Provider**: Dropdown (all providers).
   - **Model/Voice**: Dropdown (dependent on provider selection).
   - **Language**: Dropdown.
   - **Sentence ID**: Text input (for exact lookups).
   - **Status**: Dropdown (All / Completed / Pending / Invalid).
   - **Winner/Loser**: Dropdown of models — filter to events where a specific model won or lost.
   - **Date Range**: From and To date pickers.
   - **Apply** and **Clear** buttons.
   - Filters stored in URL query params.

4. **Quick filter shortcuts**: Clickable links for common queries:
   - "Invalid rounds" (status = invalid).
   - "Last 24 hours" (date range = today).
   - "Suspicious votes" (listen_time_a_ms < 3000 OR listen_time_b_ms < 3000).

### CSV Export

5. **Export button**: "Export CSV" GlassButton in the filter bar.
   - Exports the currently filtered dataset.
   - CSV columns: `test_event_id`, `timestamp`, `user_id` (or anonymized), `language`, `sentence_text`, `model_a_name`, `model_a_provider`, `model_b_name`, `model_b_provider`, `winner_name`, `loser_name`, `listen_time_a_ms`, `listen_time_b_ms`, `elo_before_winner`, `elo_after_winner`, `elo_before_loser`, `elo_after_loser`, `status`, `generation_latency_a_ms`, `generation_latency_b_ms`.
   - Maximum export: 100,000 rows. If the filtered result exceeds this, show a warning and suggest narrowing filters.
   - RBAC: Only admins can export. The Server Action verifies admin role before generating.

6. **User anonymization in exports**: A toggle switch labeled "Anonymize User IDs" (default: on). When enabled, user IDs in the CSV are replaced with a hash (e.g., `user_a1b2c3`). When off, actual user emails are included. The toggle state is stored in the admin's session/localStorage.

### Analytics Panels (`/admin/analytics`)

7. **Tests per day**: A stat card or simple bar chart showing the number of completed tests per day for the last 30 days.
   - Data source: `SELECT DATE(voted_at) as day, COUNT(*) FROM test_events WHERE status = 'completed' GROUP BY day ORDER BY day DESC LIMIT 30`.
   - Display: For MVP, a simple table of dates and counts inside a GlassCard. A bar chart (using a lightweight library like `recharts` or just CSS bars) is preferred but optional.

8. **Completion rate**: Stat card showing:
   - Total rounds created (all test events).
   - Total rounds completed (status = 'completed').
   - Completion rate: `completed / total * 100%`.
   - Display as a large number with a subtitle: e.g., "94.2% completion rate (12,340 / 13,102 rounds)".

9. **Median generation latency**: Stat cards grouped by provider:
   - For each active provider, show the median `generation_latency_ms` from `audio_files` WHERE the model belongs to that provider.
   - Highlight providers with median latency > 5 seconds in orange.
   - Data source: Query `audio_files` joined to `models` and `providers`, grouped by provider.

10. **Error rates by provider/model**: Table showing:
    - Provider name.
    - Total attempts (test events involving this provider's models).
    - Invalid rounds (test events with `status = 'invalid'` involving this provider).
    - Error rate: `invalid / total * 100%`.
    - Sort by error rate descending to highlight problematic providers.

11. **Matchup distribution**: A table showing the most common model pairings:
    - Columns: Model A, Model B, Total Matches, Model A Wins, Model B Wins.
    - Data source: `SELECT model_a_id, model_b_id, COUNT(*) as matches, SUM(CASE WHEN winner_id = model_a_id THEN 1 ELSE 0 END) as a_wins FROM test_events WHERE status = 'completed' GROUP BY model_a_id, model_b_id ORDER BY matches DESC LIMIT 50`.
    - This helps admins verify that matchmaking is distributing matches fairly.

### Admin Audit Log Viewer (`/admin/audit-log`)

12. **Audit log table**: GlassTable showing recent admin actions:
    - Columns: Timestamp, Admin (email), Action, Entity Type, Entity ID, Details.
    - Paginated, newest first.
    - Filter by admin, action type, entity type, date range.
    - This is read-only — no modifications to audit logs.

## Non-Goals (Out of Scope)

- Real-time analytics dashboards (auto-refreshing charts).
- Advanced charting library integration (defer complex visualizations).
- User behavior analytics (funnel analysis, session duration, etc.).
- Automated alerts/notifications (e.g., Slack alerts when error rate spikes).
- Aggregate CSV export of analytics metrics (only raw test logs are exportable).

## Design Considerations

- The analytics page should lead with summary stat cards at the top (4-5 cards in a row: Total Tests, Completion Rate, Active Models, Active Users, Avg Latency).
- Below the stat cards, the more detailed panels (tests per day, error rates, matchup distribution).
- The test log viewer is a separate page (`/admin/logs`) with a dense, information-rich table optimized for scanning.
- Use subtle color coding: green for completed, orange for pending, red for invalid.
- The filter bar on the log viewer should be prominent and easy to use — this is the admin's primary tool for investigation.

## Technical Considerations

- **Analytics queries**: The summary stats and per-day counts can be expensive on large datasets. For MVP, run them as direct SQL queries. If performance becomes an issue (> 100K test events), add a materialized view or a daily aggregation cron job that populates a `daily_stats` table.

- **Test log pagination**: Use cursor-based pagination (keyset pagination on `voted_at` + `id`) instead of `OFFSET` for better performance on large datasets. The URL stores the cursor: `?cursor=2026-02-12T10:00:00Z_uuid`.

- **CSV generation for large exports**: For exports > 10,000 rows, consider streaming the CSV via a ReadableStream in the API route rather than buffering the entire file in memory.

- **Median latency calculation**: Postgres `percentile_cont(0.5) WITHIN GROUP (ORDER BY generation_latency_ms)` can compute the median efficiently.

- **Admin-only**: All routes under `/admin/logs` and `/admin/analytics` are protected by middleware (PRD 04) and RLS (PRD 03). The analytics queries use the admin's Supabase session, which RLS allows to read all test events.

- **Chart library**: If implementing charts, use `recharts` (React-based, ~45 KB gzipped) or simple CSS-based bar charts for MVP. Do not add heavy charting libraries.

## Success Metrics

- An admin can find a specific test event within 3 clicks (page load + apply filters + scan table).
- CSV export of 10,000 rows completes in < 5 seconds.
- Analytics panels load in < 2 seconds.
- The matchup distribution table reveals any matchmaking imbalances within the first week of usage.
- Error rates by provider are accurate and match real-world observation.

## Open Questions

1. Should the analytics page auto-refresh (e.g., every 60 seconds)? Recommendation: no for MVP — manual refresh is fine. Add auto-refresh toggle later.
2. Should we implement a "suspicious activity" report that automatically flags users with anomalous patterns? Recommendation: defer to PRD 14 (Security). This PRD provides the raw data; security PRD defines the flagging logic.
3. Should the matchup distribution be visualizable as a heatmap? Recommendation: a table is fine for MVP. Heatmap can be added later.
4. Should we add a "replay test" feature that lets an admin re-experience a test event as the user saw it? Recommendation: interesting but defer — the detail view with audio replay covers the core need.

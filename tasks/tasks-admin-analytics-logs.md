# Tasks: Admin — Analytics and Test Log Viewer (PRD 13)

Implementation tasks for admin analytics dashboard, test log viewer with filtering, row detail, and CSV export.

---

## Relevant Files

- `src/app/admin/logs/page.tsx` - Test log viewer page.
- `src/app/admin/logs/page-client.tsx` - Client component for filters, pagination, row expansion.
- `src/app/admin/logs/actions.ts` - Server Actions for log data, signed URLs, CSV export.
- `src/app/admin/analytics/page.tsx` - Analytics dashboard page.
- `src/app/admin/analytics/actions.ts` - Server Actions for analytics queries.
- `src/app/admin/audit-log/page.tsx` - Admin audit log viewer.
- `src/app/admin/audit-log/actions.ts` - Server Actions for audit log.
- `src/app/admin/page.tsx` - Add links to Logs, Analytics, Audit Log.
- `src/components/ui/glass-table.tsx` - GlassTable.
- `src/components/ui/glass-card.tsx` - GlassCard.
- `src/components/ui/glass-badge.tsx` - GlassBadge.
- `src/types/database.ts` - Database types.

### Notes

- All routes admin-only (middleware + RLS).
- Cursor-based pagination for logs (keyset on voted_at + id).
- CSV export: max 100,000 rows, anonymize toggle.
- Chart: recharts or CSS bars for tests per day.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/admin-analytics-logs`)
- [x] 1.0 Test log viewer (/admin/logs)
  - [x] 1.1 Create page with GlassTable: Timestamp, User, Language, Sentence, Model A, Model B, Winner, Loser, Status
  - [x] 1.2 Implement cursor-based pagination (50 rows per page)
  - [x] 1.3 Add filter bar: User ID/Email, Provider, Model, Language, Sentence ID, Status, Winner/Loser, Date Range
  - [x] 1.4 Store filters in URL query params
  - [x] 1.5 Add quick filter shortcuts: Invalid rounds, Last 24 hours, Suspicious votes
  - [x] 1.6 Row click expands detail panel: full sentence, user, models with ELO before/after, audio play buttons, listen times, timestamps
  - [x] 1.7 Add signed URL Server Action for audio replay in detail
- [x] 2.0 CSV export (test logs)
  - [x] 2.1 Add "Export CSV" button with anonymize toggle
  - [x] 2.2 Server Action: export filtered data, max 100K rows, columns per PRD
  - [x] 2.3 Anonymize user IDs when toggle on (hash with ANONYMIZATION_SALT)
- [x] 3.0 Analytics panels (/admin/analytics)
  - [x] 3.1 Create page with summary stat cards: Total Tests, Completion Rate, Active Models, Active Users
  - [x] 3.2 Tests per day: table or bar chart for last 30 days
  - [x] 3.3 Median generation latency by provider (highlight > 5s in orange)
  - [x] 3.4 Error rates by provider/model table
  - [x] 3.5 Matchup distribution table (top 50 model pairings)
- [x] 4.0 Admin audit log viewer (/admin/audit-log)
  - [x] 4.1 Create page with GlassTable: Timestamp, Admin, Action, Entity Type, Entity ID, Details
  - [x] 4.2 Add filters: admin, action type, entity type, date range
  - [x] 4.3 Paginated, newest first
- [x] 5.0 Admin nav and audit logging
  - [x] 5.1 Add Logs, Analytics, Audit Log links to admin dashboard
  - [x] 5.2 Ensure admin CRUD actions log to admin_audit_log (verify existing actions)

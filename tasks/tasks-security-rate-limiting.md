# Tasks: Security, Rate Limiting, and Observability (PRD 14)

Implementation tasks for vote rate limiting, API rate limiting, abuse detection, structured logging, and privacy controls.

---

## Relevant Files

- `src/app/blind-test/actions.ts` - Vote Server Action; add rate limit check.
- `src/lib/rate-limit/vote.ts` - Vote rate limiter (10 votes/min per user).
- `src/lib/rate-limit/api.ts` - General API rate limiting (optional middleware).
- `src/lib/logger.ts` - Structured JSON logger.
- `src/middleware.ts` - Optional rate limiting for API routes.
- `src/app/admin/providers/[providerId]/keys/actions.ts` - Verify API key security.
- `src/app/admin/logs/actions.ts` - Anonymization for CSV export.
- `.env.local.example` - Document server-only vs public env vars.

### Notes

- Vote rate limit: Option A (database query) per PRD recommendation.
- Logger: thin wrapper around console, JSON format.
- Sensitive data: never log API keys, full emails (truncate).

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/security-rate-limiting`)
- [x] 1.0 Vote rate limiting
  - [x] 1.1 In submitVote: before process_vote, query COUNT of user's completed test_events in last 60 seconds
  - [x] 1.2 If count >= 10: return HTTP 429 / error "Too many votes. Please slow down."
  - [x] 1.3 Add listen time validation: reject if listenTimeAMs or listenTimeBMs is 0 or negative
  - [x] 1.4 Log warning if either listen time < 3000ms
- [x] 2.0 Structured logging
  - [x] 2.1 Create src/lib/logger.ts with log levels (error, warn, info, debug)
  - [x] 2.2 Output structured JSON: level, message, timestamp, and optional context
  - [x] 2.3 Never include API keys, passwords, full emails (truncate to first 3 chars + domain)
  - [x] 2.4 Replace console.log/warn/error in vote flow with logger
- [x] 3.0 Abuse detection (periodic)
  - [x] 3.1 Create src/app/api/cron/abuse-check/route.ts with CRON_SECRET auth
  - [x] 3.2 Query users with > 50% votes where listen_time < 3000ms
  - [x] 3.3 Query users with > 100 votes per hour sustained
  - [x] 3.4 Query users who always vote same position (> 90% over 50+ votes)
  - [x] 3.5 Insert abuse_flag entries into admin_audit_log
  - [x] 3.6 Add cron to vercel.json
- [x] 4.0 Environment and documentation
  - [x] 4.1 Create/update .env.local.example with all required vars, server-only vs public
  - [x] 4.2 Document ANONYMIZATION_SALT for CSV anonymization

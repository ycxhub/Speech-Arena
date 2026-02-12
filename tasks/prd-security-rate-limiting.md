# PRD 14: Security, Rate Limiting, and Observability

## Introduction / Overview

TTS Arena handles sensitive data (API keys for paid TTS services), user-generated data (votes), and admin-privileged operations. This PRD defines the security hardening, rate limiting, abuse prevention, audit logging, structured logging, error tracking, and privacy controls needed to keep the platform trustworthy and resilient.

This is a cross-cutting concern — the requirements here apply across all other PRDs and should be considered during implementation of every feature.

## Goals

1. Prevent automated abuse (bots spamming votes to manipulate rankings).
2. Protect API keys with encryption at rest and strict server-only access.
3. Enforce RBAC at every layer (middleware, RLS, Server Actions).
4. Log all admin actions for accountability.
5. Implement structured logging and error tracking for operational visibility.
6. Provide basic privacy controls for user data in exports.

## User Stories

- **As a platform operator**, I want confidence that bots cannot spam votes to artificially boost or tank a model's rating.
- **As a platform operator**, I want to know that TTS provider API keys are encrypted and never exposed to the browser.
- **As an admin**, I want an audit trail of every admin action so that privileged operations are accountable.
- **As a developer**, I want structured logs so I can debug production issues quickly.
- **As a user**, I want my data handled responsibly, with anonymization options for any exports.

## Functional Requirements

### Rate Limiting

1. **Vote rate limiting**: Maximum 10 votes per user per minute. Enforced server-side in the vote Server Action.
   - Implementation: Use a simple in-memory rate limiter or a Supabase-backed counter.
   - Approach: Maintain a sliding window counter. On each vote:
     1. Count the user's completed test events in the last 60 seconds.
     2. If count >= 10, reject the vote with HTTP 429 ("Too many votes. Please slow down.").
   - The counter query: `SELECT COUNT(*) FROM test_events WHERE user_id = :userId AND voted_at > now() - interval '1 minute' AND status = 'completed'`.

2. **API route rate limiting**: Apply a general rate limit to all API routes using Vercel Edge Middleware or a lightweight rate-limiting library (e.g., `@upstash/ratelimit` with Vercel KV, or a simple custom implementation).
   - Limits:
     - Authenticated users: 100 requests per minute per user.
     - Unauthenticated requests: 20 requests per minute per IP.
   - Return HTTP 429 with a `Retry-After` header when exceeded.

3. **Admin API rate limiting**: Admin endpoints are less likely to be abused, but apply a generous limit of 200 requests per minute per admin to prevent accidental abuse (e.g., a runaway script).

### Abuse Detection

4. **Suspicious vote pattern detection**: A periodic check (can be part of the nightly verification job from PRD 10, or a separate cron) that flags users who:
   - Have > 50% of votes with `listen_time_a_ms < 3000` OR `listen_time_b_ms < 3000` (consistently voting without proper listening).
   - Have an abnormally high vote rate (> 100 votes per hour sustained).
   - Always vote for the same position (always "A" or always "B", > 90% of the time over 50+ votes — suggests random clicking).

5. **Flagging mechanism**: Suspicious users are logged in a new section of the admin dashboard (or a report accessible from the analytics page). No automatic ban — admins review and decide.
   - Store flags in a lightweight table or as entries in `admin_audit_log` with `action = 'abuse_flag'`.

6. **Server-side listen time verification**: The vote Server Action logs the client-reported listen times. While the server cannot verify actual audio playback, it can:
   - Reject votes where `listenTimeAMs` or `listenTimeBMs` is 0 or negative.
   - Log a warning if either is < 3000ms (should be prevented client-side, but log for monitoring).

### API Key Security

7. **Encryption at rest**: API keys stored in the `api_keys` table are encrypted using `pgp_sym_encrypt` from the `pgcrypto` extension (as detailed in PRD 06). The encryption secret is a Postgres runtime setting (`app.api_key_secret`), NOT stored in the database itself.

8. **Server-only access**: The `api_keys` table has RLS policies that deny all access except to the `service_role`. Application code that needs to decrypt keys uses the Supabase service role client, which is only available in server-side code (Server Actions, API routes).

9. **No client exposure**: API keys are never included in any API response, Server Component render, or client-side state. The `SUPABASE_SERVICE_ROLE_KEY` and `API_KEY_ENCRYPTION_SECRET` environment variables are server-only (no `NEXT_PUBLIC_` prefix).

10. **Key rotation**: Covered in PRD 06. The rotation workflow ensures zero downtime when replacing keys.

### RBAC Enforcement

11. **Three-layer protection**:
    - **Layer 1: Next.js Middleware** (`src/middleware.ts`) — Redirects unauthenticated users away from protected routes and non-admin users away from `/admin/*` routes. This is the first line of defense.
    - **Layer 2: Server Actions** — Every Server Action that performs admin operations re-checks the user's role before executing. This catches edge cases where middleware might be bypassed.
    - **Layer 3: Supabase RLS** — Database-level policies enforce that even direct Supabase queries respect role boundaries. This is the final safety net.

12. All three layers must agree. If any layer rejects, the operation fails.

### Audit Logging

13. **Admin audit log** (`admin_audit_log` table):
    - Every admin CRUD operation logs: `admin_id`, `action`, `entity_type`, `entity_id`, `details` (JSON with before/after values where applicable), `created_at`.
    - Actions logged include: create/update/delete for languages, sentences, providers, models, API keys; user role changes; data exports.
    - The audit log is append-only — rows are never updated or deleted.
    - Accessible via the Admin Audit Log viewer (PRD 13).

14. **Audit log for exports**: When an admin exports CSV data (test logs, user results), log the export action with details: filter parameters, row count, whether user IDs were anonymized.

### Structured Logging

15. **Log format**: All server-side logs use structured JSON format:
    ```json
    {
      "level": "info",
      "message": "Vote submitted",
      "timestamp": "2026-02-12T10:30:00Z",
      "userId": "uuid",
      "testEventId": "uuid",
      "winner": "A",
      "listenTimeAMs": 4200,
      "listenTimeBMs": 5100
    }
    ```

16. **Log levels**: Use standard levels: `error`, `warn`, `info`, `debug`.
    - `error`: Unexpected failures (provider API errors, database errors, unhandled exceptions).
    - `warn`: Suspicious activity, rate limit hits, degraded performance.
    - `info`: Normal operations (votes, round preparations, admin actions).
    - `debug`: Verbose details for development (query parameters, response shapes).

17. **Logger utility**: Create `src/lib/logger.ts` — a thin wrapper around `console.log`/`console.error` that adds JSON structure. For MVP, this is sufficient. Upgrade to `pino` if more features are needed later.

18. **Sensitive data exclusion**: Logs must NEVER include: API keys, passwords, full user emails (truncate to first 3 chars + domain), or audio file contents.

### Error Tracking

19. **Vercel built-in**: Vercel automatically captures function errors and displays them in the Vercel dashboard. This is the primary error tracking for MVP.

20. **Optional Sentry integration**: If deeper error tracking is needed (stack traces, breadcrumbs, user context), add `@sentry/nextjs`. This is OPTIONAL for MVP — document the integration path but do not require it for launch.

21. **Error boundaries**: React error boundaries at the layout level (PRD 02) catch client-side rendering errors and display a friendly error message. Errors are logged to the console (and Sentry if configured).

### Privacy Controls

22. **User ID anonymization in exports**: As specified in PRD 13, CSV exports have an "Anonymize User IDs" toggle. When enabled:
    - User UUIDs are replaced with a deterministic hash (e.g., `SHA-256(userId + salt)` truncated to 8 chars) so that the same user has the same anonymized ID across exports (useful for analysis) but the real ID is not revealed.
    - The salt is a server-side environment variable (`ANONYMIZATION_SALT`).

23. **Data retention**: For MVP, no automatic data deletion. Document a recommended data retention policy:
    - Test events: retained indefinitely (needed for ELO integrity).
    - Audio files in R2: retained indefinitely (needed for replay).
    - Audit logs: retained indefinitely.
    - Future: add a data retention cron that deletes audio files older than X months and anonymizes test events older than Y months.

24. **No PII in audio**: Audio files stored in R2 do not contain personally identifiable information (they are TTS-generated speech of generic sentences). No special PII handling needed for audio.

### Environment Variable Security

25. **Required server-only env vars** (no `NEXT_PUBLIC_` prefix):
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `R2_ACCESS_KEY_ID`
    - `R2_SECRET_ACCESS_KEY`
    - `API_KEY_ENCRYPTION_SECRET`
    - `ANONYMIZATION_SALT`

26. **Required public env vars** (safe for client):
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `NEXT_PUBLIC_APP_URL`

27. **`.env.local.example`** must list all variables with clear comments about which are server-only vs. public.

## Non-Goals (Out of Scope)

- Web Application Firewall (WAF) or DDoS protection (rely on Vercel's built-in protections).
- CAPTCHA on sign-up or voting (can be added later if bot abuse is severe).
- GDPR-specific features (data deletion requests, consent management) — defer to post-MVP.
- Penetration testing or security audit (recommended before production launch but not part of this PRD).
- SOC 2 compliance or similar certifications.

## Design Considerations

- Rate limit error messages should be user-friendly: "You're voting too fast! Please wait a moment and try again."
- The abuse flag report in the admin dashboard should be a simple table — not a complex investigation tool.
- Audit log entries should be human-readable in the admin UI (action descriptions, not just raw codes).

## Technical Considerations

- **Rate limiting implementation options**:
  - **Option A (simplest)**: Query `test_events` in the vote Server Action (as described in requirement 1). No additional infrastructure.
  - **Option B (better)**: Use `@upstash/ratelimit` with Vercel KV (serverless Redis). More robust, handles edge cases (distributed rate limiting across function instances), but adds a dependency.
  - **Recommendation**: Start with Option A. Switch to Option B if the app scales beyond a single Vercel region.

- **Middleware performance**: The RBAC middleware runs on every request. Keep it fast:
  - For non-admin routes: just refresh the session (handled by `@supabase/ssr`).
  - For admin routes: refresh session + query `profiles.role`. Cache the role in the session cookie or a short-lived in-memory cache if needed.

- **pgcrypto encryption**: The `pgp_sym_encrypt` / `pgp_sym_decrypt` functions use AES-256 by default. The encryption secret should be at least 32 characters.

- **Audit log write performance**: Audit log inserts should be fire-and-forget (do not await the insert before returning the admin action response). Use `void supabase.from('admin_audit_log').insert(...)` or a background queue.

## Success Metrics

- Zero incidents of bot-manipulated rankings (measured by absence of anomalous vote patterns).
- 100% of admin actions are logged in the audit log.
- API keys are never visible in client-side network requests, browser memory, or logs.
- Rate limiting correctly blocks > 10 votes/minute with a user-friendly error.
- Structured logs are searchable in the Vercel dashboard and contain sufficient context for debugging.

## Open Questions

1. Should we implement CAPTCHA as an additional abuse prevention layer? Recommendation: defer — rate limiting + listen-time enforcement should be sufficient for MVP.
2. Should we use Vercel KV (`@upstash/ratelimit`) from the start for production-grade rate limiting? Recommendation: start simple (database query), upgrade if needed.
3. Should the anonymization salt be rotatable? Recommendation: yes in theory, but for MVP a fixed salt is fine. Document the rotation process for later.
4. Should we implement account lockout after too many failed login attempts? Recommendation: Supabase Auth has built-in brute force protection. Verify it's enabled in the Supabase dashboard settings.

# PRD 03: Database Schema and Data Models

## Introduction / Overview

This PRD defines the complete Supabase Postgres database schema for TTS Arena. Every table, relationship, index, and Row-Level Security (RLS) policy is specified here so that all other PRDs can reference a single source of truth for data modeling.

The schema must support: user management and roles, multilingual sentence banks, TTS provider/model/voice catalogs, encrypted API keys, test events (the core battle log), audio file metadata, ELO ratings (global and per-language), and admin audit logs.

## Goals

1. Define every database table, column, type, default, and constraint needed by TTS Arena.
2. Specify all foreign key relationships and indexes for common query patterns.
3. Define RLS policies for each table to enforce role-based access at the database level.
4. Provide the migration SQL so a developer can run it against a fresh Supabase project and have the full schema ready.
5. Establish the pattern for auto-generating TypeScript types from the schema.

## User Stories

- **As a developer**, I want a clearly documented schema so I know exactly which tables exist and how they relate before writing any queries.
- **As a developer**, I want RLS policies pre-configured so I cannot accidentally expose admin-only data to standard users.
- **As an admin**, I want audit logs for every action I take so there is accountability.
- **As the system**, I need indexes on frequently filtered columns (e.g., `test_events.user_id`, `elo_ratings.language_id`) so queries stay fast as data grows.

## Functional Requirements

### Tables

#### 1. `profiles` (extends `auth.users`)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, FK → `auth.users.id`, ON DELETE CASCADE | Same as Supabase auth user ID |
| `email` | `text` | NOT NULL | Copied from auth for easy querying |
| `display_name` | `text` | | Optional display name |
| `role` | `text` | NOT NULL, DEFAULT `'user'`, CHECK (`role` IN ('user', 'admin')) | User role |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

#### 2. `languages`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `code` | `text` | NOT NULL, UNIQUE | ISO 639-1 code (e.g., `en`, `es`, `hi`) |
| `name` | `text` | NOT NULL | Display name (e.g., "English", "Spanish") |
| `is_active` | `boolean` | NOT NULL, DEFAULT `true` | Can be deactivated |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

#### 3. `sentences`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `language_id` | `uuid` | NOT NULL, FK → `languages.id` | |
| `text` | `text` | NOT NULL | The sentence content |
| `version` | `integer` | NOT NULL, DEFAULT `1` | Incremented on edits |
| `is_active` | `boolean` | NOT NULL, DEFAULT `true` | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

#### 4. `sentence_versions` (history tracking)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `sentence_id` | `uuid` | NOT NULL, FK → `sentences.id` ON DELETE CASCADE | |
| `text` | `text` | NOT NULL | The sentence text at this version |
| `version` | `integer` | NOT NULL | Version number |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `created_by` | `uuid` | FK → `profiles.id` | Admin who made the edit |

#### 5. `providers`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `name` | `text` | NOT NULL, UNIQUE | e.g., "ElevenLabs", "Google Cloud TTS" |
| `slug` | `text` | NOT NULL, UNIQUE | URL-safe identifier |
| `base_url` | `text` | | API base URL |
| `is_active` | `boolean` | NOT NULL, DEFAULT `true` | Deactivation removes from matchmaking |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

#### 6. `models` (voices/models per provider)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `provider_id` | `uuid` | NOT NULL, FK → `providers.id` ON DELETE CASCADE | |
| `name` | `text` | NOT NULL | Display name |
| `model_id` | `text` | NOT NULL | Provider-specific model identifier |
| `gender` | `text` | NOT NULL, CHECK (`gender` IN ('male', 'female', 'neutral')) | Voice gender |
| `tags` | `text[]` | DEFAULT `'{}'` | e.g., `{"neural", "fast", "premium"}` |
| `is_active` | `boolean` | NOT NULL, DEFAULT `true` | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Unique constraint:** `(provider_id, model_id)`.

#### 7. `model_languages` (junction: which models support which languages)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `model_id` | `uuid` | NOT NULL, FK → `models.id` ON DELETE CASCADE | |
| `language_id` | `uuid` | NOT NULL, FK → `languages.id` ON DELETE CASCADE | |

**Primary key:** `(model_id, language_id)`.

#### 8. `api_keys`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `provider_id` | `uuid` | NOT NULL, FK → `providers.id` ON DELETE CASCADE | |
| `key_name` | `text` | NOT NULL | Friendly label (e.g., "Production Key 1") |
| `encrypted_key` | `text` | NOT NULL | Encrypted via `pgcrypto` |
| `status` | `text` | NOT NULL, DEFAULT `'active'`, CHECK (`status` IN ('active', 'deprecated', 'revoked')) | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

#### 9. `audio_files`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `model_id` | `uuid` | NOT NULL, FK → `models.id` | |
| `sentence_id` | `uuid` | NOT NULL, FK → `sentences.id` | |
| `r2_key` | `text` | NOT NULL, UNIQUE | Object key in Cloudflare R2 |
| `file_size_bytes` | `integer` | | |
| `duration_ms` | `integer` | | Audio duration in milliseconds |
| `generation_latency_ms` | `integer` | | Time to generate via provider API |
| `provider_request_id` | `text` | | Request ID from provider (for debugging) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Unique constraint:** `(model_id, sentence_id)` — one audio per model-sentence pair (cache key).

#### 10. `test_events` (core battle log)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `user_id` | `uuid` | NOT NULL, FK → `profiles.id` | |
| `sentence_id` | `uuid` | NOT NULL, FK → `sentences.id` | |
| `language_id` | `uuid` | NOT NULL, FK → `languages.id` | |
| `model_a_id` | `uuid` | NOT NULL, FK → `models.id` | |
| `model_b_id` | `uuid` | NOT NULL, FK → `models.id` | |
| `audio_a_id` | `uuid` | NOT NULL, FK → `audio_files.id` | |
| `audio_b_id` | `uuid` | NOT NULL, FK → `audio_files.id` | |
| `winner_id` | `uuid` | FK → `models.id` | NULL if invalid/skipped |
| `loser_id` | `uuid` | FK → `models.id` | NULL if invalid/skipped |
| `listen_time_a_ms` | `integer` | | Client-reported listen time for clip A |
| `listen_time_b_ms` | `integer` | | Client-reported listen time for clip B |
| `is_valid` | `boolean` | NOT NULL, DEFAULT `true` | False if round was invalid (error, etc.) |
| `status` | `text` | NOT NULL, DEFAULT `'pending'`, CHECK (`status` IN ('pending', 'completed', 'invalid')) | |
| `elo_before_winner` | `real` | | Snapshot of winner's ELO before update |
| `elo_before_loser` | `real` | | Snapshot of loser's ELO before update |
| `elo_after_winner` | `real` | | Winner's ELO after update |
| `elo_after_loser` | `real` | | Loser's ELO after update |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | When round was created |
| `voted_at` | `timestamptz` | | When user voted |

#### 11. `elo_ratings_global`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `model_id` | `uuid` | NOT NULL, UNIQUE, FK → `models.id` ON DELETE CASCADE | |
| `rating` | `real` | NOT NULL, DEFAULT `1500` | Current global ELO |
| `matches_played` | `integer` | NOT NULL, DEFAULT `0` | |
| `wins` | `integer` | NOT NULL, DEFAULT `0` | |
| `losses` | `integer` | NOT NULL, DEFAULT `0` | |
| `last_updated` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

#### 12. `elo_ratings_by_language`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `model_id` | `uuid` | NOT NULL, FK → `models.id` ON DELETE CASCADE | |
| `language_id` | `uuid` | NOT NULL, FK → `languages.id` ON DELETE CASCADE | |
| `rating` | `real` | NOT NULL, DEFAULT `1500` | |
| `matches_played` | `integer` | NOT NULL, DEFAULT `0` | |
| `wins` | `integer` | NOT NULL, DEFAULT `0` | |
| `losses` | `integer` | NOT NULL, DEFAULT `0` | |
| `last_updated` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Unique constraint:** `(model_id, language_id)`.

#### 13. `admin_audit_log`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `admin_id` | `uuid` | NOT NULL, FK → `profiles.id` | |
| `action` | `text` | NOT NULL | e.g., `create_sentence`, `delete_provider`, `rotate_key` |
| `entity_type` | `text` | NOT NULL | Table name affected |
| `entity_id` | `uuid` | | ID of affected record |
| `details` | `jsonb` | | Additional context (old values, new values, etc.) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

### Indexes

14. The following indexes must be created for performance:
    - `test_events(user_id)` — for My Results queries.
    - `test_events(language_id)` — for filtering by language.
    - `test_events(created_at)` — for date range filters and analytics.
    - `test_events(model_a_id)` and `test_events(model_b_id)` — for matchup queries.
    - `test_events(winner_id)` — for win-rate calculations.
    - `sentences(language_id, is_active)` — for matchmaking sentence selection.
    - `models(provider_id, is_active)` — for matchmaking model selection.
    - `elo_ratings_global(rating DESC)` — for leaderboard sorting.
    - `elo_ratings_by_language(language_id, rating DESC)` — for per-language leaderboard.
    - `admin_audit_log(admin_id, created_at)` — for audit trail queries.

### Row-Level Security (RLS) Policies

15. RLS must be enabled on ALL tables. Policies:

    - **`profiles`:** Users can SELECT their own row. Admins can SELECT all. Users can UPDATE their own `display_name`. Admins can UPDATE any row's `role`.
    - **`languages`:** All authenticated users can SELECT active languages. Admins can INSERT, UPDATE, DELETE.
    - **`sentences`:** All authenticated users can SELECT active sentences. Admins can INSERT, UPDATE, DELETE.
    - **`sentence_versions`:** Admins can SELECT, INSERT.
    - **`providers`:** All authenticated users can SELECT active providers (needed for display). Admins can INSERT, UPDATE, DELETE.
    - **`models`:** All authenticated users can SELECT active models. Admins can INSERT, UPDATE, DELETE.
    - **`model_languages`:** All authenticated users can SELECT. Admins can INSERT, DELETE.
    - **`api_keys`:** Only admins can SELECT, INSERT, UPDATE, DELETE. Never exposed to client.
    - **`audio_files`:** All authenticated users can SELECT (needed to play audio). Only service role can INSERT.
    - **`test_events`:** Users can SELECT their own test events. Admins can SELECT all. Service role can INSERT and UPDATE.
    - **`elo_ratings_global`:** All authenticated users can SELECT. Only service role can INSERT, UPDATE.
    - **`elo_ratings_by_language`:** All authenticated users can SELECT. Only service role can INSERT, UPDATE.
    - **`admin_audit_log`:** Only admins can SELECT. Only service role can INSERT.

### TypeScript Types

16. After running migrations, generate TypeScript types via:
    ```bash
    npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
    ```
    This produces a `Database` type used by the Supabase client for type-safe queries.

### Migrations

17. All schema changes must be managed via Supabase CLI migrations:
    - `npx supabase migration new <name>` creates a timestamped SQL file in `supabase/migrations/`.
    - `npx supabase db push` applies migrations to the hosted project.
    - The initial migration should create all tables, indexes, RLS policies, and seed the `pgcrypto` extension.

## Non-Goals (Out of Scope)

- Seed data (languages, sentences, providers, models) — handled by their respective admin PRDs.
- Application-level query functions — each feature PRD defines its own data access patterns.
- Database backup and disaster recovery procedures — rely on Supabase's built-in backups.

## Design Considerations

- None — this PRD is purely backend/database.

## Technical Considerations

- Enable the `pgcrypto` extension (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`) for UUID generation and API key encryption.
- Use `gen_random_uuid()` for all primary key defaults.
- Use `timestamptz` (not `timestamp`) for all date/time columns to handle timezone-awareness.
- The `audio_files` table stores only R2 keys (not full URLs) — signed URLs are generated at read time by the application layer.
- The `test_events` table stores ELO snapshots (`elo_before_*`, `elo_after_*`) for audit purposes, so that ELO history can be reconstructed even if ratings are recomputed.
- The `profiles` table is populated via a Supabase trigger on `auth.users` insert (a database function that copies `id` and `email` to `profiles` on new user creation).

## Success Metrics

- All 13 tables are created successfully via migration.
- RLS policies prevent a standard user from reading `api_keys` or `admin_audit_log`.
- TypeScript types are generated and compile without errors.
- Foreign key constraints prevent orphaned records (e.g., cannot insert a `test_event` referencing a non-existent `model`).

## Open Questions

1. Should `test_events` include a `generation_cost` field to track per-round API cost? Recommendation: add it as a nullable `real` column for future use.
2. Should we add a `user_preferences` table (e.g., preferred language, test settings)? Recommendation: defer until needed; language selection can be stored in client state for now.
3. Should `sentence_versions` track the full diff or just the complete text at each version? Recommendation: store complete text (simpler, avoids diff computation).

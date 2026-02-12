# Tasks: Database Schema and Data Models (PRD 03)

## Relevant Files

- `supabase/migrations/20260212115120_initial_schema.sql` - Complete initial schema migration (tables, indexes, RLS policies).
- `src/types/database.ts` - Auto-generated Supabase TypeScript types.
- `package.json` - Contains `db:types` script for type generation.
- `supabase/config.toml` - Supabase CLI configuration.
- `src/lib/supabase/client.ts` - Browser client; ensure it uses the generated `Database` type.
- `src/lib/supabase/server.ts` - Server client; ensure it uses the generated `Database` type.

### Notes

- All schema changes must be managed via Supabase CLI migrations (`npx supabase migration new <name>`).
- Run `npx supabase db push` to apply migrations to the hosted project.
- Unit tests for database schema are typically integration tests (e.g., verifying RLS policies); consider adding these in a separate test setup.
- The `profiles` table is populated via a trigger on `auth.users` insert; no manual INSERT from the app.

### Manual steps for Task 5.0 (5.1 & 5.2)

To apply the migration and generate types, you need Supabase CLI access:

1. **Login:** `npx supabase login` (opens browser for auth)
2. **Link project:** `npx supabase link --project-ref kgikcglaxylxonlkqpsi`
3. **Push migration:** `npx supabase db push`
4. **Generate types:** `npm run db:types`

Alternatively, with Docker running: `npx supabase start`, then `npx supabase db reset`, then `npx supabase gen types typescript --local > src/types/database.ts`

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/03-database-schema`

- [x] 1.0 Set up migration infrastructure and extensions
  - [x] 1.1 Run `npx supabase migration new initial_schema` to create the initial migration file in `supabase/migrations/`
  - [x] 1.2 Add `CREATE EXTENSION IF NOT EXISTS pgcrypto;` at the top of the migration file (for UUID generation and API key encryption)
  - [x] 1.3 Create the `handle_new_user()` function that inserts into `profiles` (id, email from `auth.users`, role `'user'`, display_name `NULL`, timestamps) when a new row is added to `auth.users`. Place this and the trigger after the `profiles` table is created in the migration file.
  - [x] 1.4 Create a trigger on `auth.users` that fires `AFTER INSERT` and calls `handle_new_user()`

- [x] 2.0 Create all 13 database tables
  - [x] 2.1 Create `profiles` table (must exist before the auth trigger in task 1.4): id (PK, FK → auth.users.id ON DELETE CASCADE), email (NOT NULL), display_name, role (NOT NULL, DEFAULT 'user', CHECK IN ('user','admin')), created_at, updated_at (both timestamptz, NOT NULL, DEFAULT now())
  - [x] 2.2 Create `languages` table: id (PK, gen_random_uuid()), code (NOT NULL, UNIQUE), name (NOT NULL), is_active (NOT NULL, DEFAULT true), created_at, updated_at
  - [x] 2.3 Create `sentences` table: id, language_id (FK → languages.id), text (NOT NULL), version (NOT NULL, DEFAULT 1), is_active (NOT NULL, DEFAULT true), created_at, updated_at
  - [x] 2.4 Create `sentence_versions` table: id, sentence_id (FK → sentences.id ON DELETE CASCADE), text (NOT NULL), version (NOT NULL), created_at, created_by (FK → profiles.id)
  - [x] 2.5 Create `providers` table: id, name (NOT NULL, UNIQUE), slug (NOT NULL, UNIQUE), base_url, is_active (NOT NULL, DEFAULT true), created_at, updated_at
  - [x] 2.6 Create `models` table: id, provider_id (FK → providers.id ON DELETE CASCADE), name (NOT NULL), model_id (NOT NULL), gender (NOT NULL, CHECK IN ('male','female','neutral')), tags (text[] DEFAULT '{}'), is_active (NOT NULL, DEFAULT true), created_at, updated_at; add UNIQUE(provider_id, model_id)
  - [x] 2.7 Create `model_languages` table: model_id (FK → models.id ON DELETE CASCADE), language_id (FK → languages.id ON DELETE CASCADE); PRIMARY KEY (model_id, language_id)
  - [x] 2.8 Create `api_keys` table: id, provider_id (FK → providers.id ON DELETE CASCADE), key_name (NOT NULL), encrypted_key (NOT NULL), status (NOT NULL, DEFAULT 'active', CHECK IN ('active','deprecated','revoked')), created_at, updated_at
  - [x] 2.9 Create `audio_files` table: id, model_id (FK → models.id), sentence_id (FK → sentences.id), r2_key (NOT NULL, UNIQUE), file_size_bytes, duration_ms, generation_latency_ms, provider_request_id, created_at; add UNIQUE(model_id, sentence_id)
  - [x] 2.10 Create `test_events` table: id, user_id (FK → profiles.id), sentence_id (FK → sentences.id), language_id (FK → languages.id), model_a_id, model_b_id (FK → models.id), audio_a_id, audio_b_id (FK → audio_files.id), winner_id, loser_id (FK → models.id, nullable), listen_time_a_ms, listen_time_b_ms, is_valid (NOT NULL, DEFAULT true), status (NOT NULL, DEFAULT 'pending', CHECK IN ('pending','completed','invalid')), elo_before_winner, elo_before_loser, elo_after_winner, elo_after_loser (real), created_at, voted_at; add optional `generation_cost` (nullable real) for future use per PRD open question
  - [x] 2.11 Create `elo_ratings_global` table: id, model_id (NOT NULL, UNIQUE, FK → models.id ON DELETE CASCADE), rating (NOT NULL, DEFAULT 1500), matches_played, wins, losses (NOT NULL, DEFAULT 0), last_updated
  - [x] 2.12 Create `elo_ratings_by_language` table: id, model_id (FK → models.id ON DELETE CASCADE), language_id (FK → languages.id ON DELETE CASCADE), rating (NOT NULL, DEFAULT 1500), matches_played, wins, losses (NOT NULL, DEFAULT 0), last_updated; add UNIQUE(model_id, language_id)
  - [x] 2.13 Create `admin_audit_log` table: id, admin_id (FK → profiles.id), action (NOT NULL), entity_type (NOT NULL), entity_id (uuid), details (jsonb), created_at

- [x] 3.0 Create performance indexes
  - [x] 3.1 Create index on `test_events(user_id)` for My Results queries
  - [x] 3.2 Create index on `test_events(language_id)` for language filtering
  - [x] 3.3 Create index on `test_events(created_at)` for date range filters and analytics
  - [x] 3.4 Create indexes on `test_events(model_a_id)` and `test_events(model_b_id)` for matchup queries
  - [x] 3.5 Create index on `test_events(winner_id)` for win-rate calculations
  - [x] 3.6 Create index on `sentences(language_id, is_active)` for matchmaking sentence selection
  - [x] 3.7 Create index on `models(provider_id, is_active)` for matchmaking model selection
  - [x] 3.8 Create index on `elo_ratings_global(rating DESC)` for leaderboard sorting
  - [x] 3.9 Create index on `elo_ratings_by_language(language_id, rating DESC)` for per-language leaderboard
  - [x] 3.10 Create index on `admin_audit_log(admin_id, created_at)` for audit trail queries

- [x] 4.0 Define RLS policies for all tables
  - [x] 4.1 Enable RLS on all 13 tables with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  - [x] 4.2 Create `profiles` policies: users SELECT own row; admins SELECT all; users UPDATE own display_name only; admins UPDATE any row's role
  - [x] 4.3 Create `languages` policies: authenticated users SELECT where is_active = true (or admins SELECT all); admins INSERT, UPDATE, DELETE
  - [x] 4.4 Create `sentences` policies: authenticated users SELECT where is_active = true (or admins SELECT all); admins INSERT, UPDATE, DELETE
  - [x] 4.5 Create `sentence_versions` policies: admins only SELECT and INSERT
  - [x] 4.6 Create `providers` policies: authenticated users SELECT where is_active = true (or admins SELECT all); admins INSERT, UPDATE, DELETE
  - [x] 4.7 Create `models` policies: authenticated users SELECT where is_active = true (or admins SELECT all); admins INSERT, UPDATE, DELETE
  - [x] 4.8 Create `model_languages` policies: authenticated users SELECT; admins INSERT, DELETE
  - [x] 4.9 Create `api_keys` policies: admins only SELECT, INSERT, UPDATE, DELETE (never exposed to client)
  - [x] 4.10 Create `audio_files` policies: authenticated users SELECT; only service role can INSERT
  - [x] 4.11 Create `test_events` policies: users SELECT own events (user_id = auth.uid()); admins SELECT all; only service role INSERT and UPDATE
  - [x] 4.12 Create `elo_ratings_global` policies: authenticated users SELECT; only service role INSERT, UPDATE
  - [x] 4.13 Create `elo_ratings_by_language` policies: authenticated users SELECT; only service role INSERT, UPDATE
  - [x] 4.14 Create `admin_audit_log` policies: admins only SELECT; only service role INSERT

- [x] 5.0 Generate TypeScript types and verify migration
  - [x] 5.1 Run `npx supabase db push` to apply the migration to the hosted Supabase project (requires `supabase login` and `supabase link` — see manual steps below)
  - [x] 5.2 Run `npm run db:types` to generate types from the live schema (overwrites `src/types/database.ts`)
  - [x] 5.3 Verify the generated `Database` type in `src/types/database.ts` compiles without errors (`npm run build`)
  - [x] 5.4 Ensure `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` use the generated `Database` type when creating the Supabase client (e.g., `createBrowserClient<Database>(...)`)

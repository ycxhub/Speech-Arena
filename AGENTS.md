# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

TTS Arena (speecharena.org) — a Next.js 15 / React 19 app for crowd-sourced blind listening tests that rank TTS models via ELO ratings. Uses Supabase (PostgreSQL + Auth), Cloudflare R2 for audio storage, and external TTS provider APIs.

### Services

| Service | How to start | Notes |
|---|---|---|
| **Next.js dev server** | `npm run dev` | Main app on port 3000 |
| **Local Supabase** | `npx supabase start` | Requires Docker running (`sudo dockerd` if not already up). Ports: API 54321, DB 54322, Studio 54323, Mailpit 54324 |

### Running commands

Standard scripts are in `package.json`:
- **Dev server:** `npm run dev`
- **Lint:** `npm run lint` (ESLint 9)
- **Test:** `npm test` (Jest 30)
- **Build:** `npm run build`
- **Generate DB types:** `npm run db:types`

### Non-obvious caveats

- **Docker must be running** before `npx supabase start`. In this cloud environment, start Docker with `sudo dockerd &>/tmp/dockerd.log &` and fix socket permissions with `sudo chmod 666 /var/run/docker.sock`.
- **`.env.local`** must exist before starting the dev server. Copy from `.env.local.example` and fill in local Supabase credentials from `npx supabase status`. R2 credentials can be placeholders for local dev (audio generation will fail but app starts fine).
- **Pre-existing test failures:** 6 tests in `src/auth-source-contracts.test.ts` and `src/middleware.test.ts` fail because they expect admin-role checking in middleware, but the middleware delegates that to the page itself (see middleware comment: "Admin role check is handled by the page itself"). These are not caused by environment issues.
- **Supabase local email:** Email confirmation is disabled locally (`enable_confirmations = false` in `supabase/config.toml`), so sign-up works immediately. If it were enabled, use Mailpit at `http://127.0.0.1:54324` to view confirmation emails.
- **No seed data:** The local DB starts empty (no seed.sql). The Blind Test page will show "No languages available" until an admin adds languages/providers/models via `/admin`.

# PRD 01: Project Foundation and Tech Stack Setup

## Introduction / Overview

This PRD covers the initial scaffolding and infrastructure setup for TTS Arena — a web application that lets users run blind A/B tests of TTS (text-to-speech) voices from 25+ providers. Before any feature work begins, the project needs a solid foundation: a Next.js 15 application wired to Supabase (database + auth + storage), Cloudflare R2 (audio file storage), and deployed via Vercel from a GitHub repository.

This document defines the exact tech stack, folder structure, environment configuration, and deployment pipeline so that every subsequent PRD builds on a consistent base.

## Goals

1. Scaffold a working Next.js 15 App Router project with Tailwind CSS, deployable to Vercel with zero manual steps beyond merging to `main`.
2. Integrate the Supabase JS SDK (`@supabase/ssr`) for server-side and client-side usage.
3. Configure Cloudflare R2 with an S3-compatible client for audio file uploads and signed-URL generation.
4. Establish a clear folder structure, environment variable schema, and branch strategy that all future PRDs follow.
5. Ensure local development (`npm run dev`) and production deployment (`vercel`) both work end-to-end.

## User Stories

- **As a developer**, I want to clone the repo, run `npm install && npm run dev`, and see a working app on `localhost:3000` so I can start building features immediately.
- **As a developer**, I want a single `.env.local.example` file that documents every required environment variable so I never have to guess what config is missing.
- **As a DevOps engineer**, I want pushes to `main` to auto-deploy to Vercel so the team always has a live preview.
- **As a developer**, I want TypeScript types auto-generated from the Supabase schema so I get compile-time safety on all database queries.

## Functional Requirements

1. **Next.js 15 App Router project** initialized with `npx create-next-app@latest` using the following flags: `--typescript`, `--tailwind`, `--eslint`, `--app`, `--src-dir` (use `src/` prefix), `--import-alias "@/*"`.
2. **Tailwind CSS v4** configured with a custom theme extending the default:
   - Custom colors for the glassmorphism palette: `glass-bg` (rgba white with low opacity), pastel accents (`accent-blue`, `accent-green`, `accent-yellow`, `accent-orange`, `accent-purple`, `accent-red`).
   - A `backdrop-blur` utility class shortcut: `.glass` applying `backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg`.
3. **Inter font** loaded via `next/font/google` in the root layout (`src/app/layout.tsx`) and applied as the default body font.
4. **Supabase SDK** installed: `@supabase/supabase-js` and `@supabase/ssr`. Two utility files created:
   - `src/lib/supabase/client.ts` — browser client factory using `createBrowserClient`.
   - `src/lib/supabase/server.ts` — server client factory using `createServerClient` with cookie handling for Next.js App Router.
5. **Cloudflare R2 client** installed: `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`. Utility file created:
   - `src/lib/r2/client.ts` — S3-compatible client configured with R2 endpoint, access key, and secret from env vars.
   - `src/lib/r2/storage.ts` — helper functions: `uploadAudio(buffer, key)`, `getSignedUrl(key, expiresIn)`, `deleteAudio(key)`.
6. **Environment variable schema** documented in `.env.local.example`:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # Cloudflare R2
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET_NAME=
   R2_PUBLIC_URL=

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
7. **Folder structure** established:
   ```
   src/
   ├── app/                  # Next.js App Router pages and layouts
   │   ├── layout.tsx        # Root layout (Inter font, global styles)
   │   ├── page.tsx          # Landing / redirect to /blind-test
   │   ├── blind-test/       # Blind Test feature
   │   ├── my-results/       # My Results feature
   │   ├── leaderboard/      # Overall Leaderboard feature
   │   ├── admin/            # Admin Dashboard (protected)
   │   └── auth/             # Auth pages (sign-in, sign-up, etc.)
   ├── components/           # Shared UI components
   │   ├── ui/               # Primitive glassmorphism components
   │   └── layout/           # Shell, navigation, header
   ├── lib/                  # Utilities and business logic
   │   ├── supabase/         # Supabase client factories
   │   ├── r2/               # R2 storage helpers
   │   ├── elo/              # ELO rating logic
   │   ├── matchmaking/      # Matchmaking algorithm
   │   └── tts/              # TTS provider adapters
   ├── types/                # Shared TypeScript types
   │   └── database.ts       # Auto-generated Supabase types
   └── middleware.ts          # Next.js middleware (auth, RBAC)
   ```
8. **GitHub repository** initialized with:
   - `.gitignore` (Node + Next.js defaults, `.env.local`).
   - Branch strategy: `main` (production), feature branches named `feature/<prd-number>-<short-name>`.
9. **Vercel project** connected to the GitHub repo with:
   - Auto-deploy on push to `main`.
   - Preview deploys on pull requests.
   - Environment variables configured in Vercel dashboard (matching `.env.local.example`).
10. **Supabase CLI** installed as a dev dependency for local development and migration management:
    - `supabase init` run at project root to create `supabase/` config directory.
    - Script added to `package.json`: `"db:types": "supabase gen types typescript --project-id <project-id> > src/types/database.ts"`.

## Non-Goals (Out of Scope)

- Database schema creation (covered in PRD 03).
- Authentication implementation (covered in PRD 04).
- Any UI components beyond confirming the shell renders (covered in PRD 02).
- Actual TTS provider integration (covered in PRD 07).
- CI/CD pipelines beyond Vercel's built-in auto-deploy (no GitHub Actions for now).

## Design Considerations

- The root page (`/`) should display a minimal placeholder with the app name "TTS Arena" and a dark background, confirming Tailwind and the Inter font are working.
- No complex UI is expected at this stage — just proof that the stack is wired correctly.

## Technical Considerations

- **Next.js 15 App Router** is chosen for its Server Components (reduce client JS), Server Actions (simple form handling), and built-in streaming/suspense support.
- **Tailwind CSS** is preferred over a component library to maintain full control over the glassmorphism design system.
- **`@supabase/ssr`** is the official Next.js integration package. It handles cookie-based auth sessions for both Server Components and Route Handlers. Do NOT use the deprecated `@supabase/auth-helpers-nextjs`.
- **Cloudflare R2** is S3-compatible, so the standard AWS SDK v3 works. The R2 endpoint format is `https://<account-id>.r2.cloudflarestorage.com`. Signed URLs use the `@aws-sdk/s3-request-presigner` package.
- **TypeScript strict mode** should be enabled in `tsconfig.json` (`"strict": true`).
- **ESLint** with `next/core-web-vitals` config should be included from scaffolding.

## Success Metrics

- Running `npm run dev` locally renders the placeholder page with correct font and dark background.
- Running `npm run build` produces zero errors.
- Pushing to `main` triggers a successful Vercel deployment.
- Supabase client can connect (verified by a simple health-check query in a test Server Component).
- R2 client can upload a test file and generate a signed URL (verified manually or via a dev-only API route).

## Open Questions

1. Should we pin to a specific Next.js 15.x version, or use `latest`? Recommendation: pin to `15.x` stable at time of setup.
2. Should we set up a monorepo structure (e.g., Turborepo) for future scalability, or keep it as a single Next.js app? Recommendation: single app for MVP.
3. Should Supabase local development use Docker (`supabase start`) or connect directly to the hosted project? Recommendation: hosted project for simplicity, with option to add local later.

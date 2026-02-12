## Relevant Files

- `package.json` - Project dependencies and scripts (Next.js 15, Supabase SDK, AWS SDK for R2, Supabase CLI).
- `tsconfig.json` - TypeScript configuration with strict mode enabled.
- `next.config.ts` - Next.js configuration file.
- `tailwind.config.ts` - Tailwind CSS v4 configuration with custom glassmorphism theme.
- `.env.local.example` - Environment variable schema documentation for all required secrets/config.
- `src/app/layout.tsx` - Root layout with Inter font, global styles, and metadata.
- `src/app/page.tsx` - Landing placeholder page confirming stack is wired correctly.
- `src/lib/supabase/client.ts` - Browser-side Supabase client factory using `createBrowserClient`.
- `src/lib/supabase/server.ts` - Server-side Supabase client factory using `createServerClient` with cookie handling.
- `src/lib/r2/client.ts` - S3-compatible client configured for Cloudflare R2.
- `src/lib/r2/storage.ts` - Helper functions for R2 audio file operations (upload, signed URL, delete).
- `src/types/database.ts` - Auto-generated Supabase TypeScript types (placeholder until PRD 03).
- `src/middleware.ts` - Next.js middleware stub (placeholder until PRD 04).
- `.gitignore` - Git ignore rules for Node, Next.js, and `.env.local`.
- `supabase/config.toml` - Supabase CLI configuration (created by `supabase init`).

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Initialize a new git repository with `git init` (if not already initialized)
  - [x] 0.2 Create and checkout a new branch for this feature: `git checkout -b feature/01-project-foundation`

- [x] 1.0 Initialize Next.js 15 App Router project
  - [x] 1.1 Run `npx create-next-app@latest` with the following flags: `--typescript`, `--tailwind`, `--eslint`, `--app`, `--src-dir`, `--import-alias "@/*"`. Pin to Next.js 15.x stable.
  - [x] 1.2 Verify `package.json` contains Next.js 15.x, React 19.x, TypeScript, Tailwind CSS, and ESLint as dependencies.
  - [x] 1.3 Open `tsconfig.json` and confirm `"strict": true` is set. If not, enable it.
  - [x] 1.4 Confirm ESLint is configured with `next/core-web-vitals` in the ESLint config file.
  - [x] 1.5 Run `npm run dev` and verify the default Next.js page loads on `localhost:3000`.
  - [x] 1.6 Run `npm run build` and verify it completes with zero errors.

- [x] 2.0 Configure Tailwind CSS v4 with glassmorphism theme and Inter font
  - [x] 2.1 Open the Tailwind configuration file (`tailwind.config.ts` or `src/app/globals.css` for v4 CSS-based config) and extend the theme with custom glassmorphism colors: `glass-bg` (rgba white with low opacity), and pastel accents: `accent-blue`, `accent-green`, `accent-yellow`, `accent-orange`, `accent-purple`, `accent-red`.
  - [x] 2.2 Add a `.glass` utility class that applies `backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg`. Use the `@layer utilities` directive or the Tailwind plugin approach as appropriate for v4.
  - [x] 2.3 Install the Inter font using `next/font/google` in `src/app/layout.tsx`. Apply it as the default body font via a className on the `<html>` or `<body>` element.
  - [x] 2.4 Set the default background to dark (e.g., `bg-gray-950` or a custom dark color) in the root layout or `globals.css` to match the design direction.
  - [x] 2.5 Run `npm run dev` and visually confirm the Inter font renders and the dark background is applied.

- [x] 3.0 Set up Supabase SDK integration
  - [x] 3.1 Install Supabase packages: `npm install @supabase/supabase-js @supabase/ssr`.
  - [x] 3.2 Create `src/lib/supabase/client.ts` — export a function that creates a browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`. It should read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from environment variables.
  - [x] 3.3 Create `src/lib/supabase/server.ts` — export a function that creates a server-side Supabase client using `createServerClient` from `@supabase/ssr`. It must handle cookie get/set/remove using the Next.js `cookies()` API from `next/headers`.
  - [x] 3.4 Create a placeholder type file at `src/types/database.ts` with a `TODO` comment indicating it will be auto-generated from the Supabase schema in PRD 03. Export an empty `Database` type for now.
  - [x] 3.5 Verify both client files compile without TypeScript errors by running `npm run build`.

- [x] 4.0 Set up Cloudflare R2 client and storage helpers
  - [x] 4.1 Install AWS SDK packages: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`.
  - [x] 4.2 Create `src/lib/r2/client.ts` — export an S3Client instance configured with the R2 endpoint (`https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`), region set to `auto`, and credentials from `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` environment variables.
  - [x] 4.3 Create `src/lib/r2/storage.ts` — implement and export three helper functions:
    - `uploadAudio(buffer: Buffer, key: string): Promise<void>` — uploads a buffer to the R2 bucket using `PutObjectCommand`.
    - `getSignedUrl(key: string, expiresIn?: number): Promise<string>` — generates a pre-signed GET URL for the given key using `GetObjectCommand` and `getSignedUrl` from `@aws-sdk/s3-request-presigner`. Default expiry of 1 hour (3600 seconds).
    - `deleteAudio(key: string): Promise<void>` — deletes an object from the R2 bucket using `DeleteObjectCommand`.
  - [x] 4.4 Verify both R2 files compile without TypeScript errors by running `npm run build`.

- [x] 5.0 Establish folder structure, environment config, and middleware stub
  - [x] 5.1 Create the following empty directories (with `.gitkeep` files or placeholder `index.ts` barrel files as appropriate) to establish the project folder structure:
    - `src/app/blind-test/`
    - `src/app/my-results/`
    - `src/app/leaderboard/`
    - `src/app/admin/`
    - `src/app/auth/`
    - `src/components/ui/`
    - `src/components/layout/`
    - `src/lib/elo/`
    - `src/lib/matchmaking/`
    - `src/lib/tts/`
  - [x] 5.2 Create a placeholder `page.tsx` in each app route directory (`blind-test`, `my-results`, `leaderboard`, `admin`, `auth`) that exports a simple component returning a heading with the route name, so Next.js recognizes them as valid routes.
  - [x] 5.3 Create `.env.local.example` at the project root with all required environment variables documented (Supabase URL, anon key, service role key; R2 account ID, access key, secret, bucket name, public URL; app URL). Include comments explaining each variable.
  - [x] 5.4 Create `src/middleware.ts` with a minimal stub that exports a `middleware` function and a `config` matcher. Add a `TODO` comment indicating auth/RBAC logic will be added in PRD 04.
  - [x] 5.5 Verify the folder structure matches the specification in the PRD by reviewing the `src/` directory tree.

- [ ] 6.0 Initialize GitHub repository and Supabase CLI
  - [x] 6.1 Verify `.gitignore` includes Node/Next.js defaults, `.env.local`, and any OS-specific files (`.DS_Store`, etc.). Add missing entries if needed.
  - [x] 6.2 Install the Supabase CLI as a dev dependency: `npm install -D supabase`.
  - [x] 6.3 Run `npx supabase init` at the project root to create the `supabase/` config directory with `config.toml`.
  - [x] 6.4 Add a `db:types` script to `package.json`: `"db:types": "supabase gen types typescript --project-id <project-id> > src/types/database.ts"`. Include a comment or README note that `<project-id>` needs to be replaced with the actual Supabase project ID.
  - [ ] 6.5 Stage all files and create an initial commit: `git add . && git commit -m "feat: project foundation and tech stack setup (PRD 01)"`.

- [ ] 7.0 Verify end-to-end setup and create placeholder page
  - [ ] 7.1 Update `src/app/page.tsx` to display a minimal placeholder page with: the app name "TTS Arena" as a heading, a dark background, and the Inter font applied — confirming Tailwind and font are wired correctly.
  - [ ] 7.2 Optionally apply the `.glass` utility class to a card element on the placeholder page to visually verify the glassmorphism theme is working.
  - [ ] 7.3 Run `npm run dev` and confirm the placeholder page renders correctly on `localhost:3000` with the dark background, Inter font, and styled elements.
  - [ ] 7.4 Run `npm run build` and confirm zero errors.
  - [ ] 7.5 (Manual) If Supabase credentials are configured in `.env.local`, verify the Supabase client can connect by adding a temporary health-check query in a Server Component or API route.
  - [ ] 7.6 (Manual) If R2 credentials are configured in `.env.local`, verify the R2 client can upload a test file and generate a signed URL via a temporary dev-only API route.
  - [ ] 7.7 (Manual) Push the branch to GitHub and confirm Vercel picks up the deployment and builds successfully.

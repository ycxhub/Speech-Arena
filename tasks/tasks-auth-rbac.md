# Tasks: Authentication and Role-Based Access Control (PRD 04)

## Relevant Files

- `src/lib/supabase/client.ts` - Browser client; used for auth operations in Client Components (sign in, sign up, sign out).
- `src/lib/supabase/server.ts` - Server client; used in Server Components, Server Actions, Route Handlers, and middleware.
- `src/lib/supabase/middleware.ts` - Optional: extract middleware Supabase client creation for reuse (createServerClient with request/response cookies).
- `src/app/auth/callback/route.ts` - Auth callback route; exchanges `code` query param for session (email confirmation, OAuth).
- `src/app/auth/sign-up/page.tsx` - Sign up page with email, password, confirm password.
- `src/app/auth/sign-in/page.tsx` - Sign in page with email, password.
- `src/app/auth/forgot-password/page.tsx` - Forgot password page; sends reset email.
- `src/app/auth/reset-password/page.tsx` - Reset password page; new password form after clicking email link.
- `src/app/auth/layout.tsx` - Auth layout; shared wrapper with centered content and flex layout for all auth pages.
- `src/app/auth/sign-out/route.ts` - Route handler that signs out and redirects to sign-in.
- `src/components/layout/nav-bar.tsx` - Nav bar; already has Sign out link and user display; may need sign-out form/action.
- `src/components/layout/nav-bar-with-session.tsx` - Server component that fetches user and role for NavBar.
- `src/components/layout/email-verification-banner.tsx` - Server component; shows banner when user is signed in but email_confirmed_at is null.
- `src/middleware.ts` - Route protection; session refresh, redirect logic for protected/auth routes.
- `src/app/admin/page.tsx` - Admin dashboard; user management table with role promotion.
- `src/app/admin/actions.ts` - Server Action to update user role (admin-only).
- `src/app/admin/user-role-select.tsx` - Client component; role dropdown for user management table.
- `src/app/layout.tsx` - Root layout; may host email verification banner for unverified users.
- `src/types/database.ts` - Database types; `profiles.role` type.
- `README.md` - Document initial admin seeding SQL step.
- `src/components/ui/glass-card.tsx` - Glassmorphism card for auth forms.
- `src/components/ui/glass-input.tsx` - Form inputs for auth pages.
- `src/components/ui/glass-button.tsx` - Submit buttons for auth pages.
- `src/components/ui/glass-table.tsx` - Table component for user management view.
- `.env.local.example` - Documents Supabase Auth redirect URL configuration (auth callback, OAuth).

### Notes

- The `profiles` table and `handle_new_user` trigger already exist in the initial schema migration (`20260212115120_initial_schema.sql`); no new migration needed for profile creation.
- `@supabase/ssr` replaces deprecated `@supabase/auth-helpers-nextjs` — verify all cookie handling uses the SSR API. Use `supabase.auth.getClaims()` in middleware (not `getSession()` or `getUser()`) for token validation per official docs.
- When tasks involve Supabase Auth or RLS, perform a web search for the latest `@supabase/ssr` API if needed.
- Supabase Auth callback URL must be configured in Supabase Dashboard: Authentication → URL Configuration → Redirect URLs. Add `http://localhost:3000/auth/callback` (and production URL) for email confirmation, password reset, and OAuth.
- **Open Questions (decisions):** (1) Magic links / passwordless login — deferred to post-MVP. (2) Role in JWT custom claims — start with database query; optimize with custom claims if middleware latency becomes an issue. (3) User management scope — table view with list of users (emails), role promotion only; no add/remove/search/ban.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/04-auth-rbac`

- [x] 1.0 Auth callback and Supabase client verification
  - [x] 1.1 Verify `src/lib/supabase/client.ts` uses `createBrowserClient` from `@supabase/ssr` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; ensure it uses the generated `Database` type.
  - [x] 1.2 Verify `src/lib/supabase/server.ts` uses `createServerClient` from `@supabase/ssr` with `cookies()` from `next/headers`; ensure it uses the `Database` type.
  - [x] 1.3 Create `src/app/auth/callback/route.ts`: GET handler that reads `code` from query params; if present, create server client, call `supabase.auth.exchangeCodeForSession(code)`, then redirect to `next` param or `/blind-test`; otherwise redirect to `/auth/sign-in`.
  - [x] 1.4 Add `http://localhost:3000/auth/callback` (and production callback URL) to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs. Document this in README or .env.example if applicable.

- [x] 2.0 Auth UI pages (sign-up, sign-in, forgot-password, reset-password)
  - [x] 2.1 Create `src/app/auth/sign-up/page.tsx`: centered GlassCard on dark background, "TTS Arena" header, form with email, password, confirm password (GlassInput), client-side validation (email format, password min 8 chars, passwords match), submit calls `supabase.auth.signUp({ email, password })`, success shows "Check your email for a confirmation link", error displayed inline (e.g. "Email already registered"). Add "Sign up with Google" button (see task 6.0).
  - [x] 2.2 Create `src/app/auth/sign-in/page.tsx`: centered GlassCard, form with email and password, submit calls `supabase.auth.signInWithPassword()`, success redirect to `/blind-test`, error inline, links to "Forgot password?" and "Sign up". Add "Sign in with Google" button (see task 6.0).
  - [x] 2.3 Create `src/app/auth/forgot-password/page.tsx`: form with email, submit calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback` })`, show generic confirmation message regardless of whether email exists (prevent enumeration).
  - [x] 2.4 Create `src/app/auth/reset-password/page.tsx`: form with new password and confirm password (client-side validation), submit calls `supabase.auth.updateUser({ password })`, success redirect to `/auth/sign-in` with success message (e.g. via query param `?message=password-reset`).
  - [x] 2.5 Add layout or shared wrapper for auth pages: dark background, centered content, consistent glassmorphism styling. Consider `src/app/auth/layout.tsx` if not already present.
  - [x] 2.6 Remove or repurpose the placeholder `src/app/auth/page.tsx` (e.g. redirect to sign-in or render links to sign-in/sign-up).

- [x] 3.0 Sign out and navigation integration
  - [x] 3.1 Create `src/app/auth/sign-out/route.ts`: GET (or POST) handler that creates server client, calls `supabase.auth.signOut()`, redirects to `/auth/sign-in`. NavBar currently links to `/auth/sign-out`; ensure the link triggers this route (Link with href `/auth/sign-out` works for GET).
  - [x] 3.2 Add email verification banner: in a layout or component visible to signed-in users, if `user.email_confirmed_at` is null (or equivalent), show a banner: "Please verify your email. Check your inbox for the confirmation link." Use server client to check `supabase.auth.getUser()` and `user.email_confirmed_at`. Place in app shell or root layout.
  - [x] 3.3 Verify NavBar shows user email and Sign out link when authenticated; Sign in link when not. `NavBarWithSession` already fetches user and role; ensure Sign out link points to `/auth/sign-out`.

- [x] 4.0 Route protection via Next.js middleware
  - [x] 4.1 Create Supabase client in middleware using `createServerClient` from `@supabase/ssr` with cookies: `getAll()` from `request.cookies.getAll()`, `setAll()` that updates both `request.cookies` and a `NextResponse` object's cookies (see Supabase middleware docs). Call `supabase.auth.getClaims()` to refresh session — do not use `getSession()` or `getUser()` in middleware.
  - [x] 4.2 Protected routes: if path starts with `/admin`, `/blind-test`, `/my-results`, or `/leaderboard`, and user is not authenticated, redirect to `/auth/sign-in`.
  - [x] 4.3 Admin routes: if path starts with `/admin` and user is authenticated but not admin, redirect to `/auth/sign-in` (or `/blind-test`). Fetch role from `profiles` only when path is `/admin/*` to avoid unnecessary DB queries on other routes.
  - [x] 4.4 Auth routes: if path starts with `/auth` (excluding `/auth/callback` and `/auth/sign-out`) and user IS authenticated, redirect to `/blind-test`.
  - [x] 4.5 Return the response with updated cookies (the `supabaseResponse` or equivalent) so session is persisted. Ensure matcher excludes static assets, `_next`, favicon, etc. (already configured).
  - [x] 4.6 Allow `/` (home) and `/auth/callback` without auth; optionally redirect `/` to `/blind-test` if authenticated.

- [x] 5.0 Admin RBAC and user management table view
  - [x] 5.1 Create user management table view in Admin Dashboard (`src/app/admin/page.tsx` or `/admin/users`): display a table of all users who have signed up (from `profiles`), with columns: email, role, created_at (or last_seen if available). Use `GlassTable` for consistent styling. In scope: list view, admin promotion. Out of scope: user addition, removal, search, ban.
  - [x] 5.2 Create a Server Action to update a user's role: `UPDATE profiles SET role = $1 WHERE id = $2`. Expose via role dropdown/select in each row. RLS "Admins can update any role" policy enforces access; optionally verify caller is admin in the action before updating.
  - [x] 5.3 Document initial admin seeding in README: `UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';` — run manually against the database after first admin signs up. Include instructions for Supabase SQL Editor.

- [x] 6.0 Google OAuth integration
  - [x] 6.1 Configure Google OAuth in Supabase Dashboard: Authentication → Providers → Google. Enable provider; add Client ID and Client Secret from Google Cloud Console. Add redirect URL `http://localhost:3000/auth/callback` (and production) to Google OAuth consent screen if not already covered.
  - [x] 6.2 Create Google Cloud project and OAuth credentials: create OAuth 2.0 Client ID (Web application), add authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback` (from Supabase Dashboard → Auth → URL Configuration), configure consent screen with scopes `openid`, `email`, `profile`.
  - [x] 6.3 Add "Sign in with Google" button to `src/app/auth/sign-in/page.tsx`: call `supabase.auth.signInWithOAuth({ provider: 'google' })` and handle redirect. Style with glassmorphism (e.g. secondary/ghost GlassButton); show as alternative to email form.
  - [x] 6.4 Add "Sign up with Google" button to `src/app/auth/sign-up/page.tsx`: same `signInWithOAuth({ provider: 'google' })` — Supabase handles both sign-in and sign-up for OAuth. Ensure `handle_new_user` trigger creates profile for OAuth users (already in place; `auth.users` gets new row on first OAuth sign-in).

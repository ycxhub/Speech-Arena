# PRD 04: Authentication and Role-Based Access Control

## Introduction / Overview

TTS Arena has two user roles — standard users and admins — and every feature is gated by role. This PRD specifies the full authentication flow (sign up, sign in, sign out, password reset) using Supabase Auth, the RBAC mechanism via a `role` column on the `profiles` table enforced by Supabase RLS, and the Next.js middleware that protects server-rendered routes.

The goal is a simple, secure auth system that works seamlessly with Server Components and requires no additional SaaS dependencies.

## Goals

1. Implement email/password authentication using Supabase Auth.
2. Assign every new user the `user` role by default; provide a mechanism for promoting users to `admin`.
3. Protect admin routes (`/admin/*`) at both the middleware layer and database layer (RLS).
4. Provide polished auth UI pages matching the glassmorphism design system.
5. Ensure session persistence across page reloads and server/client boundaries via `@supabase/ssr`.

## User Stories

- **As a new user**, I want to sign up with my email and password so I can start running blind tests.
- **As a returning user**, I want to sign in and have my session persist so I do not have to log in every time.
- **As a user**, I want to reset my password if I forget it.
- **As an admin**, I want to access the Admin Dashboard knowing that non-admin users cannot reach it.
- **As a super-admin**, I want to promote another user to admin from the Admin Dashboard.

## Functional Requirements

### Authentication Flow

1. **Sign Up page** (`/auth/sign-up`):
   - Form fields: email, password, confirm password.
   - Client-side validation: email format, password min 8 characters, passwords match.
   - On submit: call `supabase.auth.signUp({ email, password })`.
   - On success: show "Check your email for a confirmation link" message.
   - On error: display error inline (e.g., "Email already registered").

2. **Sign In page** (`/auth/sign-in`):
   - Form fields: email, password.
   - On submit: call `supabase.auth.signInWithPassword({ email, password })`.
   - On success: redirect to `/blind-test`.
   - On error: display error inline (e.g., "Invalid credentials").
   - Link to "Forgot password?" and "Sign up".

3. **Forgot Password page** (`/auth/forgot-password`):
   - Form field: email.
   - On submit: call `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
   - Show confirmation message regardless of whether email exists (prevent enumeration).

4. **Password Reset page** (`/auth/reset-password`):
   - Accessed via the reset link in the email.
   - Form fields: new password, confirm password.
   - On submit: call `supabase.auth.updateUser({ password })`.
   - On success: redirect to sign in with success message.

5. **Sign Out**: available from the navigation bar (user dropdown or button). Calls `supabase.auth.signOut()` and redirects to `/auth/sign-in`.

6. **Email confirmation**: Supabase sends a confirmation email on sign-up. The user must click the link to verify their email. Unverified users can still sign in but should see a banner prompting verification.

### Profile Creation Trigger

7. A Supabase database function + trigger must automatically create a row in `profiles` when a new user is created in `auth.users`:
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger AS $$
   BEGIN
     INSERT INTO public.profiles (id, email, role)
     VALUES (NEW.id, NEW.email, 'user');
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW
     EXECUTE FUNCTION public.handle_new_user();
   ```

### Role-Based Access Control

8. **Role storage**: The `profiles.role` column (`'user'` or `'admin'`) is the single source of truth for user roles.

9. **Checking roles in Server Components**: Use the server-side Supabase client to query `profiles` for the current user's role:
   ```typescript
   const { data: profile } = await supabase
     .from('profiles')
     .select('role')
     .eq('id', user.id)
     .single();
   ```

10. **Admin promotion**: The Admin Dashboard includes a user management section where an existing admin can change another user's `role` to `'admin'` or back to `'user'`. This updates the `profiles.role` column. Only users with `role = 'admin'` can perform this action (enforced by RLS).

11. **Initial admin seeding**: The first admin is created by running a manual SQL command against the database:
    ```sql
    UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
    ```
    Document this step clearly in the project README.

### Route Protection

12. **Next.js middleware** (`src/middleware.ts`):
    - Runs on every request.
    - Uses `@supabase/ssr` `createServerClient` with the request/response cookies.
    - Refreshes the session (handles token refresh transparently).
    - **Protected routes**: If the path starts with `/admin` and the user is not authenticated or not an admin, redirect to `/auth/sign-in`.
    - **Auth routes**: If the path starts with `/auth` and the user IS authenticated, redirect to `/blind-test` (prevent signed-in users from seeing sign-in pages).
    - **Public routes**: `/blind-test`, `/my-results`, `/leaderboard` require authentication. Unauthenticated users are redirected to `/auth/sign-in`.
    - Matcher config: exclude static assets, `_next`, favicon, etc.

13. **RLS policies** (as defined in PRD 03) enforce data-level access. Even if a user somehow bypasses middleware, the database rejects unauthorized queries.

### Supabase Client Setup

14. **Server client** (`src/lib/supabase/server.ts`):
    - Uses `createServerClient` from `@supabase/ssr`.
    - Reads/writes cookies from the Next.js `cookies()` API.
    - Used in Server Components, Server Actions, and Route Handlers.

15. **Browser client** (`src/lib/supabase/client.ts`):
    - Uses `createBrowserClient` from `@supabase/ssr`.
    - Used in Client Components for auth operations (sign in, sign out).

16. **Auth callback route** (`src/app/auth/callback/route.ts`):
    - Handles the OAuth/email confirmation redirect from Supabase.
    - Exchanges the `code` query parameter for a session.
    - Redirects to the intended destination.

## Non-Goals (Out of Scope)

- OAuth/social login (Google, GitHub, etc.) — can be added later; the architecture supports it via Supabase Auth but is not implemented in MVP.
- Multi-factor authentication (MFA).
- User profile editing (display name, avatar) — deferred.
- Session timeout or "remember me" configuration — use Supabase defaults.
- Email template customization — use Supabase default templates initially.

## Design Considerations

- Auth pages use the glassmorphism design system: a centered GlassCard on the dark background, with the TTS Arena logo above the form.
- Form inputs use the `GlassInput` component.
- Submit buttons use `GlassButton` with the blue accent.
- Error messages appear as red-accented text below the relevant input.
- A subtle "TTS Arena" wordmark appears above the form as a header.

## Technical Considerations

- `@supabase/ssr` replaces the deprecated `@supabase/auth-helpers-nextjs`. All cookie handling must use the `@supabase/ssr` API.
- The middleware must be efficient — it runs on every request. Avoid making database queries in middleware for non-admin routes; only query `profiles.role` when the path is `/admin/*`.
- Supabase Auth JWTs contain the user's `id` but NOT the role. Role must be fetched from `profiles`. To avoid repeated queries, consider caching the role in the session metadata via a Supabase Auth hook (optional optimization).
- The service role key (`SUPABASE_SERVICE_ROLE_KEY`) must NEVER be used in client-side code or exposed to the browser. It is only used in server-side operations (API routes, Server Actions) that need to bypass RLS.

## Success Metrics

- A new user can sign up, confirm their email, and sign in successfully.
- A signed-in standard user cannot access `/admin/*` routes (redirected to `/blind-test`).
- A signed-in admin user can access all routes including `/admin/*`.
- The session persists across page reloads and server-rendered pages.
- The `profiles` row is automatically created on sign-up with `role = 'user'`.

## Open Questions

1. Should we allow passwordless login (magic links) as an alternative? Recommendation: defer to post-MVP.
2. Should the role be stored in the JWT custom claims (via Supabase Auth hook) for faster middleware checks? Recommendation: start with a database query; optimize with custom claims if middleware latency becomes an issue.
3. Should we implement a "user management" table view in the Admin Dashboard as part of this PRD? Recommendation: include a basic admin promotion feature; full user management (list, search, ban) can be a separate scope.

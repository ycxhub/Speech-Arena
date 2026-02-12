# TTS Arena

Compare TTS voices in blind tests. A Next.js app with Supabase auth, RBAC, and Cloudflare R2 for audio storage.

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in the values.
2. Configure Supabase Auth redirect URLs in Dashboard → Authentication → URL Configuration (see `.env.local.example`).
3. (Optional) Enable Google OAuth — see [Google OAuth Setup](#google-oauth-setup) below.
4. Run migrations: `npx supabase db push` (requires `supabase login` and `supabase link`).
5. Generate types: `npm run db:types`.
6. Start dev server: `npm run dev`.

## Initial Admin Seeding

The first admin must be created manually after signing up. New users get the `user` role by default; there is no self-service admin promotion.

**Steps:**

1. Sign up with your email at `/auth/sign-up` (or sign in with Google).
2. Open the [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor.
3. Run:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'ychaitanyax@gmail.com';
```

Replace `ychaitanyax@gmail.com` with your admin email.

4. Refresh the app. You should now see the Admin tab in the nav and access `/admin`.

Existing admins can promote other users from the Admin Dashboard → User Management table.

## Google OAuth Setup

To enable "Sign in with Google" and "Sign up with Google":

### 1. Google Cloud Console

1. Create a project at [Google Cloud Console](https://console.cloud.google.com/) (or use an existing one).
2. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
3. Choose **Web application**.
4. **Authorized JavaScript origins:**
   - `http://localhost:3000` (dev)
   - Your production URL (e.g. `https://your-domain.com`)
5. **Authorized redirect URIs:** Add the Supabase callback URL:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
   - Get the exact URL from Supabase Dashboard → **Authentication** → **Providers** → **Google** (it's shown there).
   - For project `kgikcglaxylxonlkqpsi`: `https://kgikcglaxylxonlkqpsi.supabase.co/auth/v1/callback`
6. Create and copy the **Client ID** and **Client Secret**.

### 2. Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Authentication** → **Providers** → **Google**.
3. Enable the provider.
4. Paste **Client ID** and **Client Secret**.
5. Save.

### 3. Consent screen (optional)

In Google Cloud Console → **APIs & Services** → **OAuth consent screen**:
- Add scopes: `openid`, `email`, `profile` (usually included by default).
- Add branding (app name, logo) for a better login experience.

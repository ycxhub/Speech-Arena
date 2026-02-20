# Tasks: Google Analytics on All Pages (PRD)

Implementation tasks for GA4 page-view tracking across all pages, production only.

---

## Relevant Files

- `src/app/layout.tsx` - Root layout; GoogleAnalytics component added (production-only).
- `package.json` - @next/third-parties dependency added.
- `.env.local` - Add NEXT_PUBLIC_GOOGLE_ANALYTICS for local testing (not committed).
- `.env.local.example` - NEXT_PUBLIC_GOOGLE_ANALYTICS placeholder added.

### Notes

- No unit tests required for this integration (third-party script injection).
- Verify GA4 Realtime in production after deploy.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/google-analytics`)
- [x] 1.0 Install @next/third-parties package
  - [x] 1.1 Run `npm install @next/third-parties`
  - [x] 1.2 Verify the package appears in `package.json` dependencies
- [ ] 2.0 Set up GA4 property and environment variable
  - [ ] 2.1 Create a GA4 property at [analytics.google.com](https://analytics.google.com) if one does not exist
  - [ ] 2.2 Add a Web data stream for the production URL; copy the Measurement ID (`G-XXXXXXXXXX`)
  - [ ] 2.3 Add `NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX` to `.env.local` for local testing
  - [x] 2.4 Add `NEXT_PUBLIC_GOOGLE_ANALYTICS` to `.env.local.example` with a placeholder (e.g., `G-XXXXXXXXXX`) so other developers know it is required
  - [ ] 2.5 Add `NEXT_PUBLIC_GOOGLE_ANALYTICS` to Vercel (or hosting) environment variables for production
- [x] 3.0 Integrate GoogleAnalytics component in root layout
  - [x] 3.1 Import `GoogleAnalytics` from `@next/third-parties/google` in `src/app/layout.tsx`
  - [x] 3.2 Add the `GoogleAnalytics` component inside `<body>`, after the `Toaster` component
  - [x] 3.3 Wrap the component in a conditional so it renders only when `NODE_ENV === 'production'` and `process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS` is non-empty
  - [x] 3.4 Pass `gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS ?? ''}` to the component
- [ ] 4.0 Deploy to production and verify tracking
  - [ ] 4.1 Deploy to production (e.g., `npm run deploy` or push to main)
  - [ ] 4.2 Visit several pages (home, leaderboard, blind-test, admin) in production
  - [ ] 4.3 Open GA4 Realtime report and confirm `page_view` events appear within a few minutes

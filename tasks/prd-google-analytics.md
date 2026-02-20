# PRD: Google Analytics on All Pages

## Introduction / Overview

This PRD defines the implementation of Google Analytics 4 (GA4) across the Speech Arena (TTS Battles) application. The goal is to enable automatic page-view tracking on all pages—including public, auth, and admin routes—without a consent banner, and only in production. This provides visibility into traffic, user flows, and engagement for product and growth decisions.

**Scope:**
- Automatic page-view tracking only (no custom events in this phase)
- No cookie consent banner
- Production environment only
- All pages tracked (including `/admin/*`)

---

## Goals

1. Install and configure GA4 on the Next.js 15 App Router application.
2. Track page views automatically on every route (including client-side navigation).
3. Load the GA script only in production (not in development or preview).
4. Store the Measurement ID securely via environment variables.
5. Ship within 1–2 weeks (urgent).

---

## User Stories

- **As the product owner**, I want to see page views and traffic sources in Google Analytics, so I can understand how users find and use the site.
- **As the product owner**, I want page views to be tracked automatically on all pages, so I don't have to manually instrument each route.
- **As the product owner**, I want admin activity tracked as well, so I can see how often admin tools are used.
- **As a developer**, I want the GA script to load only in production, so development and preview deployments don't pollute analytics data.

---

## Functional Requirements

1. The system must use Google Analytics 4 (GA4) with a Measurement ID in the format `G-XXXXXXXXXX`.
2. The system must load the GA script on all pages via the root layout (`src/app/layout.tsx`).
3. The system must track page views automatically for both initial loads and client-side route changes (SPA navigation).
4. The system must load the GA script **only** when `NODE_ENV === 'production'`.
5. The system must store the Measurement ID in an environment variable `NEXT_PUBLIC_GOOGLE_ANALYTICS` (no hardcoding).
6. The system must use the official Next.js integration (`@next/third-parties/google`) for optimized loading and automatic page-view tracking.
7. The system must include the GA component in the root layout so all routes (home, auth, admin, leaderboard, blind-test, custom-test, my-results, etc.) are tracked.

---

## Non-Goals (Out of Scope)

- Cookie consent banner or GDPR/CCPA compliance flows
- Custom event tracking (e.g., `test_started`, `vote_submitted`, `sign_up`)
- Conversion goals or enhanced e-commerce
- Tracking in development or preview environments
- Excluding admin pages from tracking
- Separate GA property for admin
- Server-side analytics (e.g., server actions)

---

## Technical Considerations

### Recommended Approach

Use **`@next/third-parties`** (Next.js official package) with the `GoogleAnalytics` component. This provides:

- Optimized script loading
- Automatic page-view tracking for App Router (including client-side navigation)
- No manual `gtag` or `page_view` calls needed

**Package:** `@next/third-parties` — verify compatibility with Next.js 15 in the [official Next.js docs](https://nextjs.org/docs) (current year 2026).

### Implementation Steps (Summary)

1. **Install dependency**
   ```bash
   npm install @next/third-parties
   ```

2. **Create GA property in Google Analytics**
   - Go to [analytics.google.com](https://analytics.google.com) → Admin → Data Streams
   - Create a Web stream for the production URL
   - Copy the Measurement ID (`G-XXXXXXXXXX`)

3. **Add environment variable**
   - Add `NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX` to `.env.local` (and to Vercel/hosting env for production)
   - Add `.env.local` to `.gitignore` if not already (never commit the ID)

4. **Integrate in root layout**
   - Import `GoogleAnalytics` from `@next/third-parties/google`
   - Render `<GoogleAnalytics gaId={...} />` only when `NODE_ENV === 'production'` and `gaId` is non-empty
   - Place the component inside `<body>` (typically after `{children}` or at the end of the layout)

5. **Verify**
   - Deploy to production
   - Visit a few pages and confirm `page_view` events appear in GA4 Realtime report

### Layout Integration Note

The root layout is at `src/app/layout.tsx`. The `GoogleAnalytics` component must be rendered as a child of `<body>`. The `@next/third-parties` package handles script injection and SPA page-view tracking automatically.

### Conditional Loading

Guard the component so it only renders in production:

```tsx
{process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
  <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
)}
```

---

## Success Metrics

1. **Implementation complete:** GA4 script loads on all production pages.
2. **Data flowing:** Page views appear in GA4 Realtime within 24 hours of deployment.
3. **No dev noise:** No GA events in development or preview environments.
4. **All routes covered:** Home, auth, admin, leaderboard, blind-test, custom-test, my-results, and nested admin routes all show page views in GA4.

---

## Open Questions

- None for this phase. Custom events and consent flows can be addressed in a future PRD if needed.

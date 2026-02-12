## Relevant Files

- `src/app/globals.css` — Tailwind v4 @theme with full color system, typography, spacing; update .glass utility.
- `src/components/ui/glass-card.tsx` — GlassCard container component.
- `src/lib/utils.ts` — cn() utility for merging Tailwind classes (clsx + tailwind-merge).
- `src/components/ui/glass-button.tsx` — GlassButton with variants and accents.
- `src/components/ui/glass-input.tsx` — GlassInput with label, error, helperText.
- `src/components/ui/glass-select.tsx` — GlassSelect dropdown component.
- `src/components/ui/glass-table.tsx` — GlassTable with columns, sorting, loading.
- `src/components/ui/glass-badge.tsx` — GlassBadge tag component.
- `src/components/ui/glass-modal.tsx` — GlassModal overlay dialog.
- `src/components/ui/glass-tabs.tsx` — GlassTabs navigation component.
- `src/app/layout.tsx` — Root layout with dark background, Inter font, AppShell, Sonner Toaster.
- `src/components/layout/nav-bar.tsx` — Top navigation bar with logo, tabs, user avatar.
- `src/components/layout/nav-bar-with-session.tsx` — Server component that fetches session and profile role, passes isAdmin/user to NavBar.
- `src/components/layout/app-shell.tsx` — App shell wrapping nav and main content.
- `src/app/loading.tsx` — Global loading skeleton.
- `src/app/error.tsx` — Global error boundary with GlassCard.
- `src/components/ui/index.ts` — Barrel file exporting all glass components.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `glass-card.tsx` and `glass-card.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/02-design-system`)

- [x] 1.0 Configure Tailwind design tokens (colors, typography, spacing)
  - [x] 1.1 Update `src/app/globals.css` `@theme` with the full base palette: background `#0a0a0a`, surface `rgba(255,255,255,0.05)`–`rgba(255,255,255,0.10)`, border `rgba(255,255,255,0.10)`–`rgba(255,255,255,0.20)`, text-primary `#ffffff`, text-secondary `rgba(255,255,255,0.60)`, text-muted `rgba(255,255,255,0.40)`.
  - [x] 1.2 Add accent palette to `@theme`: blue `#7dd3fc`, green `#86efac`, yellow `#fde68a`, orange `#fdba74`, purple `#c4b5fd`, red `#fca5a5`, plus low-opacity variants (e.g., `accent-blue/10`) for badge backgrounds.
  - [x] 1.3 Add typography scale utilities or document conventions: page title `text-3xl font-bold`, section heading `text-xl font-semibold`, body `text-sm`/`text-base`, caption `text-xs font-medium uppercase tracking-wide text-white/60`.
  - [x] 1.4 Update `.glass` utility if needed to match PRD: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg`.
  - [x] 1.5 Verify Inter font is applied via `next/font/google` in layout and body uses the design background color.

- [x] 2.0 Build glassmorphism UI primitives (GlassCard, GlassButton, GlassInput, GlassSelect, GlassTable, GlassBadge, GlassModal, GlassTabs, Toast)
  - [x] 2.1 Create `src/components/ui/glass-card.tsx` — export `GlassCard` with props `className`, `children`; default styles: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-6`.
  - [x] 2.2 Create `src/components/ui/glass-button.tsx` — add `"use client"`; props `variant` (`primary`|`secondary`|`ghost`), `accent`, `size` (`sm`|`md`|`lg`), `disabled`, `loading`, `onClick`, `children`; implement primary (solid accent), secondary (glass + accent border/text), ghost (transparent, hover glass); disabled opacity + no pointer-events; loading spinner.
  - [x] 2.3 Create `src/components/ui/glass-input.tsx` — add `"use client"` if needed; props: standard input props + `label`, `error`, `helperText`; styling: `bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/30 focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/30`.
  - [x] 2.4 Create `src/components/ui/glass-select.tsx` — native `<select>` or custom dropdown with same visual language as GlassInput; props: `label`, `error`, `options`, `value`, `onChange`.
  - [x] 2.5 Create `src/components/ui/glass-table.tsx` — add `"use client"`; props `columns` (`{key, header, sortable?, render?}`), `data`, `onSort`, `loading`; header `text-xs uppercase tracking-wide text-white/40`; alternating rows `bg-white/[0.02]`/`bg-white/[0.05]`; row hover highlight.
  - [x] 2.6 Create `src/components/ui/glass-badge.tsx` — props `color` (accent name), `children`; render `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-{accent}/10 text-{accent}`.
  - [x] 2.7 Create `src/components/ui/glass-modal.tsx` — add `"use client"`; props `open`, `onClose`, `title`, `children`, `footer`; backdrop `bg-black/60 backdrop-blur-sm`; panel GlassCard centered; close on Escape and backdrop click.
  - [x] 2.8 Create `src/components/ui/glass-tabs.tsx` — add `"use client"`; props `tabs` (`{id, label, icon?, href}`), `activeTab`; active tab has accent underline or background highlight; support both Link-based (href) and controlled (activeTab) usage.
  - [x] 2.9 Install `sonner` and create toast setup: `npm install sonner`; add Toaster in layout; style with Tailwind for success (green), error (red), warning (yellow), info (blue); 4s auto-dismiss, manual dismiss; top-right, stacked.

- [x] 3.0 Build application shell (root layout, navigation bar, main content area)
  - [x] 3.1 Update `src/app/layout.tsx` — apply `bg-[#0a0a0a] text-white` to body, ensure Inter font is applied, wrap children in app shell structure.
  - [x] 3.2 Create `src/components/layout/nav-bar.tsx` — top-positioned horizontal bar; logo/app name "TTS Arena" on left; tabs: Blind Test, My Results, Leaderboard, Admin (conditional); links to `/blind-test`, `/my-results`, `/leaderboard`, `/admin`; active tab highlight; user avatar/email + sign-out on right (or sign-in link if not authenticated).
  - [x] 3.3 In NavBar, fetch user session server-side (via Supabase `createServerClient`) and pass `isAdmin` to control Admin tab visibility — render Admin tab only when user has `admin` role.
  - [x] 3.4 Create `src/components/layout/app-shell.tsx` — wraps NavBar + main content area; main area: centered `max-w-6xl mx-auto px-6 py-8`.
  - [x] 3.5 Integrate AppShell into root layout; add Sonner Toaster provider.
  - [x] 3.6 Update metadata in `layout.tsx` (title: "TTS Arena", description) to match the app.

- [x] 4.0 Add loading and error states (loading.tsx, error.tsx)
  - [x] 4.1 Create `src/app/loading.tsx` — export default a loading skeleton with pulsing glass cards; use GlassCard or glass-like divs with `animate-pulse`.
  - [x] 4.2 Create `src/app/error.tsx` — add `"use client"`; use error boundary props (`error`, `reset`); display friendly error message inside a GlassCard; include a "Try Again" GlassButton that calls `reset()`.

- [x] 5.0 Verify design system and polish (admin tab visibility, cross-browser, accessibility)
  - [x] 5.1 Create `src/components/ui/index.ts` barrel file exporting all glass components for easy imports.
  - [x] 5.2 Manually verify Admin tab is hidden when not logged in and shown when logged in as admin (or mock session for testing).
  - [x] 5.3 Verify components render correctly in Chrome, Firefox, and Safari (desktop).
  - [x] 5.4 Run Lighthouse and ensure performance score remains above 90.
  - [x] 5.5 Spot-check WCAG AA contrast for text on glass backgrounds (especially accent colors).

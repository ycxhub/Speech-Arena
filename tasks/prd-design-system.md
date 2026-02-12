# PRD 02: Design System and App Shell

## Introduction / Overview

TTS Arena's visual identity is defined by an iOS-style glassmorphism aesthetic — translucent panels with backdrop blur, soft rounded corners, subtle shadows, and pastel color accents on a dark base. This PRD specifies the reusable design system components, the application shell (navigation, layout), and the global styling rules that every feature page will use.

The goal is to build a small, cohesive library of primitive UI components and a navigation shell so that all subsequent feature PRDs can compose pages without re-inventing styling.

## Goals

1. Create a set of reusable glassmorphism UI primitives (card, button, input, tabs, table, badge, modal, toast).
2. Build the application shell: top-level layout with a tab-based navigation bar.
3. Establish the color system, typography scale, spacing conventions, and animation defaults.
4. Ensure the design works on desktop screens (1024px+) with graceful degradation on smaller viewports.

## User Stories

- **As a user**, I want the app to feel polished and modern — like a native iOS app — so I enjoy spending time running tests.
- **As a user**, I want clear navigation tabs so I can quickly switch between Blind Test, My Results, Leaderboard, and (if admin) the Admin Dashboard.
- **As an admin**, I want to see the Admin Dashboard tab only when I'm logged in as an admin, so the UI isn't cluttered for regular users.
- **As a developer**, I want to import `<GlassCard>`, `<GlassButton>`, etc. and have them look correct everywhere without writing custom CSS each time.

## Functional Requirements

### Color System

1. **Base palette:**
   - Background: `#0a0a0a` (near-black).
   - Surface (glass panels): `rgba(255, 255, 255, 0.05)` to `rgba(255, 255, 255, 0.10)` with `backdrop-blur-xl`.
   - Border: `rgba(255, 255, 255, 0.10)` to `rgba(255, 255, 255, 0.20)`.
   - Text primary: `#ffffff`.
   - Text secondary: `rgba(255, 255, 255, 0.60)`.
   - Text muted: `rgba(255, 255, 255, 0.40)`.

2. **Accent palette (pastel):**
   - Blue: `#7dd3fc` (sky-300)
   - Green: `#86efac` (green-300)
   - Yellow: `#fde68a` (amber-200)
   - Orange: `#fdba74` (orange-300)
   - Purple: `#c4b5fd` (violet-300)
   - Red: `#fca5a5` (red-300)

3. All accent colors must have a corresponding low-opacity background variant for badges/highlights (e.g., `bg-accent-blue/10`).

### Typography

4. **Font family:** Inter loaded via `next/font/google`, applied to `<body>`.
5. **Type scale** (using Tailwind defaults):
   - Page title: `text-3xl font-bold`
   - Section heading: `text-xl font-semibold`
   - Body: `text-sm` or `text-base`
   - Caption/label: `text-xs font-medium uppercase tracking-wide text-white/60`
6. **No serif or monospace fonts** in the main UI. Monospace only for code-like data (IDs, timestamps) if needed.

### Glassmorphism Components

7. **GlassCard** — A container with glass background, border, rounded corners, and shadow:
   - Props: `className` (for overrides), `children`.
   - Default: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-6`.

8. **GlassButton** — A button with glass styling and accent color support:
   - Props: `variant` (`primary` | `secondary` | `ghost`), `accent` (color name), `size` (`sm` | `md` | `lg`), `disabled`, `loading`, `onClick`, `children`.
   - Primary: solid accent background, white text.
   - Secondary: glass background, accent-colored border and text.
   - Ghost: transparent, text only, hover reveals glass.
   - Disabled state: reduced opacity, no pointer events.
   - Loading state: spinner icon replacing text.

9. **GlassInput** — Text input with glass styling:
   - Props: standard `<input>` props + `label`, `error`, `helperText`.
   - Styling: `bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/30 focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/30`.

10. **GlassSelect** — Dropdown select with glass styling (same visual language as GlassInput).

11. **GlassTable** — A data table component:
    - Props: `columns` (array of `{ key, header, sortable?, render? }`), `data`, `onSort`, `loading`.
    - Header row with `text-xs uppercase tracking-wide text-white/40`.
    - Alternating row backgrounds: `bg-white/[0.02]` and `bg-white/[0.05]`.
    - Hover highlight on rows.

12. **GlassBadge** — Small label/tag:
    - Props: `color` (accent name), `children`.
    - Renders as: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-{accent}/10 text-{accent}`.

13. **GlassModal** — Overlay dialog:
    - Props: `open`, `onClose`, `title`, `children`, `footer`.
    - Backdrop: `bg-black/60 backdrop-blur-sm`.
    - Panel: GlassCard centered on screen with max-width.
    - Close on Escape key and backdrop click.

14. **GlassTabs** — Tab navigation component:
    - Props: `tabs` (array of `{ id, label, icon?, href }`), `activeTab`.
    - Active tab has a subtle accent underline or background highlight.
    - Used for both the main navigation and within-page tab sets.

15. **Toast / Notification** — Transient feedback messages:
    - Types: `success` (green), `error` (red), `warning` (yellow), `info` (blue).
    - Auto-dismiss after 4 seconds, with manual dismiss.
    - Positioned top-right, stacks vertically.

### Application Shell

16. **Root layout** (`src/app/layout.tsx`):
    - Dark background (`bg-[#0a0a0a] text-white`).
    - Inter font applied globally.
    - Contains a fixed sidebar or top navigation bar and a main content area.

17. **Navigation bar** (top-positioned, horizontal):
    - Logo/app name "TTS Arena" on the left.
    - Four navigation tabs: "Blind Test", "My Results", "Leaderboard", "Admin" (admin only).
    - Each tab links to its route: `/blind-test`, `/my-results`, `/leaderboard`, `/admin`.
    - Active tab visually highlighted (accent underline or background).
    - The "Admin" tab is conditionally rendered — shown only if the logged-in user has the `admin` role. If no user is logged in or user is not admin, the tab is hidden.
    - User avatar/email and sign-out button on the right (or sign-in link if not authenticated).

18. **Main content area:**
    - Centered container with max-width (e.g., `max-w-6xl mx-auto`).
    - Padding: `px-6 py-8`.
    - Each feature page renders within this area.

19. **Loading state:** A global loading skeleton (pulsing glass cards) shown during route transitions via `loading.tsx` files.

20. **Error boundary:** A global `error.tsx` at the app level that displays a friendly error message in a GlassCard with a "Try Again" button.

## Non-Goals (Out of Scope)

- Mobile-first design or native mobile layouts — desktop is the priority; basic mobile support means content is scrollable and not broken, but no dedicated mobile navigation (e.g., no bottom tab bar).
- Dark/light mode toggle — the app is dark mode only.
- Theming engine or design token files — Tailwind config is sufficient.
- Complex animations or page transitions (keep it simple: hover effects, fade-ins only).

## Design Considerations

- All glassmorphism layers should be subtle — avoid making the blur too strong or the opacity too high, which looks dated. Aim for `backdrop-blur-xl` (24px) with `bg-white/5` as the default.
- Shadows should be soft and spread: `shadow-lg` or `shadow-xl` with a slight blue tint for a premium feel.
- Rounded corners should be generous: `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for inputs and buttons.
- Maintain at least WCAG AA contrast for text on glass backgrounds — since the base is dark and text is white, this is generally met, but test accent colors on glass backgrounds.

## Technical Considerations

- All components are React Server Components by default; add `"use client"` only when interactivity is needed (buttons with `onClick`, modals, tabs with state, toasts).
- Components live in `src/components/ui/` with one file per component (e.g., `glass-card.tsx`, `glass-button.tsx`).
- Use Tailwind utility classes exclusively — no CSS modules, no styled-components, no external CSS files.
- The navigation shell should read the user's role from the Supabase session (server-side) to decide whether to render the Admin tab. This avoids a client-side flash.
- Toast state can use a simple React Context provider wrapping the root layout.

## Success Metrics

- All components render correctly on Chrome, Firefox, and Safari on desktop (latest versions).
- The navigation shell correctly shows/hides the Admin tab based on user role.
- A developer can build a new page by composing `GlassCard`, `GlassButton`, `GlassTable`, etc. without writing custom glass-related CSS.
- Lighthouse performance score remains above 90 (no heavy JS bundles from the design system).

## Open Questions

1. Should the navigation be a top horizontal bar or a left sidebar? Recommendation: top horizontal bar for simplicity (fewer layout complications).
2. Should we support a "compact" mode for data-dense admin pages? Recommendation: defer to PRD 13 (Admin Analytics).
3. Should toast notifications use a third-party library (e.g., `sonner`) or be custom-built? Recommendation: use `sonner` — it's tiny (< 5 KB), unstyled by default, and pairs well with Tailwind.

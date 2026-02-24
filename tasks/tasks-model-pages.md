# Tasks: Model Pages (PRD)

Implementation tasks for model pages, compare hub, compare pages, alternatives pages, and admin model page management. Based on [PRD: Model Pages](prd-model-pages.md).

---

## Relevant Files

- `supabase/migrations/` - New migration for `model_pages`, `compare_pages`, `providers.logo_url`.
- `src/app/models/page.tsx` - Models index (list of model pages).
- `src/app/models/[slug]/page.tsx` - Single model page layout.
- `src/app/models/compare/page.tsx` - Compare hub (model pickers).
- `src/app/models/compare/[slug]/page.tsx` - Compare page (admin-defined or dynamic).
- `src/app/models/alternatives/[param]/page.tsx` - Alternatives page.
- `src/app/admin/model-pages/page.tsx` - Admin model pages list.
- `src/app/admin/model-pages/actions.ts` - Server Actions for model page CRUD.
- `src/app/admin/model-pages/new/page.tsx` - Create model page form.
- `src/app/admin/model-pages/[id]/page.tsx` - Edit model page form.
- `src/components/models/model-page-hero.tsx` - Hero section (logo, name, provider, one-liner, buttons).
- `src/components/models/model-stats-bar.tsx` - Stats bar (rank, latency, price, etc.).
- `src/components/models/model-overview.tsx` - Overview, pricing, endpoints, features, use cases.
- `src/components/models/compare-hub-client.tsx` - Compare hub with two model pickers.
- `src/components/models/alternatives-list.tsx` - Alternatives page model cards.
- `src/components/models/model-card.tsx` - Reusable model card (logo, name, provider, one-liner, link) for models index sections.
- `src/lib/models/get-model-page.ts` - Fetch model page by slug.
- `src/lib/models/get-leaderboard-rank.ts` - Resolve leaderboard rank (ELO or override).
- `src/lib/models/get-alternatives.ts` - Fetch top 10 alternatives for a model.
- `src/lib/r2/storage.ts` - Add `uploadImage` for logo uploads (or extend existing).
- `src/app/api/upload/logo/route.ts` - API route for logo upload (if needed).
- `src/components/admin/admin-sidebar.tsx` - Add "Model Pages" link.
- `src/app/leaderboard/leaderboard-client.tsx` - Add link to model page from each row.
- `src/app/layout.tsx` or footer component - Add internal links (Leaderboard, Compare, Methodology).

### Notes

- All prices are per 1M characters (standardized).
- Model pages are public; admin routes require admin role.
- Use existing Glass components (GlassCard, GlassButton, GlassTable, etc.).
- Leaderboard uses `get_leaderboard_global_model` RPC; model pages key by `(provider_id, definition_name)`.
- Compare slug resolution: first `compare_pages` lookup; if not found, parse as `slug-a-vs-slug-b` (split on last `-vs-`).

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`. Update after each sub-task, not just after parent tasks.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/model-pages`)

- [x] 1.0 Database schema and migrations
  - [x] 1.1 Create migration for `model_pages` table (provider_id, definition_name, slug, logo_url, one_liner, overview_md, rank_override, use_elo_rank, latency_ms, price_input_per_million_chars, price_output_per_million_chars, data_residency, on_prem, launched_at, launched_at_text, multilingual, multilingual_count, endpoint_*, feature_*, use_case_*, strengths, weaknesses, pricing_description, meta_title, meta_description, is_featured). Add UNIQUE(provider_id, definition_name) and UNIQUE(slug).
  - [x] 1.2 Create migration for `compare_pages` table (slug, model_page_a_id, model_page_b_id, meta_title, meta_description). Add CHECK for model_page_a_id != model_page_b_id.
  - [x] 1.3 Add `logo_url` column to `providers` table via migration.
  - [x] 1.4 Add RLS policies: model_pages and compare_pages readable by public (or service role); admin-only write. Ensure providers.logo_url is readable where providers are readable.
  - [x] 1.5 Run migrations and verify schema.

- [x] 2.0 Admin: Model Pages management
  - [x] 2.1 Add "Model Pages" link to admin sidebar (`/admin/model-pages`).
  - [x] 2.2 Create `/admin/model-pages` page: GlassTable with Model Name, Provider, Slug, Rank, Has Page, Last Updated, Actions (Edit, View).
  - [x] 2.3 Create Server Actions: listModelPages, getModelPage, createModelPage, updateModelPage. Validate slug uniqueness, provider+definition exists in provider_model_definitions.
  - [x] 2.4 Create "Create model page" form: select provider, select definition (from provider_model_definitions), slug (required, URL-safe). Pre-fill model name and provider from selection.
  - [x] 2.5 Create "Edit model page" form with all fields: slug, model logo upload, provider logo upload, one_liner, overview_md, rank_override, use_elo_rank, latency_ms, price_input/output, data_residency, on_prem, launched_at/launched_at_text, multilingual, endpoints (streaming/websocket/non-streaming), features (voice_cloning, voice_design, open_source), use_cases (5 checkboxes), strengths, weaknesses, pricing_description, meta_title, meta_description, is_featured (checkbox for Featured Models section).
  - [ ] 2.6 Implement logo upload: add uploadImage (or similar) to R2 storage; API route or Server Action to accept file, upload to R2, return public URL. Store URL in model_pages.logo_url or providers.logo_url.
  - [x] 2.7 Log all create/update/delete to admin_audit_log.
  - [x] 2.8 Admin: Compare pages — add tab or section under model-pages: list compare pages, create/edit forms (slug, Model A, Model B select from model pages). Server Actions for compare page CRUD.

- [x] 3.0 Public: Model page layout
  - [x] 3.1 Create `src/app/models/[slug]/page.tsx`: fetch model page by slug, 404 if not found. Implement generateMetadata for SEO (title, description).
  - [x] 3.2 Create ModelPageHero component: logo, model name, provider name + logo, one-liner, action buttons (Compare → /models/compare, Alternatives → /models/alternatives/[slug]-alternatives, Try in Playground → /custom-test).
  - [x] 3.3 Create ModelStatsBar component: leaderboard rank (resolve via get_leaderboard_global_model + rank_override/use_elo_rank), latency, price, data residency, on-prem, launched, multilingual. Each with icon. Responsive: stack on mobile.
  - [x] 3.4 Create ModelOverview component: overview/TL;DR, callouts (voices, languages, streaming), pricing description, quick comparison bar chart (fetch leaderboard neighbors, use model_pages price data).
  - [x] 3.5 Add Endpoints section: Streaming, WebSocket, Non-streaming (checkboxes from model_pages).
  - [x] 3.6 Add Features section: Languages, Voices, Voice cloning, Voice design, Open source/Proprietary.
  - [x] 3.7 Add Use cases section: Conversational AI, Voice agents, Expressive, Flat content, Multilingual (Supported/Not supported).
  - [x] 3.8 Add Strengths and Weaknesses bullet lists.
  - [x] 3.9 Add footer with internal links: Leaderboard, Compare hub, Methodology, Explore more models.
  - [x] 3.10 Implement getLeaderboardRank helper: call get_leaderboard_global_model, find rank of (provider_id, definition_name); if use_elo_rank and rank exists use it, else use rank_override; else "Unranked".
  - [x] 3.11 Add voice count and language count: query models + provider_model_definitions + model_languages. Cache if needed.

- [x] 4.0 Compare hub and compare pages
  - [x] 4.1 Create `/models/compare` page (compare hub): two model pickers (dropdown or searchable select). Options: all model pages. When both selected, navigate to compare page.
  - [x] 4.2 Compare hub: if admin-created compare page exists for (A,B) or (B,A), redirect to /models/compare/[admin-slug]. Otherwise redirect to /models/compare/[slug-a]-vs-[slug-b].
  - [x] 4.3 Support pre-fill: /models/compare?model=slug — pre-select Model A.
  - [x] 4.4 Create `/models/compare/[slug]/page.tsx`: resolve slug — (1) lookup compare_pages by slug; (2) if not found, parse as slug-a-vs-slug-b (split on last `-vs-`), fetch both model_pages. 404 if either missing.
  - [x] 4.5 Compare page layout: side-by-side (or stacked on mobile) cards for Model A and Model B. Each card: logo, name, provider, one-liner, stats bar (rank, price, latency, data residency, on-prem, multilingual), endpoints, use cases. Link to full model page.
  - [x] 4.6 Compare page SEO: generateMetadata — title "Model A vs Model B | TTS Battles", description.

- [x] 5.0 Alternatives pages
  - [x] 5.1 Create `/models/alternatives/[param]/page.tsx`: param is e.g. `eleven-multilingual-v2-alternatives`. Parse to extract model slug (strip `-alternatives` suffix).
  - [x] 5.2 Fetch anchor model page by slug. 404 if not found.
  - [x] 5.3 Call get_leaderboard_global_model; exclude anchor (provider_id:definition_name); filter to models that have a model_pages row; take top 10 by rating.
  - [x] 5.4 Fetch model_pages for each of the 10 alternatives.
  - [x] 5.5 Render hero: anchor model name, provider, one-liner. H1: "Top 10 alternatives to {Model Name}".
  - [x] 5.6 Render 10 model sections: each with TL;DR at top (one_liner or truncated overview), 14 attributes (logo, name, provider, rank, latency, price, data residency, on-prem, launched, multilingual, endpoints, features, use cases, strengths, weaknesses), "View full details" link to /models/[slug].
  - [x] 5.7 Handle edge case: fewer than 10 alternatives — show however many exist.
  - [x] 5.8 Alternatives page SEO: generateMetadata — title "{Model Name} Alternatives | Top 10 TTS Models | TTS Battles", description.

- [x] 6.0 Integration, SEO, and polish
  - [x] 6.1 Models index: create `/models` page inspired by [OpenAI models](https://developers.openai.com/api/docs/models) with five sections.
  - [x] 6.2 Featured Models section: fetch model_pages where is_featured=true. Display 3–4 cards (logo, name, one-liner, link). Optional "New" badge if launched_at is recent (e.g., last 90 days).
  - [x] 6.3 Models for Voice Agents section (id="voice-agents"): fetch model_pages where use_case_voice_agents=true. Section heading + short description. Grid of model cards.
  - [x] 6.4 Models for creating Multilingual content section (id="multilingual"): fetch model_pages where use_case_multilingual=true. Same layout.
  - [x] 6.5 Models that are very expressive section (id="expressive"): fetch model_pages where use_case_expressive=true. Same layout.
  - [x] 6.6 All Models section (id="all"): fetch all model_pages, sorted by leaderboard rank (or name). Full list with logo, name, provider, one-liner, link to model page.
  - [x] 6.7 Add page navigation (anchor links) to jump to each section. SEO: title "TTS Models | Compare Text-to-Speech | TTS Battles", description.
  - [x] 6.8 Leaderboard: add link from each model row to `/models/[slug]`. Resolve slug from model_pages by (provider_id, definition_name). May require joining leaderboard data with model_pages.
  - [x] 6.9 Add model pages, compare pages, alternatives pages, and /models index to sitemap (if sitemap exists).
  - [x] 6.10 Ensure canonical URLs and meta descriptions on all model, compare, and alternatives pages.
  - [ ] 6.11 Optional: JSON-LD structured data for model pages (Product or SoftwareApplication).
  - [x] 6.12 Verify all internal links: footer (Leaderboard, Compare, Methodology, Models), model page buttons (Compare, Alternatives, Try in Playground), compare page links to both model pages, alternatives page links to full model pages.

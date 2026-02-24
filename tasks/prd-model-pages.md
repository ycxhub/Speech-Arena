# PRD: Model Pages

## Introduction / Overview

Model pages are dedicated, SEO-optimized pages for each TTS engine definition (e.g., "Eleven Multilingual v2") in the TTS Battles catalog. Inspired by [OpenAI's model documentation](https://developers.openai.com/api/docs/models/gpt-5.2), each page presents a comprehensive overview: leaderboard rank, pricing, latency, capabilities, endpoints, and use cases. Model pages help users evaluate and compare TTS models before choosing one, and drive organic traffic through targeted SEO.

**Scope:** One page per TTS engine definition (from `provider_model_definitions`). Each definition can have multiple voices; the model page represents the engine as a whole and shows aggregate stats (e.g., voice count, language count).

**Data source:** Model pages are only created for models that exist in admin (`provider_model_definitions`). Admin selects a definition and fills in the required metadata; the page is generated from that input.

## Goals

1. Provide a rich, OpenAI-style model page for every TTS engine definition in the catalog.
2. Surface leaderboard rank (from ELO when available, manual override otherwise), price, latency, and capabilities at a glance.
3. Enable model-to-model comparison pages with dedicated URLs.
4. Drive SEO through optimized titles, descriptions, H1s, and internal linking.
5. Centralize model metadata management in admin with a single form for all required attributes.
6. Provide alternatives pages that surface the top 10 ranked alternatives to any model, driving "X alternatives" SEO queries.

## User Stories

- **As a visitor**, I want to land on a model page (e.g., `/models/eleven-multilingual-v2`) and quickly see its leaderboard rank, price, latency, and what it's best for.
- **As a visitor**, I want to use the compare hub to pick two models and view them side-by-side at `/models/compare/[slug]`.
- **As a visitor**, I want to discover model pages from the leaderboard (e.g., clicking a model name links to its page).
- **As an admin**, I want to create and edit model pages by selecting an existing definition and filling in the 14 required attributes.
- **As an admin**, I want to define a URL slug for each model page and each compare page so URLs are clean and SEO-friendly.
- **As a search engine**, I want well-structured metadata (title, description, H1) and internal links to index model pages effectively.
- **As a visitor**, I want to find "ElevenLabs alternatives" and see the top 10 ranked alternatives with summarized info from each model's page.
- **As a visitor**, I want to browse the `/models` hub to discover models by category (Featured, Voice Agents, Multilingual, Expressive) or see the full list.

## Functional Requirements

### URL Structure

1. **Model page route**: `/models/[slug]` — e.g., `/models/eleven-multilingual-v2`. Slug is admin-defined, unique across all model pages.

2. **Compare hub route**: `/models/compare` — A hub where the user picks two models (Model A and Model B) from dropdowns or selects. When both are selected, the user is navigated to the relevant compare page.

3. **Compare page route**: `/models/compare/[slug]` — e.g., `/models/compare/eleven-multilingual-vs-openai-tts`. Two slug types are supported:
   - **Admin-defined**: Admin creates a compare page with a custom slug (e.g., `eleven-multilingual-vs-openai-tts`). Stored in `compare_pages`.
   - **Dynamic**: When the user picks two models from the compare hub and no admin-created page exists for that pair, the URL is `/models/compare/[slug-a]-vs-[slug-b]` (using model page slugs). The page renders the comparison on the fly. Slug parsing: split on the last `-vs-` to handle model slugs that contain "vs" (e.g., `eleven-vs-competitor-vs-openai-tts` → `eleven-vs-competitor` and `openai-tts`).

4. **Models index**: `/models` — Hub page inspired by [OpenAI's models page](https://developers.openai.com/api/docs/models). Five sections with anchor IDs for deep linking:
   - **Featured Models** — 3–4 curated models (admin marks `is_featured` on model_pages). Each card: logo, name, one-liner, link to model page. Optional "New" badge for recently launched models.
   - **Models for Voice Agents** — Models where `use_case_voice_agents = true`. Section heading + description. Grid of model cards (logo, name, one-liner, link).
   - **Models for creating Multilingual content** — Models where `use_case_multilingual = true`. Same card layout.
   - **Models that are very expressive** — Models where `use_case_expressive = true`. Same card layout.
   - **All Models** — Full list of all model pages, sorted by leaderboard rank (or name). Each row/card: logo, name, provider, one-liner, link to model page.

5. **Alternatives page route**: `/models/alternatives/[slug]-alternatives` — e.g., `/models/alternatives/eleven-multilingual-v2-alternatives`. Shows the top 10 ranked alternatives to the given model. Auto-generated: no admin setup required. The anchor model (identified by `slug` before `-alternatives`) must have a model page. 404 if slug is invalid or model page doesn't exist.

### Model Page Layout (OpenAI-Inspired)

The layout follows the structure of [OpenAI's GPT-5.2 model page](https://developers.openai.com/api/docs/models/gpt-5.2). All attributes use visual icons.

#### Hero Section (Top)

4. **Model logo** — Image displayed in a fixed-width container (e.g., 200px). Logos are **uploaded** in the model pages admin section (stored in R2 or similar; URL saved in DB). Fallback: provider logo or a generic TTS icon if no model logo is set.

5. **Model name** — Large heading (e.g., `text-2xl font-semibold`). Sourced from `provider_model_definitions.name` or admin override.

6. **Provider name** — Displayed below or beside the model name, with provider logo. **Provider logos are also uploaded** in the model pages admin section (`/admin/model-pages`). Links to provider if a provider page exists (future).

7. **One-liner description** — Short tagline (e.g., "The best model for expressive, multilingual content"). Admin-editable. Hidden on small screens, visible from `sm:` breakpoint.

8. **Action buttons** — "Compare" (links to the **compare hub** at `/models/compare`), "Alternatives" (links to `/models/alternatives/[slug]-alternatives`), and "Try in Playground" (links to `/custom-test`). All use existing GlassButton styling.

#### Stats Bar (Horizontal Cards)

A horizontal row of stat cards, each with an icon and label. Responsive: stacks vertically on mobile, horizontal on `lg:`.

9. **Leaderboard rank** — "Rank 3/15" (or "Unranked" if no ELO data and no manual override). Icon: trophy or ranking. Logic: Use ELO rank from `get_leaderboard_global_model` when the model has matches; otherwise use admin-entered manual rank. If both exist, prefer ELO (or make configurable: "Use ELO" checkbox — if unchecked, use manual).

10. **Latency** — Value in milliseconds (e.g., "450 ms"). Icon: clock/speed. Admin-editable. Format: "X ms" or "~X ms" if approximate.

11. **Price** — **Standardized on per 1M characters** across all providers. Format: "$X.XX • $Y.YY Input • Output" or single value if flat. Icon: dollar. Admin-editable.

12. **Data residency** — Text (e.g., "US, EU, 10+ regions"). Icon: globe. Admin-editable.

13. **On-prem availability** — "Yes" or "No". Icon: server/on-prem. Admin-editable (boolean).

14. **Launched** — Date when the model was released (e.g., "Jan 2024"). Icon: calendar. Admin-editable.

15. **Multilingual** — "Yes" or "No" (or number of languages, e.g., "32 languages"). Icon: languages. Can be derived from `model_languages` count for linked models, or admin override.

#### Overview Section

16. **Overview / TL;DR** — Rich text or markdown description. Admin-editable. Reference docs link if applicable.

17. **Callouts** — Sidebar or inline bullets with key facts, e.g.:
    - "X voices"
    - "Y languages"
    - "Streaming supported"
    Sourced from admin and/or derived from linked `models` and `model_languages`.

#### Pricing Section

18. **Pricing description** — Paragraph explaining how pricing works. **All prices are per 1M characters** (standardized). E.g., "Pricing is per 1M characters. Input and output may be billed separately." Admin-editable.

19. **Quick comparison bar chart** — Horizontal bar graph comparing this model's price to 3–5 other closely ranked models (from leaderboard). Same format as OpenAI: model name, price value, relative bar length. Data: fetch leaderboard, pick neighbors by rank, use `model_pages` price data. If a model has no price in `model_pages`, omit or show "—".

#### Endpoints Section

20. **Endpoints** — List of supported access methods, each with icon and label:
    - **Streaming** — Yes/No
    - **WebSocket** — Yes/No
    - **Non-streaming (generate)** — Yes/No
    Admin-editable (checkboxes). Display as a grid of endpoint cards.

#### Features Section

21. **Features** — Checklist with icons:
    - **Languages** — Count or "Multilingual" (from data or admin).
    - **Voices** — Count (from `provider_voices` / `models` for this definition).
    - **Voice cloning** — Yes/No.
    - **Voice design** — Yes/No.
    - **Open source / Proprietary** — One or the other.
    All admin-editable.

#### Use Cases Section

22. **Use cases (Tools)** — What the model is best for:
    - Conversational AI — Supported / Not supported
    - Voice agents — Supported / Not supported
    - Expressive content — Supported / Not supported
    - Flat / non-expressive content — Supported / Not supported
    - Multilingual capabilities — Supported / Not supported
    Admin-editable. Display similar to OpenAI's "Tools" section.

23. **Strengths** — Bullet list of what the model excels at. Admin-editable.

24. **Weaknesses / Limitations** — Bullet list of what it's not good for. Admin-editable.

#### Footer & Internal Linking

25. **Footer** — Links to: Leaderboard, Compare hub (`/models/compare`), Methodology, other model pages (e.g., "Explore more models"). Ensures internal linking for SEO.

### Admin: Model Pages Management

26. **Admin route**: `/admin/model-pages` — New section in admin sidebar.

27. **Model pages list** — GlassTable with columns: Model Name, Provider, Slug, Rank (ELO or manual), Has Page (yes/no), Last Updated, Actions (Edit, View).

28. **Create model page** — Button opens a form. Admin selects a **provider** and **definition** (from `provider_model_definitions` for that provider). Slug is required, unique, URL-safe (lowercase, hyphens). Pre-fill model name and provider from selection.

29. **Edit model page** — Form with all 14+ attributes. Fields:
    - **Slug** (required, unique)
    - **Model logo** (upload; stored in R2, URL saved in `model_pages.logo_url`)
    - **Provider logo** (upload; stored in R2, URL saved in `providers.logo_url`; upload UI in model-pages admin when editing a model; one logo per provider)
    - **One-liner** (required)
    - **Overview / description** (rich text)
    - **Leaderboard rank override** (optional; if set, use this instead of ELO when ELO is unavailable)
    - **Use ELO rank when available** (checkbox; default true)
    - **Latency (ms)** (number)
    - **Price input** (decimal, per 1M characters)
    - **Price output** (decimal, per 1M characters)
    - **Data residency** (text)
    - **On-prem** (Yes/No)
    - **Launched** (date or text)
    - **Multilingual** (Yes/No or number)
    - **Endpoints**: Streaming, WebSocket, Non-streaming (checkboxes)
    - **Features**: Voice cloning, Voice design, Open source/Proprietary
    - **Use cases**: Conversational AI, Voice agents, Expressive, Flat content, Multilingual (Supported/Not supported each)
    - **Strengths** (bullet list)
    - **Weaknesses** (bullet list)
    - **Pricing description** (textarea)
    - **Featured** (checkbox) — When checked, model appears in "Featured Models" section on `/models`.

30. **Validation** — Slug must be unique. Provider + definition must exist in `provider_model_definitions`. At least one of (ELO rank, manual rank) or "Unranked" display.

31. **Audit log** — All create/update/delete actions on model pages are logged to `admin_audit_log`.

### Compare Page

32. **Compare page layout** — Side-by-side (or stacked on mobile) comparison of two models. Each model shows: logo, name, provider, one-liner, and a subset of attributes (rank, price, latency, data residency, on-prem, multilingual, endpoints, use cases). Reuse the same stat cards and feature lists as the model page.

33. **Compare page URL** — Admin-defined slug: `/models/compare/[slug]`. Admin creates a compare page, selects Model A and Model B (from model pages), and defines the slug (e.g., `eleven-multilingual-vs-openai-tts`). 404 if slug is invalid. No slug parsing needed — the slug is a single identifier stored in the database.

34. **Admin: Compare pages** — New section or tab under `/admin/model-pages`: list of compare pages, create/edit forms. Fields: Slug (required, unique), Model A (select from model pages), Model B (select from model pages). Audit log for create/update/delete.

35. **Compare hub** — At `/models/compare`, user sees two model pickers (Model A and Model B). When both are selected, navigate to the relevant compare page:
   - If an admin-created compare page exists for that pair (in `compare_pages`), redirect to `/models/compare/[admin-slug]`.
   - Otherwise, redirect to `/models/compare/[slug-a]-vs-[slug-b]` (dynamic compare page).
   - From a model page, "Compare" links to `/models/compare` (optionally with Model A pre-filled via query param, e.g. `/models/compare?model=eleven-multilingual-v2`).

36. **Compare page SEO** — Title: "Model A vs Model B | TTS Battles". Description: "Compare Model A and Model B: pricing, latency, and capabilities."

### Alternatives Page

37. **Alternatives page layout** — At `/models/alternatives/[slug]-alternatives`, display:
    - **Hero**: Anchor model name, provider, one-liner. "Top 10 alternatives to {Model Name}" as H1 or subheading.
    - **10 alternative models**: Each alternative is a summarized section. Order: by leaderboard rank (top 10, excluding the anchor model).
    - **Per-model section** (for each of the 10 alternatives):
      - **TL;DR at top**: One-liner or brief summary from the model's `model_pages` (e.g., `one_liner` or truncated `overview_md`).
      - **14 attributes** (with icons): Logo, Model name, Provider, Leaderboard rank, Latency, Price, Data residency, On-prem, Launched, Multilingual, Endpoints (Streaming/WebSocket/Non-streaming), Features (Languages, Voices, Voice cloning, etc.), Use cases, Strengths, Weaknesses.
      - **Link to full model page**: "View full details" or similar CTA linking to `/models/[slug]`.

38. **Alternatives data source** — All content is **retrieved from each model's model page** (`model_pages` table). No separate admin input for alternatives pages. Leaderboard rank determines which 10 models are shown (from `get_leaderboard_global_model`, exclude the anchor model, take top 10 by rating). Only include alternatives that have a model page.

39. **Alternatives page SEO** — Title: "{Model Name} Alternatives | Top 10 TTS Models | TTS Battles". Description: "Discover the top 10 alternatives to {Model Name}. Compare pricing, latency, and capabilities." H1: "{Model Name} Alternatives" or "Top 10 Alternatives to {Model Name}".

40. **Alternatives page linking** — Add "View alternatives" or "Alternatives" link on each model page, pointing to `/models/alternatives/[slug]-alternatives`. Footer links to alternatives hub if applicable.

41. **Edge cases** — If fewer than 10 models have model pages (excluding anchor), show however many exist. If anchor model has no model page, 404.

### SEO

42. **Metadata** — Each model page has:
    - **Title**: `{Model Name} | TTS Battles` or custom admin override.
    - **Description**: Meta description, 150–160 chars. From one-liner or admin override.
    - **H1**: Model name (one per page).
    - **Canonical URL**: `https://{domain}/models/{slug}`.

43. **Structured data** — Optional: JSON-LD for `Product` or `SoftwareApplication` with name, description, provider. Improves rich snippets.

44. **Internal linking** — Footer links to leaderboard, methodology, other models. Leaderboard links each model name to its model page. Compare pages link to both model pages. Model pages link to their alternatives page (`/models/alternatives/[slug]-alternatives`).

45. **Sitemap** — Include `/models/[slug]`, `/models/compare/[slug]`, and `/models/alternatives/[slug]-alternatives` in sitemap for discovery.

## Non-Goals (Out of Scope)

- Model pages for individual voices (only engine definitions).
- Admin-created model pages for models not in `provider_model_definitions`.
- Requiring admin to create a compare page before any two models can be compared (the compare hub supports dynamic comparisons).
- Real-time leaderboard rank updates (rank is computed on page load; no WebSocket).
- User-generated content (reviews, ratings) on model pages.
- A/B testing or analytics for model page variants (use existing analytics).

## Design Considerations

- **Layout reference**: [OpenAI GPT-5.2 model page](https://developers.openai.com/api/docs/models/gpt-5.2). Match the visual hierarchy: hero with logo/name/description, horizontal stat bar, then sections (Pricing, Endpoints, Features, Use cases).
- **Icons**: Use a consistent icon set (e.g., Lucide, Heroicons) for each attribute. Ensure icons are accessible (aria-labels where needed).
- **Responsive**: Stats bar stacks on mobile. Compare page stacks model cards on small screens.
- **Glass design**: Reuse existing `GlassCard`, `GlassBadge`, `GlassButton` for consistency with the rest of the app.
- **Empty states**: If a model has no ELO data and no manual rank, show "Unranked" with a subtle note. If price is missing, show "—" in comparison chart.
- **Alternatives page**: Each of the 10 model sections should be a compact card or expandable block. TL;DR prominent at top; 14 attributes in a condensed layout (e.g., icon grid). Link to full model page for details.
- **Models index** (`/models`): Section layout similar to [OpenAI models](https://developers.openai.com/api/docs/models) — Featured (horizontal cards), then categorized sections (Voice Agents, Multilingual, Expressive), then All Models. Use anchor IDs (`#voice-agents`, `#multilingual`, `#expressive`, `#all`) for in-page navigation.

## Technical Considerations

### Database Schema

Create a new table `model_pages`:

```sql
CREATE TABLE public.model_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  definition_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,                    -- from upload (R2); model logo
  one_liner text NOT NULL,
  overview_md text,
  rank_override integer,           -- manual rank when ELO unavailable
  use_elo_rank boolean NOT NULL DEFAULT true,
  latency_ms integer,
  price_input_per_million_chars decimal,
  price_output_per_million_chars decimal,
  data_residency text,
  on_prem boolean,
  launched_at date,
  launched_at_text text,            -- or use text for "Jan 2024" style
  multilingual boolean,
  multilingual_count integer,
  endpoint_streaming boolean DEFAULT false,
  endpoint_websocket boolean DEFAULT false,
  endpoint_non_streaming boolean DEFAULT false,
  feature_voice_cloning boolean,
  feature_voice_design boolean,
  feature_open_source boolean,
  use_case_conversational boolean,
  use_case_voice_agents boolean,
  use_case_expressive boolean,
  use_case_flat_content boolean,
  use_case_multilingual boolean,
  strengths text[],                 -- or jsonb
  weaknesses text[],
  pricing_description text,
  meta_title text,
  meta_description text,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, definition_name)
);
```

Add RLS: public read for `model_pages` (or no RLS if using service role for reads). Admin-only write.

**Link to provider_model_definitions**: `(provider_id, definition_name)` must match a row where `provider_model_definitions.name = definition_name`. Enforce via application logic or a trigger.

### Data Flow

- **Leaderboard rank**: On model page load, call `get_leaderboard_global_model`, find rank of `(provider_id, definition_name)`. If `use_elo_rank` and rank exists, use it. Else use `rank_override` if set. Else show "Unranked".
- **Voice count / language count**: Query `models` joined with `provider_model_definitions` and `model_languages` to get counts. Cache if needed.
- **Compare page**: Given slug from URL: (1) First lookup `compare_pages` by slug. If found, fetch both model pages and render. (2) If not found, parse slug as `[slug-a]-vs-[slug-b]` (split on last `-vs-`), fetch both `model_pages` by slug, render side-by-side. 404 if either model page doesn't exist.
- **Alternatives page**: Parse URL to get anchor slug (e.g., `eleven-multilingual-v2` from `eleven-multilingual-v2-alternatives`). Fetch anchor model page. Call `get_leaderboard_global_model`, exclude anchor (by `provider_id:definition_name`), filter to models that have a `model_pages` row, take top 10 by rating. Fetch `model_pages` for each. Render 10 summarized sections with TL;DR + 14 attributes each.

Create a new table `compare_pages`:

```sql
CREATE TABLE public.compare_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  model_page_a_id uuid NOT NULL REFERENCES public.model_pages(id) ON DELETE CASCADE,
  model_page_b_id uuid NOT NULL REFERENCES public.model_pages(id) ON DELETE CASCADE,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (model_page_a_id != model_page_b_id)
);
```

### Routes

- `src/app/models/page.tsx` — Models index (list of model pages).
- `src/app/models/[slug]/page.tsx` — Single model page.
- `src/app/models/compare/page.tsx` — Compare hub. User picks two models; on selection, redirect to `/models/compare/[slug]`.
- `src/app/models/compare/[slug]/page.tsx` — Compare page. Resolve slug: first try `compare_pages`; if not found, parse as `slug-a-vs-slug-b` and fetch both model pages.
- `src/app/models/alternatives/[param]/page.tsx` — Alternatives page. URL segment is `[slug]-alternatives` (e.g., `eleven-multilingual-v2-alternatives`). Parse to extract model slug (strip `-alternatives` suffix). Fetch anchor model page, get top 10 alternatives from leaderboard (excluding anchor, only models with model pages), fetch their model_pages, render summarized sections.

### Integration Points

- **Leaderboard**: Add link from each model row to `/models/[slug]`. Resolve slug from `model_pages` by `(provider_id, definition_name)`.
- **Custom test**: "Try in Playground" links to `/custom-test`.
- **Admin sidebar**: Add "Model Pages" under a new or existing section.

### Verification

- Verify [Next.js metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) (2026) for `generateMetadata` in app router.
- **Compare slug resolution**: First lookup `compare_pages` by slug. If not found, parse as `slug-a-vs-slug-b` (split on last `-vs-`) for dynamic compare pages from the hub.

## Success Metrics

- Every model in `provider_model_definitions` that has a model page is discoverable at `/models/[slug]`.
- Model pages load in < 2 seconds (server-rendered).
- Compare pages are created by admin with custom slugs; each compare page links two model pages.
- Admin can create a full model page in under 5 minutes.
- SEO: Model pages are indexed with correct titles and descriptions. Internal links from leaderboard and footer are in place.

### Logo Storage

- **Model logo**: Stored in `model_pages.logo_url` (uploaded to R2, URL saved).
- **Provider logo**: Providers have logos. Upload UI lives in `/admin/model-pages` — when editing a model page, admin can upload the provider's logo. Add `providers.logo_url` via migration to store the URL. One logo per provider, shared across all model pages for that provider.

## Open Questions

_None at this time._

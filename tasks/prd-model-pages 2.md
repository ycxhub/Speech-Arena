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

## User Stories

- **As a visitor**, I want to land on a model page (e.g., `/models/eleven-multilingual-v2`) and quickly see its leaderboard rank, price, latency, and what it's best for.
- **As a visitor**, I want to compare two models side-by-side at `/models/compare/model-a-vs-model-b`.
- **As a visitor**, I want to discover model pages from the leaderboard (e.g., clicking a model name links to its page).
- **As an admin**, I want to create and edit model pages by selecting an existing definition and filling in the 14 required attributes.
- **As an admin**, I want to define a URL slug for each model page so URLs are clean and SEO-friendly.
- **As a search engine**, I want well-structured metadata (title, description, H1) and internal links to index model pages effectively.

## Functional Requirements

### URL Structure

1. **Model page route**: `/models/[slug]` — e.g., `/models/eleven-multilingual-v2`. Slug is admin-defined, unique across all model pages.

2. **Compare page route**: `/models/compare/[slug-a]-vs-[slug-b]` — e.g., `/models/compare/eleven-multilingual-v2-vs-openai-tts-1`. Compare pages are auto-generated for any pair of models that have pages. The order in the URL is arbitrary; the page displays both models in a consistent layout.

3. **Models index (optional)**: `/models` — lists all model pages with links. Can be a simple grid or table linking to each model page.

### Model Page Layout (OpenAI-Inspired)

The layout follows the structure of [OpenAI's GPT-5.2 model page](https://developers.openai.com/api/docs/models/gpt-5.2). All attributes use visual icons.

#### Hero Section (Top)

4. **Model logo** — Image (URL stored in admin). Displayed in a fixed-width container (e.g., 200px). Fallback: provider logo or a generic TTS icon if no logo is set.

5. **Model name** — Large heading (e.g., `text-2xl font-semibold`). Sourced from `provider_model_definitions.name` or admin override.

6. **Provider name** — Displayed below or beside the model name, with optional provider logo. Links to provider if a provider page exists (future).

7. **One-liner description** — Short tagline (e.g., "The best model for expressive, multilingual content"). Admin-editable. Hidden on small screens, visible from `sm:` breakpoint.

8. **Action buttons** — "Compare" (links to compare page selector or pre-filled comparison) and "Try in Playground" (links to blind test or custom test with this model pre-selected). Both use existing GlassButton styling.

#### Stats Bar (Horizontal Cards)

A horizontal row of stat cards, each with an icon and label. Responsive: stacks vertically on mobile, horizontal on `lg:`.

9. **Leaderboard rank** — "Rank 3/15" (or "Unranked" if no ELO data and no manual override). Icon: trophy or ranking. Logic: Use ELO rank from `get_leaderboard_global_model` when the model has matches; otherwise use admin-entered manual rank. If both exist, prefer ELO (or make configurable: "Use ELO" checkbox — if unchecked, use manual).

10. **Latency** — Value in milliseconds (e.g., "450 ms"). Icon: clock/speed. Admin-editable. Format: "X ms" or "~X ms" if approximate.

11. **Price** — Per 1M characters (or per 1M tokens, depending on provider billing). Format: "$X.XX • $Y.YY Input • Output" or single value if flat. Icon: dollar. Admin-editable.

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

18. **Pricing description** — Paragraph explaining how pricing works (e.g., "Pricing is per 1M characters. Input and output may be billed separately."). Admin-editable.

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

25. **Footer** — Links to: Leaderboard, Compare models, Methodology, other model pages (e.g., "Explore more models"). Ensures internal linking for SEO.

### Admin: Model Pages Management

26. **Admin route**: `/admin/model-pages` — New section in admin sidebar.

27. **Model pages list** — GlassTable with columns: Model Name, Provider, Slug, Rank (ELO or manual), Has Page (yes/no), Last Updated, Actions (Edit, View).

28. **Create model page** — Button opens a form. Admin selects a **provider** and **definition** (from `provider_model_definitions` for that provider). Slug is required, unique, URL-safe (lowercase, hyphens). Pre-fill model name and provider from selection.

29. **Edit model page** — Form with all 14+ attributes. Fields:
    - **Slug** (required, unique)
    - **Model logo URL** (optional)
    - **One-liner** (required)
    - **Overview / description** (rich text)
    - **Leaderboard rank override** (optional; if set, use this instead of ELO when ELO is unavailable)
    - **Use ELO rank when available** (checkbox; default true)
    - **Latency (ms)** (number)
    - **Price input** (decimal, per 1M)
    - **Price output** (decimal, per 1M)
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

30. **Validation** — Slug must be unique. Provider + definition must exist in `provider_model_definitions`. At least one of (ELO rank, manual rank) or "Unranked" display.

31. **Audit log** — All create/update/delete actions on model pages are logged to `admin_audit_log`.

### Compare Page

32. **Compare page layout** — Side-by-side (or stacked on mobile) comparison of two models. Each model shows: logo, name, provider, one-liner, and a subset of attributes (rank, price, latency, data residency, on-prem, multilingual, endpoints, use cases). Reuse the same stat cards and feature lists as the model page.

33. **Compare page URL** — Built from slugs: `/models/compare/[slug-a]-vs-[slug-b]`. Both slugs must have model pages. 404 if either slug is invalid.

34. **Navigation to compare** — From model page "Compare" button: could link to `/models/compare?model=slug-a` and show a model picker, or link directly to a default comparison (e.g., vs. the next-ranked model). From leaderboard: "Compare" action could open a modal to pick a second model, then navigate to the compare URL.

35. **Compare page SEO** — Title: "Model A vs Model B | TTS Battles". Description: "Compare Model A and Model B: pricing, latency, and capabilities."

### SEO

36. **Metadata** — Each model page has:
    - **Title**: `{Model Name} | TTS Battles` or custom admin override.
    - **Description**: Meta description, 150–160 chars. From one-liner or admin override.
    - **H1**: Model name (one per page).
    - **Canonical URL**: `https://{domain}/models/{slug}`.

37. **Structured data** — Optional: JSON-LD for `Product` or `SoftwareApplication` with name, description, provider. Improves rich snippets.

38. **Internal linking** — Footer links to leaderboard, methodology, other models. Leaderboard links each model name to its model page. Compare pages link to both model pages.

39. **Sitemap** — Include `/models/[slug]` and `/models/compare/[a]-vs-[b]` in sitemap for discovery.

## Non-Goals (Out of Scope)

- Model pages for individual voices (only engine definitions).
- Admin-created model pages for models not in `provider_model_definitions`.
- Curated compare pages (all comparisons are auto-generated from model page pairs).
- Real-time leaderboard rank updates (rank is computed on page load; no WebSocket).
- User-generated content (reviews, ratings) on model pages.
- A/B testing or analytics for model page variants (use existing analytics).

## Design Considerations

- **Layout reference**: [OpenAI GPT-5.2 model page](https://developers.openai.com/api/docs/models/gpt-5.2). Match the visual hierarchy: hero with logo/name/description, horizontal stat bar, then sections (Pricing, Endpoints, Features, Use cases).
- **Icons**: Use a consistent icon set (e.g., Lucide, Heroicons) for each attribute. Ensure icons are accessible (aria-labels where needed).
- **Responsive**: Stats bar stacks on mobile. Compare page stacks model cards on small screens.
- **Glass design**: Reuse existing `GlassCard`, `GlassBadge`, `GlassButton` for consistency with the rest of the app.
- **Empty states**: If a model has no ELO data and no manual rank, show "Unranked" with a subtle note. If price is missing, show "—" in comparison chart.

## Technical Considerations

### Database Schema

Create a new table `model_pages`:

```sql
CREATE TABLE public.model_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  definition_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  one_liner text NOT NULL,
  overview_md text,
  rank_override integer,           -- manual rank when ELO unavailable
  use_elo_rank boolean NOT NULL DEFAULT true,
  latency_ms integer,
  price_input_per_million decimal,
  price_output_per_million decimal,
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
- **Compare page**: Given two slugs, fetch both `model_pages`. Validate both exist. Render side-by-side.

### Routes

- `src/app/models/page.tsx` — Models index (list of model pages).
- `src/app/models/[slug]/page.tsx` — Single model page.
- `src/app/models/compare/[[...slugs]]/page.tsx` — Compare page. URL: `/models/compare/a-vs-b`. Parse `a-vs-b` to extract slugs `a` and `b`.

### Integration Points

- **Leaderboard**: Add link from each model row to `/models/[slug]`. Resolve slug from `model_pages` by `(provider_id, definition_name)`.
- **Blind test / Custom test**: "Try in Playground" can link to `/blind-test?model=slug` or similar if pre-selection is supported.
- **Admin sidebar**: Add "Model Pages" under a new or existing section.

### Verification

- Verify [Next.js metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) (2026) for `generateMetadata` in app router.
- Ensure slug parsing for compare URLs handles edge cases (e.g., slugs with "vs" in them — use a different separator or encode).

## Success Metrics

- Every model in `provider_model_definitions` that has a model page is discoverable at `/models/[slug]`.
- Model pages load in < 2 seconds (server-rendered).
- Compare pages are generated for all pairs of models with pages.
- Admin can create a full model page in under 5 minutes.
- SEO: Model pages are indexed with correct titles and descriptions. Internal links from leaderboard and footer are in place.

## Open Questions

1. **Slug with "vs"**: If a model slug is `eleven-vs-competitor`, the compare URL `/models/compare/eleven-vs-competitor-vs-other` could be ambiguous. Consider using a different separator (e.g., `--vs--`) or storing compare URLs in a separate table.
2. **Provider logo**: Do providers have logos in the system? If not, use a placeholder or text-only.
3. **"Try in Playground"**: Does the blind test support pre-selecting a model? If not, link to blind test without pre-selection.
4. **Price unit**: Standardize on "per 1M characters" or "per 1M tokens" across all providers. Document in admin.
5. **Compare page model picker**: Should "Compare" on a model page open a dropdown of other models, or link to a dedicated compare hub where user picks two models?

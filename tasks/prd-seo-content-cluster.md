# PRD: SEO Content Cluster

## Introduction / Overview

This PRD defines an SEO-focused content cluster that drives organic traffic to the TTS Battles site. The cluster includes a home page optimized for "best text to speech" and a set of provider-centric pages (alternatives, comparisons, latency, best voices). All pages are **public** (no login required) and offer a **free** listen-and-compare experience similar to the blind test. To control costs, audio is **cached** (30-day expiry) and **pre-warmed via cron**; anonymous users are **rate-limited** to 10 listens per identity.

**Goals:**
1. Drive organic traffic via SEO-optimized pages.
2. Provide a free, engaging listen-and-compare experience for visitors.
3. Keep API costs under control through caching and rate limiting.

---

## Goals

1. Optimize the home page for the query "best text to speech".
2. Create provider-centric SEO pages: alternatives, versus, latency, best voices.
3. Allow anonymous users to listen to and compare TTS samples without logging in.
4. Enforce a 10-sample rate limit per anonymous user (cookie + fingerprint).
5. Cache all audio for 30 days; pre-warm via cron so no API calls occur on user visits.
6. Reuse the blind-test-style A/B comparison UI (listen, reveal labels after interaction).

---

## User Stories

- **As a visitor**, I want to land on the home page and understand what TTS Battles offers, so I can decide whether to explore further.
- **As a visitor**, I want to search "11 Labs alternatives" and find a page where I can listen to ElevenLabs vs competitors side by side.
- **As a visitor**, I want to search "11 Labs versus Cartesia" and compare those two providers directly.
- **As a visitor**, I want to search "11 Labs best voices" and hear top voices from ElevenLabs.
- **As a visitor**, I want to search "11 Labs latency" and see historical latency stats plus optionally run a live test.
- **As a visitor**, I want to listen to samples without creating an account, with a fair limit so I can evaluate before signing up.
- **As the site owner**, I want all audio served from cache so API costs stay predictable.

---

## Page Structure

### 1. Home Page (existing `/`)

- **Target query:** "best text to speech"
- **Changes:** Add SEO metadata (title, description, structured data), hero copy, and links to key provider pages.
- **Experience:** CTA to try a sample comparison or explore provider pages.

### 2. Generic / Hub Pages

| Route | Target Query | Description |
|-------|--------------|-------------|
| `/alternatives` | "text to speech alternatives", "TTS alternatives" | List of provider alternatives; links to provider-specific pages. |
| `/compare` | "compare text to speech", "TTS comparison" | Hub for provider vs provider comparisons. |

### 3. Provider-Specific Pages (per provider slug)

For each provider (e.g., ElevenLabs → `elevenlabs`), create:

| Route Pattern | Example | Target Query |
|---------------|---------|--------------|
| `/[slug]/alternatives` | `/elevenlabs/alternatives` | "11 Labs alternatives", "ElevenLabs alternatives" |
| `/[slug]/vs/[otherSlug]` | `/elevenlabs/vs/cartesia` | "11 Labs versus Cartesia", "ElevenLabs vs Cartesia" |
| `/[slug]/latency` | `/elevenlabs/latency` | "11 Labs latency", "ElevenLabs API latency" |
| `/[slug]/best-voices` | `/elevenlabs/best-voices` | "11 Labs best voices", "ElevenLabs top voices" |

**Provider vs provider scope:** Curated list only. See [Curated Comparison Input](#curated-comparison-input) below.

### 4. Model-Level Comparison (Phase 2 — deferred)

| Route Pattern | Example | Target Query |
|---------------|---------|--------------|
| `/[slug]/vs/[otherSlug]/models` | `/elevenlabs/vs/cartesia/models` | "ElevenLabs Multilingual vs Cartesia Sonic" |

**Scope:** Deferred to Phase 2. Implement provider-level pages first.

---

## Curated Comparison Input

Provider vs provider pages are generated only for a **curated list** you define. Recommended input formats:

### Option A: Config File (Recommended)

**File:** `config/seo-provider-comparisons.json` (at repo root; `config/` keeps config files grouped and separate from source code)

```json
{
  "providerComparisons": [
    { "providerA": "elevenlabs", "providerB": "cartesia" },
    { "providerA": "elevenlabs", "providerB": "openai-tts" },
    { "providerA": "cartesia", "providerB": "openai-tts" }
  ]
}
```

**Pros:** Version controlled, easy to edit, no DB migration.  
**Cons:** Requires deploy to add/remove comparisons.

### Option B: Database Table

**Table:** `seo_provider_comparisons`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| provider_a_slug | text | FK to providers.slug |
| provider_b_slug | text | FK to providers.slug |
| is_active | boolean | Default true |
| created_at | timestamptz | |

**Pros:** Editable via admin UI, no deploy for changes.  
**Cons:** Requires migration and admin UI.

### Recommendation

- **Phase 1:** Use **Option A** (config file). Simple, fast to implement.
- **Phase 2:** Add Option B if you want to manage comparisons from the admin panel.

**Validation:** At build or runtime, validate that `providerA` and `providerB` exist in `providers` and have `is_active = true`. Generate pages only for valid pairs.

---

## Functional Requirements

### SEO & Metadata

1. **Home page:** Add `<title>`, `<meta name="description">`, Open Graph tags, and JSON-LD structured data targeting "best text to speech".
2. **Provider pages:** Dynamic metadata per route (e.g., "11 Labs Alternatives - Compare TTS Voices | Speech Arena").
3. **Canonical URLs:** Each page has a canonical URL to avoid duplicate content.
4. **Sitemap:** Include all SEO pages in `sitemap.xml` for indexing.

### Public Listen Experience (No Login)

5. **Listen UI:** Same pattern as blind test: two audio cards (A/B), play button, listen-time indicator. Labels (e.g., "ElevenLabs", "Cartesia") are **hidden initially** and **revealed after** the user has listened (or after a minimum listen time).
6. **Sentence selection:** For comparison pages, use a fixed set of SEO sentences (e.g., 3–5 sentences per language) so the cron can pre-warm them.
7. **Language picker:** Allow visitors to switch language; audio is served from cache for the selected language.

### Rate Limiting (10 Samples per User)

8. **Identity:** Combine **cookie** (localStorage fallback if cookies disabled) + **IP** + **User-Agent** fingerprint. Store a hash of this combination.
9. **Limit:** 10 "listen" events per identity per **24-hour** rolling window.
10. **Enforcement:** When limit exceeded, show message: "You've reached the free listen limit. Sign up to continue comparing voices."
11. **Storage:** Use a lightweight table or Redis for rate-limit counters. Key: `hash(ip, ua, cookieId)`.

### Audio Caching (30-Day Expiry)

12. **Cache key:** `(model_id, sentence_id)` — same as existing `audio_files` unique constraint.
13. **Expiry:** Add `expires_at` column to `audio_files` (or a separate `seo_audio_cache` table). Default: `created_at + 30 days`.
14. **Lookup:** Before serving audio, check cache. If expired or missing, trigger generation (cron only; never on user request for SEO pages).
15. **Pre-warm:** Cron job generates audio for all (sentence, model) pairs used by SEO pages. Run daily or on deploy.

### Pre-Warming Strategy

16. **Cron job:** Run `preGenerateSeoAudio()` (or extend `preGenerateAudio`) to generate audio for:
    - All sentences in the SEO sentence set.
    - All models (or a curated subset) for providers that appear on SEO pages.
17. **Sentence set:** Define a fixed list of sentence IDs (or tags) for SEO. E.g., `config/seo-sentences.json` or a `is_seo_sample` flag on `sentences`. See [SEO Sentences Per Language](#seo-sentences-per-language) below.
18. **No on-demand generation for SEO:** If cache miss on user visit, show "Sample not available" or a fallback — do **not** call the TTS API.

### Latency Page Content

19. **Historical stats:** Query `audio_files` for `generation_latency_ms` grouped by provider. Show avg, p50, p95, sample count.
20. **Live test (optional):** Button "Run live latency test" — user triggers one generation. This **does** consume API and counts toward the 10-sample limit. Show result (e.g., "ElevenLabs: 1.2s").
21. **Cost control:** Live test is rate-limited like other listens.

### Provider Alternatives Page

22. **Content:** List alternative providers with short descriptions. Include 1–2 sample comparisons (A vs B) using cached audio.
23. **Data source:** All active providers except the focal provider. Optionally ordered by ELO or a manual "priority" field.

### Provider Best Voices Page

24. **Content:** List top voices for the provider (from `provider_voices` / `models`). For each voice, show 1–2 cached samples.
25. **Ranking:** Use ELO from `elo_ratings_by_language_model` or a manual "featured" flag. Fallback: list by name.

---

## SEO Sentences Per Language

**What it means:** Each comparison on an SEO page uses a specific sentence (e.g., "The quick brown fox jumps over the lazy dog"). Audio is pre-generated for every (sentence, model) pair. The number of **SEO sentences per language** is how many sentences we select per language for this purpose.

**Why it matters:**
- **Fewer sentences** (e.g., 2–3 per language): Lower pre-warm cost, less variety for visitors.
- **More sentences** (e.g., 5–10 per language): Higher cost, more variety, better coverage of different phonemes/accents.

**Example:** If you have 5 languages and choose 3 sentences per language, that's 15 sentences total. With 20 models across providers, pre-warm generates 15 × 20 = 300 audio files. If you used all 100 sentences in the DB, that would be 100 × 20 = 2,000 files per language — much more expensive.

**Input format:** Either a config file listing sentence IDs per language, or an `is_seo_sample` boolean on the `sentences` table. The exact number is a product decision; 3–5 per language is a reasonable starting point.

---

## Pre-Warming: Upsides & Downsides

### Option A: On-Demand Only

| Upsides | Downsides |
|---------|-----------|
| No cron to maintain | First visitor triggers API cost |
| No wasted storage for unpopular combos | Slower first load |
| Simpler implementation | May hit provider rate limits on traffic spikes |
| | Unpredictable costs |

### Option B: Pre-Warm via Cron

| Upsides | Downsides |
|---------|-----------|
| No API cost on user visit | Must define and maintain sentence/model set |
| Fast first load for all visitors | Cron job to implement and monitor |
| Predictable, controllable costs | Storage for all pre-warmed combos |
| Can run during off-peak hours | Initial pre-warm may take time (batch in chunks) |

**Chosen approach:** Option B (pre-warm via cron for all SEO pages).

---

## Non-Goals (Out of Scope)

- SEO pages contributing to ELO or leaderboard.
- User-submitted sentences for SEO pages.
- Unlimited free listens (rate limit is enforced).
- On-demand TTS generation for anonymous users on SEO pages.
- Provider vs provider pages for all pairwise combinations (curated only).
- Model-level comparison pages in Phase 1 (can be added later).

---

## Design Considerations

- **Blind-test-style UI:** Reuse `AudioCard`, `GlassCard`, `GlassButton` from blind test. Add "Reveal" button or auto-reveal after listen.
- **SEO layout:** Clear headings (H1, H2), short intro paragraphs, comparison tables where relevant.
- **Rate limit UX:** When approaching limit (e.g., 8/10), show a subtle notice. When at limit, show CTA to sign up.
- **Mobile:** Responsive; audio cards stack on small screens.

---

## Technical Considerations

### Schema Changes

- **`audio_files`:** Add `expires_at timestamptz` (nullable for backward compatibility; existing rows stay permanent). For new SEO cache rows, set `expires_at = created_at + interval '30 days'`.
- **Rate limiting:** New table `seo_listen_events` or use Redis. Columns: `identity_hash`, `listen_count`, `window_start`. Or: `seo_rate_limits(identity_hash, listens_used, window_ends_at)`.

### Cron Job

- **Trigger:** Vercel Cron, GitHub Actions, or external cron (e.g., cron-job.org) calling an API route.
- **Route:** `POST /api/cron/prewarm-seo-audio` (protected by `CRON_SECRET`).
- **Logic:** For each (sentence, model) in the SEO set, call `generateAndStoreAudio`. Skip if cache exists and not expired. Batch to avoid timeout (e.g., 100 per run).

### Identity Fingerprint

- **Client:** Generate a fingerprint from User-Agent + screen size + timezone (or use a library like `fingerprintjs`). Store in cookie `seo_fp`.
- **Server:** Combine `seo_fp` + IP + User-Agent. Hash with SHA-256, take first 16 chars. Use as rate-limit key.
- **Fallback:** If no cookie, use IP + User-Agent only (less accurate but works).

### RLS / Public Access

- **`audio_files`:** Add policy for `anon` to SELECT where `expires_at IS NULL OR expires_at > now()` (or a dedicated `seo_audio` view).
- **`providers`, `models`, `sentences`:** Add read-only policies for `anon` for SEO page data.

### Verification

- Verify TTS provider APIs and caching behavior against latest docs (2026). Pre-warming logic should respect existing `generateAndStoreAudio` cache check.

---

## Success Metrics

- Home page ranks for "best text to speech" (track via Search Console).
- Provider pages (e.g., `/elevenlabs/alternatives`) rank for target queries.
- Zero API calls on user visits to SEO pages (all from cache).
- Rate limit enforced: &lt; 1% of users hit limit without signing up (adjust limit if needed).
- Pre-warm cron completes without errors; cache hit rate &gt; 99% for SEO traffic.

---

## Resolved Decisions

| Decision | Choice |
|----------|--------|
| Rate limit window | 24 hours |
| Model-level comparison | Phase 2 (deferred) |
| Config file location | `config/` at repo root |

## Open Questions

1. **SEO sentence set:** How many sentences per language? (See [SEO Sentences Per Language](#seo-sentences-per-language) for explanation.) Recommendation: 3–5 per language to balance variety vs pre-warm cost.

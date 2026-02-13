# Tasks: Admin — Provider, Model/Voice and API Key Management

Based on [PRD 06: Admin — Provider, Model/Voice and API Key Management](prd-admin-providers-models-keys.md).

## Relevant Files

- `src/app/admin/page.tsx` - Admin dashboard; add navigation link to Providers.
- `src/app/admin/providers/page.tsx` - Providers list page with GlassTable.
- `src/app/admin/providers/actions.ts` - Server Actions for provider CRUD, toggle.
- `src/app/admin/providers/add-provider-modal.tsx` - GlassModal form for add/edit provider.
- `src/app/admin/providers/provider-toggle.tsx` - Inline toggle for active/inactive.
- `src/app/admin/providers/[providerId]/layout.tsx` - Provider detail layout with tabs (Models, Keys).
- `src/app/admin/providers/[providerId]/models/page.tsx` - Models list page with GlassTable.
- `src/app/admin/providers/[providerId]/models/actions.ts` - Server Actions for model CRUD, toggle, bulk.
- `src/app/admin/providers/[providerId]/models/add-model-modal.tsx` - GlassModal form for add/edit model.
- `src/app/admin/providers/[providerId]/models/model-toggle.tsx` - Inline toggle for model active/inactive.
- `src/app/admin/providers/[providerId]/models/filter-bar.tsx` - Filter by gender, language, tag, status.
- `src/app/admin/providers/[providerId]/keys/page.tsx` - API keys list page.
- `src/app/admin/providers/[providerId]/keys/actions.ts` - Server Actions for add key, update status.
- `src/app/admin/providers/[providerId]/keys/add-key-modal.tsx` - GlassModal for add API key.
- `src/lib/crypto/keys.ts` - encryptApiKey, decryptApiKey, maskApiKey utility.
- `src/lib/keys/get-active-key.ts` - getActiveApiKey(providerId) - server-side only.
- `src/components/ui/glass-table.tsx` - Table component.
- `src/components/ui/glass-modal.tsx` - Modal for forms.
- `src/components/ui/glass-badge.tsx` - Badges for languages, tags.
- `supabase/migrations/` - Migration for masked_preview column. API keys use app-level encryption (Node.js crypto AES-256-GCM), not pgcrypto.

### Notes

- API key encryption: Use application-level encryption (Node.js crypto) with `API_KEY_ENCRYPTION_SECRET` env var to avoid passing secrets to Postgres. Encrypt before insert, decrypt when reading.
- Add `API_KEY_ENCRYPTION_SECRET` to `.env.local.example`.
- Provider slug is used in R2 paths; warn admin when editing slug if models exist.
- All admin operations log to `admin_audit_log`.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/06-admin-providers-models-keys` (skipped: not a git repo)

- [x] 1.0 Provider management — `/admin/providers` page with list, add, edit, toggle
  - [x] 1.1 Add navigation link on admin dashboard to `/admin/providers`
  - [x] 1.2 Create `src/app/admin/providers/actions.ts` with Server Actions: `createProvider`, `updateProvider`, `toggleProviderActive`. Each verifies admin, validates, logs to admin_audit_log, revalidates path
  - [x] 1.3 Create `src/app/admin/providers/page.tsx`: fetch providers with model counts (active/total). GlassTable columns: Name, Slug, Base URL, Status, Model Count, Created Date
  - [x] 1.4 Create `src/app/admin/providers/add-provider-modal.tsx`: form with Name, Slug (auto from name, editable), Base URL. Validation: name/slug required, slug URL-safe
  - [x] 1.5 Create `src/app/admin/providers/provider-toggle.tsx`: inline toggle with confirmation on deactivate
  - [x] 1.6 Wire providers page: Add button, row click for edit, toggle in Status column. Clicking row navigates to provider detail

- [x] 2.0 Provider detail layout — tabs for Models and Keys
  - [x] 2.1 Create `src/app/admin/providers/[providerId]/layout.tsx`: fetch provider, show GlassTabs for Models and Keys
  - [x] 2.2 Add breadcrumb/nav: Admin → Providers → [Provider Name]

- [x] 3.0 Model/voice management — list, add, edit, toggle, bulk status
  - [x] 3.1 Create `src/app/admin/providers/[providerId]/models/actions.ts`: `createModel`, `updateModel`, `toggleModelActive`, `bulkUpdateModelStatus`
  - [x] 3.2 Create `src/app/admin/providers/[providerId]/models/page.tsx`: GlassTable with Name, Model ID, Gender, Languages (badges), Tags (badges), Status, Created. Support filters/search
  - [x] 3.3 Create `src/app/admin/providers/[providerId]/models/filter-bar.tsx`: gender, language, tag, status, search
  - [x] 3.4 Create `src/app/admin/providers/[providerId]/models/add-model-modal.tsx`: Name, Model ID, Gender (select), Languages (multi-select), Tags (comma-separated)
  - [x] 3.5 Create `src/app/admin/providers/[providerId]/models/model-toggle.tsx` and bulk action dropdown
  - [x] 3.6 Wire models page: Add model, edit on row click, toggle, bulk activate/deactivate

- [x] 4.0 API key management — list, add, status change (deprecate, revoke)
  - [x] 4.1 Create `src/lib/crypto/keys.ts`: encryptApiKey (AES-256-GCM), decryptApiKey, getActiveApiKey. Use API_KEY_ENCRYPTION_SECRET env
  - [x] 4.2 Add API_KEY_ENCRYPTION_SECRET to .env.local.example
  - [x] 4.3 Create `src/app/admin/providers/[providerId]/keys/actions.ts`: `addApiKey` (encrypt and store), `updateKeyStatus` (deprecate/revoke)
  - [x] 4.4 Create `src/app/admin/providers/[providerId]/keys/page.tsx`: GlassTable with Key Name, Status, Masked Preview, Created, Updated
  - [x] 4.5 Create `src/app/admin/providers/[providerId]/keys/add-key-modal.tsx`: Key Name, API Key Value (password input)
  - [x] 4.6 Wire keys page: Add key button, status change dropdown (deprecate/revoke)

- [x] 5.0 Integration and polish
  - [x] 5.1 Update provider add/edit modal: warn when editing slug if provider has models
  - [x] 5.2 Ensure tag badges use color mapping (neural=purple, fast=green, premium=yellow)
  - [x] 5.3 Verify all audit logging and revalidation

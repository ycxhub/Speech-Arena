# Tasks: Admin — Language and Sentence Bank Management

Based on [PRD 05: Admin — Language and Sentence Bank Management](../tasks/prd-admin-languages-sentences.md).

## Relevant Files

- `supabase/migrations/` - New migration for `admin_audit_log` INSERT policy.
- `src/app/admin/page.tsx` - Admin dashboard; add navigation links to Languages and Sentences.
- `src/app/admin/languages/page.tsx` - Languages list page with GlassTable.
- `src/app/admin/languages/actions.ts` - Server Actions for create, update, toggle language.
- `src/app/admin/languages/add-language-modal.tsx` - Client component; GlassModal form for add/edit language.
- `src/app/admin/languages/language-toggle.tsx` - Client component; inline toggle for active/inactive.
- `src/app/admin/sentences/page.tsx` - Sentences list page with GlassTable, filters, pagination.
- `src/app/admin/sentences/actions.ts` - Server Actions for create, update, toggle sentence, bulk CSV import.
- `src/app/admin/sentences/add-sentence-modal.tsx` - Client component; GlassModal form for add sentence.
- `src/app/admin/sentences/edit-sentence-modal.tsx` - Client component; GlassModal form for edit with version history panel.
- `src/app/admin/sentences/sentence-toggle.tsx` - Client component; inline toggle for active/inactive.
- `src/app/admin/sentences/csv-upload-modal.tsx` - Client component; GlassModal for CSV upload with preview and validation.
- `src/app/admin/sentences/filter-bar.tsx` - Client component; language dropdown, status dropdown, keyword search.
- `src/components/ui/glass-table.tsx` - Table component; may need pagination support or use wrapper.
- `src/components/ui/glass-modal.tsx` - Modal for add/edit forms.
- `src/components/ui/glass-input.tsx` - Form inputs.
- `src/components/ui/glass-select.tsx` - Dropdown for language and status filters.
- `src/components/ui/glass-button.tsx` - Buttons.
- `src/components/ui/glass-card.tsx` - Card container for filter bar.
- `src/lib/supabase/server.ts` - Server client for database operations.
- `src/types/database.ts` - Database types for languages, sentences, sentence_versions.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Install `papaparse` for client-side CSV parsing: `npm install papaparse` and `npm install -D @types/papaparse`.
- Admin routes are already protected by middleware (PRD 04). RLS policies for `languages`, `sentences`, and `sentence_versions` already exist.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/05-admin-languages-sentences`

- [x] 1.0 Database schema — ensure admin_audit_log supports admin INSERT for audit logging
  - [x] 1.1 Create a new migration: `npx supabase migration new add_admin_audit_log_insert_policy`
  - [x] 1.2 In the migration file, add an RLS policy: `CREATE POLICY "Admins can insert admin_audit_log" ON public.admin_audit_log FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));`
  - [x] 1.3 Apply the migration: `npx supabase db push` (or run against your hosted project)
  - [x] 1.4 Regenerate TypeScript types if needed: `npm run db:types` (not needed — RLS-only migration)

- [x] 2.0 Language management — `/admin/languages` page with list, add, edit, toggle active/inactive
  - [x] 2.1 Add navigation links on the admin dashboard (`src/app/admin/page.tsx`): links to `/admin/languages` and `/admin/sentences` (e.g., "Languages" and "Sentences" in a horizontal nav or card links above the User Management section)
  - [x] 2.2 Create `src/app/admin/languages/actions.ts` with Server Actions: `createLanguage` (name, code), `updateLanguage` (id, name, code), `toggleLanguageActive` (id). Each must verify admin role, validate input, perform DB operation, insert into `admin_audit_log` with action/entity_type/entity_id/details, call `revalidatePath('/admin/languages')`, return `{ error?: string }`
  - [x] 2.3 Create `src/app/admin/languages/page.tsx`: fetch all languages with sentence count (join or subquery), display GlassTable with columns: Name, Code, Status (active/inactive), Sentence Count, Created Date. Sortable by name and created_at. Use `searchParams` for sort direction
  - [x] 2.4 Create `src/app/admin/languages/add-language-modal.tsx`: GlassModal with form (name, code). Validation: name required, code required and unique (2-5 character alphanumeric), code must not already exist. On submit call `createLanguage` or `updateLanguage` (when editing). Show toast on success/error. Support edit mode: accept optional `language` prop to pre-fill and show "Edit Language" title
  - [x] 2.5 Create `src/app/admin/languages/language-toggle.tsx`: inline toggle switch. On change: call `toggleLanguageActive`. If deactivating, show a confirmation dialog (e.g., `window.confirm` or a custom modal) warning that the language will be hidden from users. Show toast on success/error
  - [x] 2.6 Wire the languages page: "Add language" button opens add modal. Clicking a row opens edit modal with that language. Each row has the toggle component in the Status column. Ensure table rows are clickable for edit (except toggle area)

- [x] 3.0 Sentence management base — `/admin/sentences` page with list, filters (language, status, keyword), and pagination
  - [x] 3.1 Create `src/app/admin/sentences/page.tsx`: read `searchParams` for `page`, `language`, `status`, `q`. Fetch sentences with pagination (25 per page), joined with language (name, code). Apply filters: language_id (from language code), is_active (from status: all/active/inactive), text search (ilike for keyword). Order by created_at desc. Return total count for pagination
  - [x] 3.2 Create `src/app/admin/sentences/filter-bar.tsx`: client component with GlassCard containing language dropdown (options from active languages), status dropdown (All/Active/Inactive), keyword search input (debounced 300ms). On change, update URL via `router.push` with query params: `?page=1&language=en&status=active&q=...`
  - [x] 3.3 Add pagination controls below the table: "Previous" / "Next" buttons or page numbers, using `page` from URL. Disable Previous when page=1, Next when no more pages
  - [x] 3.4 Display GlassTable with columns: Sentence Text (truncated to ~80 chars), Language (code or name), Version, Status (active/inactive), Created Date, Updated Date. Sortable by name and created_at (optional per PRD). Use URL params for sort if needed

- [x] 4.0 Sentence CRUD — add sentence, edit sentence (with version history panel), toggle active/inactive
  - [x] 4.1 Create `src/app/admin/sentences/actions.ts` with Server Actions: `createSentence` (language_id, text), `updateSentence` (id, text), `toggleSentenceActive` (id). For create: insert into sentences (version=1), insert into sentence_versions, log to admin_audit_log. For update: update sentences.text, increment version, insert new row into sentence_versions with new text and version, log to admin_audit_log. Each verifies admin, validates input, revalidates path
  - [x] 4.2 Create `src/app/admin/sentences/add-sentence-modal.tsx`: GlassModal with form (language dropdown of active languages, sentence text textarea max 500 chars). Validation: language required, text required and non-empty after trim. On submit call `createSentence`. Show toast on success
  - [x] 4.3 Create `src/app/admin/sentences/edit-sentence-modal.tsx`: GlassModal with editable textarea for current text, plus a read-only history panel below showing previous versions (version number, text, date, editor from sentence_versions). Fetch versions in server component or via action. Display in reverse chronological order. On submit call `updateSentence`. Show toast on success
  - [x] 4.4 Create `src/app/admin/sentences/sentence-toggle.tsx`: inline toggle switch. On change: call `toggleSentenceActive`. Show toast on success/error. Deactivated sentences are excluded from matchmaking but remain in DB
  - [x] 4.5 Wire the sentences page: "Add sentence" button opens add modal. Clicking a row opens edit modal with that sentence and its version history. Each row has toggle in Status column. Add sentence form uses language_id (UUID from languages table)

- [x] 5.0 Bulk CSV upload — CSV import modal with preview, validation, and batch insert
  - [x] 5.1 Install `papaparse` and `@types/papaparse`: `npm install papaparse` and `npm install -D @types/papaparse`
  - [x] 5.2 Create `src/app/admin/sentences/csv-upload-modal.tsx`: GlassModal with file input accepting `.csv` only. On file select: read file client-side with papaparse, parse CSV. Expected format: header row `language_code,text`. Display preview table (first 10 rows + total count)
  - [x] 5.3 Add validation in the modal: language_code must match existing active languages (fetch list or pass as prop). Text must be non-empty. Display validation errors inline (e.g., row index + error message in red). Flag duplicates (same language + same text) but allow import (admin chooses to skip or import)
  - [x] 5.4 Create Server Action `bulkImportSentences` in `src/app/admin/sentences/actions.ts`: accept JSON array of `{ language_code, text }`. Validate each row. For each valid row: resolve language_id from language_code, insert into sentences (version=1), insert into sentence_versions. Return summary: `{ inserted: number, skipped: number, errors: string[] }`. Log bulk upload to admin_audit_log with count details
  - [x] 5.5 On confirm in modal: call `bulkImportSentences` with parsed rows. Display result summary (X inserted, Y skipped with reasons). Show toast. Close modal and revalidate
  - [x] 5.6 Add "Upload CSV" button on the sentences list page. Add small help text/link near the button: "CSV format: language_code,text (header required). Example: en,The quick brown fox jumps over the lazy dog."

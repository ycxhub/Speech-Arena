# PRD 05: Admin -- Language and Sentence Bank Management

## Introduction / Overview

TTS Arena's blind tests require a bank of sentences organized by language. Admins must be able to manage languages (add, edit, deactivate) and sentences (CRUD, bulk CSV upload, versioning). This PRD covers the admin interface and server-side logic for both language and sentence management.

Sentences are the raw material of every test round — the matchmaking engine picks a sentence from the user's chosen language and generates audio from it. The quality and diversity of the sentence bank directly impacts the usefulness of the A/B comparisons.

## Goals

1. Provide a complete CRUD interface for languages under `/admin/languages`.
2. Provide a complete CRUD interface for sentences under `/admin/sentences`, scoped by language.
3. Support bulk CSV upload of sentences (import dozens/hundreds of sentences at once).
4. Track sentence edit history (versioning) so admins can see what changed and when.
5. Ensure all operations are admin-only (RBAC-protected via middleware + RLS).

## User Stories

- **As an admin**, I want to add a new language (e.g., "Hindi", code "hi") so that I can later add sentences in that language.
- **As an admin**, I want to deactivate a language so it no longer appears in the user-facing language picker, without deleting its sentences.
- **As an admin**, I want to add individual sentences to a language with a simple form.
- **As an admin**, I want to upload a CSV file containing many sentences at once so I can populate the sentence bank quickly.
- **As an admin**, I want to edit a sentence's text and have the old version preserved in history so I can track changes.
- **As an admin**, I want to deactivate sentences that are problematic without deleting them (preserving historical test data referencing them).
- **As an admin**, I want to search and filter sentences by language, status, or keyword.

## Functional Requirements

### Language Management (`/admin/languages`)

1. **Languages list page**: A GlassTable showing all languages with columns: Name, Code, Status (active/inactive), Sentence Count, Created Date. Sortable by name and created date.

2. **Add language**: A GlassModal with a form:
   - Fields: Language name (text), Language code (text, e.g., "en").
   - Validation: name required, code required and unique (2-5 character alphanumeric), code must not already exist.
   - On submit: Server Action inserts into `languages` table. Log to `admin_audit_log`.
   - Show toast on success/error.

3. **Edit language**: Click a row to open GlassModal pre-filled with current values. Can edit name and code. On submit: Server Action updates the row. Log to `admin_audit_log`.

4. **Toggle active/inactive**: An inline toggle switch on each row. On change: Server Action updates `is_active`. If deactivating, show a confirmation dialog warning that the language will be hidden from users. Log to `admin_audit_log`.

5. **Delete language**: Not supported in the UI — languages can only be deactivated, not deleted, to preserve referential integrity with existing sentences and test events.

### Sentence Management (`/admin/sentences`)

6. **Sentences list page**: A GlassTable showing sentences with columns: Sentence Text (truncated to ~80 chars), Language, Version, Status, Created Date, Updated Date. Sortable and paginated (25 rows per page).

7. **Filter bar** at the top:
   - Language dropdown (filter by language).
   - Status dropdown (All / Active / Inactive).
   - Keyword search (searches within sentence text, debounced 300ms).
   - Filters apply via URL query params for shareable/bookmarkable filtered views.

8. **Add sentence**: A GlassModal with a form:
   - Fields: Language (dropdown of active languages), Sentence text (textarea, max 500 characters).
   - Validation: language required, text required, text must be non-empty after trimming.
   - On submit: Server Action inserts into `sentences` table with `version = 1`. Also inserts initial version into `sentence_versions`. Log to `admin_audit_log`.
   - Show toast on success.

9. **Edit sentence**: Click a row to open GlassModal. Shows current text in an editable textarea, plus a read-only history panel below showing previous versions (version number, text, date, editor).
   - On submit: Server Action updates `sentences.text`, increments `sentences.version`, inserts a new row into `sentence_versions` with the NEW text and version number. Log to `admin_audit_log`.
   - The old text is preserved in `sentence_versions` at the previous version number.

10. **Toggle active/inactive**: Inline toggle on each row. Deactivated sentences are excluded from matchmaking but remain in the database for historical test data. Log to `admin_audit_log`.

11. **Delete sentence**: Not supported via UI — use deactivation instead.

### Bulk CSV Upload

12. **CSV upload button** on the sentences list page. Opens a GlassModal:
    - File input accepting `.csv` files only.
    - Expected CSV format: `language_code,text` (header row required).
    - Example:
      ```
      language_code,text
      en,The quick brown fox jumps over the lazy dog.
      en,She sells seashells by the seashore.
      es,El rápido zorro marrón salta sobre el perro perezoso.
      ```
    - On upload: Client reads the file, parses CSV, displays a preview table showing the first 10 rows and total count.
    - Validation:
      - All `language_code` values must match existing active languages.
      - All `text` values must be non-empty.
      - Duplicate texts (same language + same text) are flagged but allowed (admin chooses to skip or import).
      - Display validation errors inline in the preview.
    - On confirm: Server Action batch-inserts all valid rows into `sentences` (and `sentence_versions`). Returns a summary: X inserted, Y skipped (with reasons).
    - Log bulk upload to `admin_audit_log` with count details.

13. **CSV format documentation**: A small help text/link near the upload button explaining the expected format.

### Server Actions

14. All data mutations (create, update, toggle status) are implemented as Next.js Server Actions in `src/app/admin/sentences/actions.ts` and `src/app/admin/languages/actions.ts`.

15. Every Server Action must:
    - Verify the current user is an admin (check `profiles.role`).
    - Validate input data.
    - Perform the database operation using the Supabase server client.
    - Insert a row into `admin_audit_log`.
    - Return a success/error result to the client.
    - Use `revalidatePath('/admin/sentences')` or `revalidatePath('/admin/languages')` to refresh the page data.

## Non-Goals (Out of Scope)

- Sentence translation or auto-translation between languages.
- Sentence quality scoring or review workflow.
- Sentence tagging or categorization (e.g., by topic, difficulty).
- Sentence deduplication algorithm (flagging only, not automated).
- Export of sentence bank to CSV (could be added later).

## Design Considerations

- The sentences list page should feel like a clean admin data table — not cluttered. Use the GlassTable with generous row height and clear typography.
- The filter bar should be a horizontal row of dropdowns and a search box at the top of the table, inside a GlassCard.
- The CSV upload modal should show a clear preview of what will be imported, with any errors highlighted in red.
- Version history in the edit modal should be a scrollable list below the edit form, showing versions in reverse chronological order.

## Technical Considerations

- CSV parsing should happen client-side (using `papaparse` or a simple manual parser) to provide instant feedback. The parsed rows are sent to the Server Action as a JSON array.
- Bulk inserts should use a single Supabase `.insert()` call with an array of rows for efficiency.
- The sentences list page uses server-side pagination: the page fetches only 25 rows at a time based on URL params (`?page=1&language=en&status=active&q=fox`).
- The `sentence_versions` table is append-only — rows are never updated or deleted.
- All admin routes are protected by Next.js middleware (PRD 04) AND RLS policies (PRD 03).

## Success Metrics

- An admin can add a language and immediately add sentences to it.
- An admin can upload a 100-row CSV and see all rows imported within 5 seconds.
- Editing a sentence preserves the old text in version history.
- A non-admin user cannot access `/admin/languages` or `/admin/sentences` (redirected).
- Deactivating a language/sentence removes it from the matchmaking pool but does not affect historical test data.

## Open Questions

1. Should the CSV upload support other delimiters (e.g., tab-separated)? Recommendation: CSV only for MVP; can add TSV support later.
2. Should there be a character limit on sentences? Recommendation: 500 characters max — TTS audio for very long text is impractical for quick A/B tests.
3. Should admins be able to re-activate a specific old version of a sentence? Recommendation: defer — for now, editing always creates a new version; there is no "revert" button.

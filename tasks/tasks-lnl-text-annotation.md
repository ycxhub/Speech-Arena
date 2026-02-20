# Tasks: Listen & Log — Tool 1: Text Annotation with Single Audio

## Relevant Files

### Design System & Layout
- `src/components/lnl/ui/lnl-card.tsx` - Minimal flat card component (replaces GlassCard for L&L)
- `src/components/lnl/ui/lnl-button.tsx` - Flat button component with accent color variants
- `src/components/lnl/ui/lnl-input.tsx` - Clean text input component
- `src/components/lnl/ui/lnl-select.tsx` - Dropdown select component
- `src/components/lnl/ui/lnl-badge.tsx` - Status/label badge component
- `src/components/lnl/ui/lnl-table.tsx` - Data table component for admin views
- `src/components/lnl/ui/lnl-progress.tsx` - Progress bar component
- `src/components/lnl/ui/lnl-modal.tsx` - Modal/dialog component
- `src/components/lnl/ui/lnl-toggle.tsx` - Toggle switch for boolean inputs
- `src/components/lnl/ui/lnl-tabs.tsx` - Tab navigation component
- `src/components/lnl/ui/lnl-tooltip.tsx` - Tooltip component for label descriptions
- `src/components/lnl/ui/index.ts` - Barrel exports for all L&L UI components
- `src/components/lnl/layout/lnl-sidebar.tsx` - Persistent Linear-style sidebar navigation
- `src/components/lnl/layout/lnl-header.tsx` - L&L header bar (task name, breadcrumbs)
- `src/components/lnl/layout/lnl-layout.tsx` - Layout shell combining sidebar + header + content area
- `src/app/listen-and-log/layout.tsx` - Next.js layout for all `/listen-and-log/*` routes

### Database & Migrations
- `supabase/migrations/YYYYMMDDHHMMSS_lnl_schema.sql` - Migration creating all `lnl_*` tables, enums, RLS policies
- `src/types/database.ts` - Auto-generated types (regenerate after migration)

### Roles, Invitations & Middleware
- `src/middleware.ts` - Extended to protect `/listen-and-log/*` routes (existing file, modify)
- `src/lib/lnl/roles.ts` - Helper functions for checking L&L roles
- `src/app/listen-and-log/invite/page.tsx` - Invitation acceptance page
- `src/app/listen-and-log/admin/users/page.tsx` - User & invitation management
- `src/app/listen-and-log/admin/users/actions.ts` - Server Actions for inviting users, managing roles
- `src/components/lnl/admin/invite-user-form.tsx` - Invitation form component
- `src/components/lnl/admin/invitations-table.tsx` - Table listing pending/accepted/expired invitations

### Task Management (Admin)
- `src/app/listen-and-log/admin/page.tsx` - Admin dashboard overview
- `src/app/listen-and-log/admin/layout.tsx` - Admin layout (shared across admin pages)
- `src/app/listen-and-log/admin/tasks/page.tsx` - Task list for admins
- `src/app/listen-and-log/admin/tasks/new/page.tsx` - Task creation wizard (multi-step)
- `src/app/listen-and-log/admin/tasks/[taskId]/page.tsx` - Task management (config, status, users)
- `src/app/listen-and-log/admin/tasks/actions.ts` - Server Actions for task CRUD
- `src/components/lnl/admin/task-creation-wizard.tsx` - Multi-step task creation form
- `src/components/lnl/admin/label-config-editor.tsx` - Label set configuration (name, color, shortcut, description)
- `src/components/lnl/admin/task-options-form.tsx` - Task options (randomized order, transcript visibility, etc.)
- `src/components/lnl/admin/task-user-assignment.tsx` - Assign annotators/auditors to a task

### Dataset Upload
- `src/app/api/listen-and-log/tasks/[taskId]/items/bulk/route.ts` - API route for bulk CSV + audio upload
- `src/app/api/listen-and-log/tasks/[taskId]/items/route.ts` - API route for single item / API ingestion
- `src/lib/lnl/csv-parser.ts` - CSV parsing and validation logic
- `src/lib/lnl/upload-pipeline.ts` - Orchestrates CSV validation, audio upload to R2, item creation
- `src/components/lnl/admin/csv-upload-form.tsx` - CSV + ZIP file upload form with drag-and-drop
- `src/components/lnl/admin/csv-preview-table.tsx` - Validation preview table (green/red per row)

### Dashboard
- `src/app/listen-and-log/page.tsx` - Annotator/auditor dashboard (task list, progress)
- `src/components/lnl/dashboard/task-list.tsx` - Task cards with status, progress, "Start"/"Continue" button
- `src/components/lnl/dashboard/task-card.tsx` - Individual task card component

### Annotation Workspace
- `src/app/listen-and-log/tasks/[taskId]/items/[itemIndex]/page.tsx` - Annotation workspace page
- `src/app/listen-and-log/tasks/[taskId]/page.tsx` - Task overview / redirect to first item
- `src/app/listen-and-log/tasks/[taskId]/actions.ts` - Server Actions for loading items, saving annotations
- `src/components/lnl/workspace/workspace-layout.tsx` - Annotation workspace layout (top bar + audio + transcript + side panel)
- `src/components/lnl/workspace/audio-player.tsx` - WaveSurfer.js waveform audio player
- `src/components/lnl/workspace/transcript-panel.tsx` - Interactive transcript with word-level highlighting
- `src/components/lnl/workspace/word-token.tsx` - Individual word element (clickable, highlightable, labeled)
- `src/components/lnl/workspace/label-palette.tsx` - Label selection buttons with keyboard shortcuts
- `src/components/lnl/workspace/annotation-side-panel.tsx` - Right sidebar: labels, annotations list, questions, comments
- `src/components/lnl/workspace/annotation-list.tsx` - Scrollable list of annotations on current item
- `src/components/lnl/workspace/boolean-questions.tsx` - Yes/No toggle questions
- `src/components/lnl/workspace/scoring-fields.tsx` - Numeric rating scales (1–5)
- `src/components/lnl/workspace/comment-field.tsx` - Overall comment text area
- `src/components/lnl/workspace/item-navigation.tsx` - Prev/Next/Jump-to/Flag/Skip controls with Ctrl+←/→/F shortcuts
- `src/components/lnl/workspace/progress-indicator.tsx` - "47 / 500" progress display with status badge
- `src/components/lnl/workspace/additional-fields.tsx` - Collapsible IPA / normalized text / metadata panel
- `src/components/lnl/workspace/keyboard-shortcuts.tsx` - Keyboard shortcut handler and help overlay
- `src/components/lnl/workspace/completion-celebration.tsx` - Confetti animation + summary modal

### Auto-Save & Versioning
- `src/lib/lnl/auto-save.ts` - Debounced auto-save hook and logic
- `src/lib/lnl/annotation-store.tsx` - Client-side annotation state management (React context)
- `src/lib/lnl/display-order.ts` - Deterministic shuffle for randomized item order

### Audit & Review
- `src/components/lnl/workspace/audit-bar.tsx` - Auditor filter/controls bar (filter by annotator, status)
- `src/components/lnl/workspace/annotation-history.tsx` - Version timeline for an annotation
- `src/app/listen-and-log/tasks/[taskId]/actions.ts` - Server Actions for auditor review (re-open, revise)

### Reporting & Export
- `src/app/listen-and-log/admin/reports/page.tsx` - Reports dashboard with analytics
- `src/app/api/listen-and-log/tasks/[taskId]/export/route.ts` - Export API (CSV/JSON with filtering)
- `src/app/api/listen-and-log/tasks/[taskId]/analytics/route.ts` - Analytics API (label distribution, completion)
- `src/lib/lnl/export.ts` - Report generation logic (CSV serialization, JSON structuring)
- `src/components/lnl/admin/analytics-charts.tsx` - Label distribution, completion rate, time-per-item charts
- `src/components/lnl/admin/export-controls.tsx` - Export format selector, filters, download button

### Nav Integration
- `src/components/layout/nav-bar.tsx` - Add "Listen & Log" tab (existing file, modify)
- `src/components/layout/nav-bar-with-session.tsx` - Fetch L&L role for nav visibility (existing file, modify)

### Notes

- L&L components live under `src/components/lnl/` to keep them separate from Speech Arena's glass components.
- Use `npx supabase db diff` to generate migrations and `npm run db:types` to regenerate TypeScript types after migration.
- WaveSurfer.js must be dynamically imported (`next/dynamic` with `ssr: false`) to avoid SSR errors. Use `@wavesurfer/react` official wrapper. Memoize plugins with `useMemo`.
- All Server Actions for L&L should use `getAdminClient()` (service-role) for operations that bypass RLS, and the standard `createClient()` for user-scoped operations.
- The existing `src/lib/r2/storage.ts` functions (`uploadAudio`, `getSignedUrl`) are reused for L&L audio storage with a different key prefix (`lnl/{taskId}/{itemId}/`).
- RLS policies on `lnl_*` tables should check `lnl_user_roles` for authorization, not `profiles.role`.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/lnl-text-annotation`

- [x] 1.0 L&L Design System & Layout Shell
  - [x] 1.1 Create `src/components/lnl/ui/lnl-button.tsx`: Flat button component with variants (`primary`, `secondary`, `ghost`, `danger`). Props: `variant`, `size` (`sm`, `md`, `lg`), `disabled`, `loading`, `children`, `onClick`. Style: solid backgrounds, crisp borders, high-contrast text. No blur/glass effects. Accent colors from a shared palette (blue, green, yellow, red, purple).
  - [x] 1.2 Create `src/components/lnl/ui/lnl-card.tsx`: Clean card component with solid background (`bg-neutral-900`), subtle border (`border-neutral-800`), rounded corners, and optional padding variants. Props: `padding` (`sm`, `md`, `lg`), `className`, `children`.
  - [x] 1.3 Create `src/components/lnl/ui/lnl-input.tsx`: Text input with label, placeholder, error state, and helper text. Style: solid dark background, crisp border that highlights on focus (blue accent). Props: `label`, `placeholder`, `error`, `helperText`, `type`, `value`, `onChange`, `disabled`.
  - [x] 1.4 Create `src/components/lnl/ui/lnl-select.tsx`: Dropdown select component. Props: `label`, `options` (array of `{value, label}`), `value`, `onChange`, `placeholder`, `error`. Style consistent with LnlInput.
  - [x] 1.5 Create `src/components/lnl/ui/lnl-badge.tsx`: Small badge for status and labels. Props: `variant` (`default`, `success`, `warning`, `error`, `info`), `color` (custom hex for label badges), `children`. Style: pill-shaped, solid background with tinted colors.
  - [x] 1.6 Create `src/components/lnl/ui/lnl-table.tsx`: Data table with sortable columns, row hover states, and optional pagination. Props: `columns` (array of `{key, header, render?, sortable?}`), `data`, `onRowClick?`, `emptyMessage`. Style: clean rows with subtle dividers, no glass effects.
  - [x] 1.7 Create `src/components/lnl/ui/lnl-progress.tsx`: Progress bar component. Props: `value` (0–100), `max?`, `label?`, `showPercentage?`, `size` (`sm`, `md`). Style: solid track with accent fill color.
  - [x] 1.8 Create `src/components/lnl/ui/lnl-modal.tsx`: Modal/dialog with overlay. Props: `isOpen`, `onClose`, `title`, `children`, `footer?`. Style: centered card with dark overlay backdrop.
  - [x] 1.9 Create `src/components/lnl/ui/lnl-toggle.tsx`: Toggle switch for boolean inputs. Props: `checked`, `onChange`, `label`, `disabled`. Style: iOS-style toggle with accent color when active.
  - [x] 1.10 Create `src/components/lnl/ui/lnl-tabs.tsx`: Tab navigation component. Props: `tabs` (array of `{id, label, icon?}`), `activeTab`, `onChange`. Style: underline-style active indicator, clean text.
  - [x] 1.11 Create `src/components/lnl/ui/lnl-tooltip.tsx`: Tooltip component. Props: `content`, `children`, `position` (`top`, `bottom`, `left`, `right`). Appears on hover with a short delay.
  - [x] 1.12 Create `src/components/lnl/ui/index.ts`: Barrel export file re-exporting all L&L UI components.
  - [x] 1.13 Create `src/components/lnl/layout/lnl-sidebar.tsx`: Persistent Linear-style sidebar. Sections: Dashboard, My Tasks, All Tasks (visible to auditors + admins), Admin section divider (lnl_admin + admin only) with Task Management, Users & Invitations, Reports links. "Back to Speech Arena" link at bottom. Collapsible to icon-only on narrow viewports. Highlights active route.
  - [x] 1.14 Create `src/components/lnl/layout/lnl-header.tsx`: Top header bar with breadcrumbs (e.g., "Listen & Log > Tasks > Model QA v2 > Item #47"), optional right-side actions slot.
  - [x] 1.15 Create `src/components/lnl/layout/lnl-layout.tsx`: Layout shell component that composes LnlSidebar + LnlHeader + main content area. Accepts `children` for page content. Fetches current user's L&L role for sidebar visibility logic.
  - [x] 1.16 Create `src/app/listen-and-log/layout.tsx`: Next.js layout file for `/listen-and-log/*`. Wraps children in `LnlLayout`. Checks auth and L&L role — redirects unauthorized users to `/auth/sign-in`.
  - [x] 1.17 Modify `src/components/layout/nav-bar.tsx`: Add a "Listen & Log" tab/link that is only visible when the user has an `lnl_*` role or is a site admin. The link navigates to `/listen-and-log`.
  - [x] 1.18 Modify `src/components/layout/nav-bar-with-session.tsx`: Fetch the user's L&L role from `lnl_user_roles` in addition to their Speech Arena role. Pass `hasLnlAccess` boolean to NavBar.

- [x] 2.0 Database Schema, Migrations & RLS Policies
  - [x] 2.1 Create a new Supabase migration file (`supabase/migrations/YYYYMMDDHHMMSS_lnl_schema.sql`). Define the `lnl_user_roles` table: columns `id` (uuid, PK, default gen_random_uuid()), `user_id` (uuid, FK → auth.users, NOT NULL), `role` (text, NOT NULL, CHECK role IN ('lnl_admin', 'lnl_auditor', 'lnl_annotator')), `invited_by` (uuid, FK → auth.users, nullable), `created_at` (timestamptz, default now()), `updated_at` (timestamptz, default now()). Add UNIQUE constraint on `user_id` (one L&L role per user). Enable RLS.
  - [x] 2.2 In the same migration, define the `lnl_invitations` table: columns `id` (uuid, PK), `email` (text, NOT NULL), `role` (text, NOT NULL, CHECK role IN ('lnl_admin', 'lnl_auditor', 'lnl_annotator')), `invited_by` (uuid, FK → auth.users), `task_ids` (uuid[], nullable), `token` (text, UNIQUE, NOT NULL), `status` (text, NOT NULL, CHECK status IN ('pending', 'accepted', 'expired', 'revoked'), default 'pending'), `expires_at` (timestamptz, NOT NULL), `accepted_at` (timestamptz, nullable), `created_at` (timestamptz, default now()). Enable RLS.
  - [x] 2.3 Define the `lnl_tasks` table: columns `id` (uuid, PK), `name` (text, NOT NULL), `description` (text), `tool_type` (text, NOT NULL, CHECK tool_type IN ('text_annotation', 'audio_evaluation', 'ipa_validation')), `label_config` (jsonb, NOT NULL, default '{}'), `task_options` (jsonb, NOT NULL, default '{}'), `status` (text, NOT NULL, CHECK status IN ('draft', 'active', 'paused', 'completed', 'archived'), default 'draft'), `created_by` (uuid, FK → auth.users), `created_at` (timestamptz, default now()), `updated_at` (timestamptz, default now()). Enable RLS.
  - [x] 2.4 Define the `lnl_task_items` table: columns `id` (uuid, PK), `task_id` (uuid, FK → lnl_tasks ON DELETE CASCADE, NOT NULL), `item_index` (integer, NOT NULL), `audio_url` (text, NOT NULL), `text` (text, NOT NULL), `ipa_text` (text, nullable), `normalized_text` (text, nullable), `metadata` (jsonb, default '{}'), `word_timestamps` (jsonb, nullable), `created_at` (timestamptz, default now()). Add UNIQUE constraint on `(task_id, item_index)`. Add index on `task_id`. Enable RLS.
  - [x] 2.5 Define the `lnl_task_assignments` table: columns `id` (uuid, PK), `task_id` (uuid, FK → lnl_tasks ON DELETE CASCADE, NOT NULL), `user_id` (uuid, FK → auth.users, NOT NULL), `role` (text, NOT NULL, CHECK role IN ('annotator', 'auditor')), `assigned_by` (uuid, FK → auth.users), `assigned_at` (timestamptz, default now()). Add UNIQUE constraint on `(task_id, user_id)`. Enable RLS.
  - [x] 2.6 Define the `lnl_annotations` table: columns `id` (uuid, PK), `task_id` (uuid, FK → lnl_tasks ON DELETE CASCADE, NOT NULL), `item_id` (uuid, FK → lnl_task_items ON DELETE CASCADE, NOT NULL), `user_id` (uuid, FK → auth.users, NOT NULL), `version` (integer, NOT NULL, default 1), `is_current` (boolean, NOT NULL, default true), `labels` (jsonb, NOT NULL, default '[]'), `boolean_answers` (jsonb, NOT NULL, default '{}'), `scores` (jsonb, NOT NULL, default '{}'), `overall_comment` (text, default ''), `status` (text, NOT NULL, CHECK status IN ('in_progress', 'completed', 'flagged', 'reviewed'), default 'in_progress'), `source` (text, NOT NULL, CHECK source IN ('manual', 'auto', 'auto_reviewed'), default 'manual'), `time_spent_ms` (integer, default 0), `created_at` (timestamptz, default now()), `updated_at` (timestamptz, default now()). Add index on `(item_id, user_id, is_current)`. Enable RLS.
  - [x] 2.7 Define the `lnl_annotation_history` table: columns `id` (uuid, PK), `annotation_id` (uuid, FK → lnl_annotations ON DELETE CASCADE, NOT NULL), `changed_by` (uuid, FK → auth.users, NOT NULL), `previous_data` (jsonb, NOT NULL), `change_type` (text, NOT NULL, CHECK change_type IN ('created', 'updated', 'reviewed', 'reopened')), `change_description` (text), `created_at` (timestamptz, default now()). Add index on `annotation_id`. Enable RLS.
  - [x] 2.8 Write RLS policies for `lnl_user_roles`: SELECT — users can read their own row; lnl_admin and admin can read all rows. INSERT/UPDATE/DELETE — only lnl_admin and admin.
  - [x] 2.9 Write RLS policies for `lnl_invitations`: SELECT — lnl_admin and admin can see all. INSERT/DELETE — lnl_admin and admin. UPDATE — anyone can update status to 'accepted' if token matches (for invitation acceptance).
  - [x] 2.10 Write RLS policies for `lnl_tasks`: SELECT — users assigned to the task (via `lnl_task_assignments`) OR lnl_admin OR admin. INSERT/UPDATE/DELETE — lnl_admin and admin only.
  - [x] 2.11 Write RLS policies for `lnl_task_items`: SELECT — same as lnl_tasks (users assigned to the parent task). INSERT/UPDATE/DELETE — lnl_admin and admin.
  - [x] 2.12 Write RLS policies for `lnl_task_assignments`: SELECT — users can see their own assignments; lnl_admin and admin see all. INSERT/DELETE — lnl_admin and admin.
  - [x] 2.13 Write RLS policies for `lnl_annotations`: SELECT — all users assigned to the task can read all annotations for that task (annotators can see others' work). INSERT — annotators and auditors assigned to the task. UPDATE — the annotation owner OR auditors assigned to the task.
  - [x] 2.14 Write RLS policies for `lnl_annotation_history`: SELECT — all users assigned to the task. INSERT — system (via service role) only.
  - [x] 2.15 Create a helper SQL function `is_lnl_admin(user_uuid uuid)` that returns true if the user has role `lnl_admin` in `lnl_user_roles` OR has role `admin` in `profiles`. Use this in RLS policies to keep them DRY.
  - [x] 2.16 Create a helper SQL function `is_assigned_to_task(user_uuid uuid, task_uuid uuid)` that checks `lnl_task_assignments` for the given user and task. Use in RLS policies.
  - [x] 2.17 Run the migration locally: `npx supabase db push` (or `npx supabase migration up`). Verify all tables are created correctly.
  - [x] 2.18 Regenerate TypeScript types: `npm run db:types`. Verify the new `lnl_*` table types appear in `src/types/database.ts`.

- [x] 3.0 Roles, Invitations & Access Control
  - [x] 3.1 Create `src/lib/lnl/roles.ts`: Helper functions — `getLnlRole(userId: string): Promise<string | null>` (queries `lnl_user_roles`), `hasLnlAccess(userId: string): Promise<boolean>` (returns true if user has any lnl role or is site admin), `isLnlAdmin(userId: string): Promise<boolean>` (lnl_admin or site admin). Use the server Supabase client.
  - [x] 3.2 Modify `src/middleware.ts`: Add route matching for `/listen-and-log/*`. If the path starts with `/listen-and-log`, check that the user is authenticated. If the path starts with `/listen-and-log/admin`, additionally verify the user has `lnl_admin` role or is a site admin (query `lnl_user_roles` and `profiles`). Redirect unauthorized users to `/auth/sign-in`. Keep the existing Speech Arena route protection untouched.
  - [x] 3.3 Create `src/app/listen-and-log/admin/users/actions.ts`: Server Actions — `inviteUser(email: string, role: string, taskIds?: string[])`: generates a unique token (`crypto.randomUUID()`), inserts into `lnl_invitations` with 7-day expiry, sends invitation email via Supabase Auth's `inviteUserByEmail` or a custom email. `revokeInvitation(invitationId: string)`: updates status to 'revoked'. `resendInvitation(invitationId: string)`: resets token and expiry, resends email. `updateUserRole(userId: string, newRole: string)`: updates `lnl_user_roles.role`. `removeUser(userId: string)`: deletes from `lnl_user_roles`.
  - [x] 3.4 Create `src/app/listen-and-log/invite/page.tsx`: Invitation acceptance page. Reads `token` from query params. Validates: token exists in `lnl_invitations`, status is 'pending', not expired. If user is logged in: creates/updates `lnl_user_roles` row with the invitation's role, marks invitation as 'accepted', redirects to `/listen-and-log`. If user is not logged in: redirects to `/auth/sign-in?redirect=/listen-and-log/invite?token=...`.
  - [x] 3.5 Create `src/components/lnl/admin/invite-user-form.tsx`: Form with email input, role selector (dropdown: lnl_annotator, lnl_auditor, lnl_admin), optional task multi-select, and "Send Invitation" button. Calls the `inviteUser` Server Action.
  - [x] 3.6 Create `src/components/lnl/admin/invitations-table.tsx`: Table displaying invitations with columns: email, role, status (badge), sent date, expiry, actions (revoke, resend). Filterable by status.
  - [x] 3.7 Create `src/app/listen-and-log/admin/users/page.tsx`: Page combining the invite form and invitations table. Also includes a section listing current L&L users with their roles, with ability to change role or remove access.

- [x] 4.0 Task Management System (Admin)
  - [x] 4.1 Create `src/app/listen-and-log/admin/tasks/actions.ts`: Server Actions — `createTask(data)`: inserts into `lnl_tasks`, returns task ID. `updateTask(taskId, data)`: updates task fields. `updateTaskStatus(taskId, status)`: transitions task status (draft→active, active→paused, etc.). `deleteTask(taskId)`: deletes task and cascading items/assignments. `assignUsersToTask(taskId, assignments[])`: bulk inserts into `lnl_task_assignments`. `removeUserFromTask(taskId, userId)`: deletes assignment.
  - [x] 4.2 Create `src/components/lnl/admin/label-config-editor.tsx`: Interactive editor for configuring 1–5 labels. Each label row has: text input for name (max 50 chars), color picker (hex), text input for description (max 200 chars), single-char input for keyboard shortcut. "Add Label" button (disabled when 5 labels exist). Drag-to-reorder. Delete button per label. Live preview of label badges.
  - [x] 4.3 Create `src/components/lnl/admin/task-options-form.tsx`: Form for task options — toggles for: randomized item order (on/off), transcript visibility (dropdown: shown/hidden/annotator-toggleable), IPA transcription field (on/off), normalized text field (on/off), per-label comments (on/off), overall item comment (on/off). Section for boolean questions: add/remove questions, each with a text input. Section for scoring fields: add/remove, each with name, min, max, description.
  - [x] 4.4 Create `src/components/lnl/admin/task-user-assignment.tsx`: Interface to assign users to a task. Search existing L&L users by email. For each user, select role (annotator/auditor). Shows currently assigned users with role badges and remove button. Option to invite new users (links to invite form).
  - [x] 4.5 Create `src/components/lnl/admin/task-creation-wizard.tsx`: Multi-step wizard with 6 steps as defined in the architecture doc: (1) Basics — name, description, tool type. (2) Dataset Upload — CSV + audio (delegates to upload pipeline, task 5.0). (3) Label Configuration — embeds label-config-editor. (4) Task Options — embeds task-options-form. (5) Assign Users — embeds task-user-assignment. (6) Review & Publish — summary of all config, Publish or Save Draft button. Each step validates before advancing. Back/Next navigation. Progress indicator showing current step.
  - [x] 4.6 Create `src/app/listen-and-log/admin/tasks/new/page.tsx`: Page that renders the task creation wizard. On publish, calls `createTask` Server Action and redirects to the task management page.
  - [x] 4.7 Create `src/app/listen-and-log/admin/tasks/page.tsx`: Task list page for admins. Displays all tasks in a table with columns: name, tool type, status (badge), items count, assigned users count, completion %, created date. Row click navigates to task management page. "New Task" button links to `/listen-and-log/admin/tasks/new`.
  - [x] 4.8 Create `src/app/listen-and-log/admin/tasks/[taskId]/page.tsx`: Task management page. Shows task config summary (editable for draft tasks). Tabs: Overview (config + stats), Items (dataset preview), Assignments (user list), Settings (edit config). Status controls: Publish (draft→active), Pause, Resume, Complete, Archive.

- [x] 5.0 Dataset Upload Pipeline (CSV + Audio)
  - [x] 5.1 Create `src/lib/lnl/csv-parser.ts`: Function `parseAndValidateCsv(csvContent: string, audioFileNames: string[])` that: parses CSV using a library (e.g., `papaparse`), validates required columns exist (`item_id`, `text`, `audio_filename`), validates optional columns (`ipa`, `normalized_text`, custom metadata), cross-references `audio_filename` values against the provided `audioFileNames` list, returns `{ valid: boolean, rows: ParsedRow[], errors: ValidationError[] }` where each error has `{ row, column, message }`.
  - [x] 5.2 Install `papaparse` (CSV parser): `npm install papaparse` and `npm install -D @types/papaparse`. Verify latest version compatibility with the project.
  - [x] 5.3 Create `src/components/lnl/admin/csv-upload-form.tsx`: Drag-and-drop zone for CSV file and audio ZIP (or individual audio files). Shows file names after selection. "Validate & Preview" button that triggers client-side parsing. Displays a loading spinner during validation.
  - [x] 5.4 Create `src/components/lnl/admin/csv-preview-table.tsx`: Displays parsed CSV data in a table. Each row has a green checkmark (valid) or red X (error) indicator. Error rows show the specific validation issue in a tooltip. Columns match the CSV headers. Shows summary: "X of Y rows valid". "Confirm Upload" button (disabled if any errors exist). "Download Error Report" link.
  - [x] 5.5 Create `src/lib/lnl/upload-pipeline.ts`: Server-side function `processDatasetUpload(taskId: string, csvRows: ParsedRow[], audioFiles: File[])` that: uploads each audio file to R2 at key `lnl/{taskId}/{itemId}/{filename}` using the existing `uploadAudio` from `src/lib/r2/storage.ts`, inserts rows into `lnl_task_items` with the R2 key as `audio_url`, item_index, text, optional fields, and metadata. Returns count of items created.
  - [x] 5.6 Create `src/app/api/listen-and-log/tasks/[taskId]/items/bulk/route.ts`: POST route handler for bulk upload. Accepts `multipart/form-data` with CSV file and audio ZIP. Extracts ZIP contents, calls `parseAndValidateCsv`, then `processDatasetUpload`. Returns success/error response with item counts. Restricted to lnl_admin and admin roles.
  - [x] 5.7 Create `src/app/api/listen-and-log/tasks/[taskId]/items/route.ts`: POST route handler for single item / API ingestion. Accepts JSON body `{ text, audio_url, ipa?, normalized_text?, metadata?, word_timestamps? }`. Inserts into `lnl_task_items`. Restricted to lnl_admin and admin roles.

- [x] 6.0 Annotation Workspace: Audio & Transcript
  - [x] 6.1 Install WaveSurfer.js and its React wrapper: `npm install wavesurfer.js @wavesurfer/react`. Verify latest version compatibility.
  - [x] 6.2 Create `src/components/lnl/workspace/audio-player.tsx`: Client component (`"use client"`). Uses `@wavesurfer/react` hook (`useWavesurfer`) with a container ref. Dynamically imported with `next/dynamic` and `ssr: false` in the parent page to avoid SSR errors. Props: `audioUrl`, `onTimeUpdate(currentTime)`, `onReady(duration)`, `onSeek(time)`. Features: waveform visualization, play/pause button, current time / duration display, playback speed selector (0.5x–2x), click-on-waveform to seek. Memoize plugins with `useMemo`. Style: minimal, dark waveform colors matching L&L design.
  - [x] 6.3 Create `src/components/lnl/workspace/transcript-panel.tsx`: Renders the item's text as a sequence of `WordToken` components. Props: `text` (string), `wordTimestamps` (array, nullable), `labels` (current annotations), `selectedWordIndices` (set), `onWordClick(index)`, `onWordRangeSelect(startIndex, endIndex)`, `onSeekToWord(wordIndex)`, `isVisible` (for transcript toggle). Splits text into words, maps each to a `WordToken`. Handles click (select single word) and click-drag (select range). When `wordTimestamps` is available, clicking a word calls `onSeekToWord`.
  - [x] 6.4 Create `src/components/lnl/workspace/word-token.tsx`: Individual word element. Props: `word` (string), `index` (number), `isSelected` (boolean), `labels` (array of assigned labels for this word), `onClick`, `onMouseDown`, `onMouseEnter` (for drag selection). Renders: the word text, colored underlines for each assigned label (stacked if overlapping), a small badge/tag above if labeled. Right-click opens context menu for label removal. Style: inline element, transitions for selection/label highlight.
  - [x] 6.5 Create `src/components/lnl/workspace/additional-fields.tsx`: Collapsible panel showing IPA transcription, normalized text, and custom metadata fields. Props: `ipaText`, `normalizedText`, `metadata` (key-value object), `enabledFields` (from task config). Each field is a read-only display with a toggle button to show/hide. Rendered below the transcript panel.
  - [x] 6.6 Create `src/components/lnl/workspace/workspace-layout.tsx`: Composes the full annotation workspace layout. Regions: top bar (task name, progress, navigation), main area split into content (audio player + transcript + additional fields) and sidebar (annotation panel). Responsive: on screens <1280px, sidebar moves below content. Manages shared state: current item data, current annotations, selected words, audio playback position.
  - [x] 6.7 Create `src/app/listen-and-log/tasks/[taskId]/items/[itemIndex]/page.tsx`: Server component that loads the task config and item data (by `taskId` and `itemIndex`). Verifies the user is assigned to the task. Fetches the item's existing annotation (if any) for the current user. Generates a signed R2 URL for the audio. Passes all data as props to the client-side `WorkspaceLayout`. Uses `generateMetadata` for the page title (e.g., "Item 47 — Model QA v2").
  - [x] 6.8 Create `src/app/listen-and-log/tasks/[taskId]/page.tsx`: Task overview page. Shows task name, description, config summary, and assigned users. "Start Annotating" button that redirects to the first unlabeled item (or item 1 if fresh). For returning annotators, "Continue" button redirects to the last worked-on item.
  - [x] 6.9 Create `src/app/listen-and-log/tasks/[taskId]/actions.ts`: Server Actions — `getTaskItem(taskId, itemIndex)`: fetches item data + signed audio URL. `getAnnotation(taskId, itemId, userId)`: fetches current annotation. `getTaskProgress(taskId, userId)`: returns `{ completed, total, lastItemIndex }`. `getTaskConfig(taskId)`: returns label config and task options.

- [x] 7.0 Annotation Workspace: Labeling, Questions & Comments
  - [x] 7.1 Create `src/components/lnl/workspace/label-palette.tsx`: Renders the label buttons from the task's label config. Each button shows: label color swatch, label name, keyboard shortcut badge (e.g., "1"). Clicking a button or pressing the shortcut key assigns that label to the currently selected word(s). Active label (most recently used) is visually highlighted. Tooltip on hover shows the label description.
  - [x] 7.2 Create `src/components/lnl/workspace/annotation-list.tsx`: Scrollable list showing all annotations on the current item. Each entry displays: the labeled text segment (truncated if long), the label badge (with color), the comment (if any, truncated), and edit/delete icons. Clicking an entry scrolls the transcript to that word and highlights it. Sorted by word position.
  - [x] 7.3 Create `src/components/lnl/workspace/boolean-questions.tsx`: Renders boolean questions from the task config. Each question is a row with: question text, Yes/No toggle buttons (using `LnlToggle` or styled radio buttons). Unanswered questions show both options as neutral. Props: `questions` (from config), `answers` (current state), `onChange(questionId, value)`.
  - [x] 7.4 Create `src/components/lnl/workspace/scoring-fields.tsx`: Renders scoring scales from the task config. Each field is a row with: field name, description, and a horizontal row of clickable number buttons (min to max, e.g., 1–5). Selected number is highlighted with accent color. Props: `fields` (from config), `scores` (current state), `onChange(fieldId, value)`.
  - [x] 7.5 Create `src/components/lnl/workspace/comment-field.tsx`: Multi-line text area for overall item comments. Max 2,000 characters with character count display. Props: `value`, `onChange`, `maxLength`, `placeholder`. Also used inline (smaller variant, max 500 chars) for per-label comments.
  - [x] 7.6 Create `src/components/lnl/workspace/annotation-side-panel.tsx`: Composes the right sidebar of the annotation workspace. Sections (scrollable): (1) Label Palette, (2) Annotations on This Item (annotation list), (3) Boolean Questions, (4) Scoring Fields, (5) Overall Comment. Each section is a collapsible group with a header. Shows an "auto-saved ✓" indicator at the bottom.
  - [x] 7.7 Implement label assignment logic in `workspace-layout.tsx` (or a dedicated hook `useAnnotationState`): When the user selects word(s) and presses a label key (or clicks a label button), add an entry to the `labels` JSONB array: `{ start_word_index, end_word_index, label_name, comment: '' }`. If per-label comments are enabled, open an inline comment input after label assignment. Update the WordToken visual state immediately (optimistic).
  - [x] 7.8 Implement label removal: Right-click on a labeled word opens a context menu listing all labels on that word. Clicking a label removes it from the `labels` array. "Remove All Labels" option clears all labels from the word.
  - [x] 7.9 Implement overlapping label rendering in `word-token.tsx`: When a word has multiple labels, render multiple colored underlines (stacked, 2px each, with 1px gap). If more than 3 labels overlap, show a "+N" indicator. The underline colors come from the label config.

- [x] 8.0 Auto-Save, Progress Tracking & Item Navigation
  - [x] 8.1 Create `src/lib/lnl/auto-save.ts`: Custom React hook `useAutoSave(saveFunction, data, delayMs = 1000)`. Uses `useRef` for the debounce timer. On every `data` change, resets the timer and schedules a save after `delayMs`. Returns `{ isSaving, lastSavedAt, error }`. Handles edge case: saves immediately on component unmount (via `useEffect` cleanup) and on `beforeunload` event.
  - [x] 8.2 Create `src/lib/lnl/annotation-store.ts`: React context (or Zustand store) managing the annotation state for the current item. State: `labels[]`, `booleanAnswers{}`, `scores{}`, `overallComment`, `status`, `selectedWordIndices`, `isDirty`. Actions: `addLabel`, `removeLabel`, `updateBooleanAnswer`, `updateScore`, `updateComment`, `selectWords`, `clearSelection`, `loadAnnotation`, `resetToSaved`. Connects to `useAutoSave` — whenever state changes and `isDirty` is true, triggers a debounced save.
  - [x] 8.3 Implement the `saveAnnotation` Server Action in `src/app/listen-and-log/tasks/[taskId]/actions.ts`: Receives the full annotation data. If no annotation exists for this item+user, inserts a new row (version 1, is_current true). If an annotation exists, creates a new version: inserts a new row with version+1, sets `is_current=true`, and sets `is_current=false` on the previous version. Inserts an `lnl_annotation_history` record with `change_type='updated'` and a snapshot of the previous data.
  - [x] 8.4 Create `src/components/lnl/workspace/progress-indicator.tsx`: Displays "47 / 500 items completed" in the top bar. Fetches progress from Server Action. Updates optimistically when the user completes an item (navigates to next). Shows a status badge (not started / in progress / completed) next to the count.
  - [x] 8.5 Create `src/components/lnl/workspace/item-navigation.tsx`: Top bar navigation controls. Previous button (Ctrl+← shortcut), Next button (Ctrl+→), jump-to-item input (numeric, press Enter to navigate). Flag button (Ctrl+F) that sets the annotation status to 'flagged'. Skip button. When navigating, the URL updates to `/listen-and-log/tasks/[taskId]/items/[newIndex]` using `router.push`. Pre-fetches the next item's data for instant navigation.
  - [x] 8.6 Implement randomized item order: In `getTaskItem` Server Action, if the task has `randomized_order: true`, compute the display order using a deterministic shuffle seeded by `userId + taskId`. Map the display index to the actual `item_index`. Store the mapping client-side (or compute it on each Server Action call). The annotator always sees "Item 1, 2, 3..." but the underlying items are shuffled.
  - [x] 8.7 Implement resume logic: In the task overview page (`/tasks/[taskId]/page.tsx`), query for the user's last annotation (ordered by `updated_at` DESC). If found, the "Continue" button links to that item's index. If no annotations exist, "Start" links to item 1.

- [x] 9.0 Audit Trail & Auditor Review Workflow
  - [x] 9.1 Create `src/components/lnl/workspace/audit-bar.tsx`: Additional control bar shown when the user has the `auditor` role for the current task. Contains: annotator filter dropdown (list all annotators assigned to the task), status filter (all / labeled / flagged / reviewed), sort dropdown (item #, date, annotator). Filters update the item navigation to show only matching items.
  - [x] 9.2 Implement auditor view mode in the workspace: When an auditor opens an item, they see the annotator's annotations overlaid on the transcript (read-only by default). An "Edit Annotation" button switches to edit mode, enabling the auditor to modify labels, answers, scores, and comments. Changes are saved as a new version with `change_type='reviewed'`.
  - [x] 9.3 Create `src/components/lnl/workspace/annotation-history.tsx`: Expandable panel showing the version timeline for an annotation. Each entry shows: version number, changed by (name/email), change type badge, timestamp. Clicking a version shows a diff of what changed (previous vs. current labels, scores, etc.). Most recent version at the top.
  - [x] 9.4 Implement the `reopenAnnotation` Server Action: Auditor re-opens a completed annotation. Sets the current annotation's status to `in_progress`, creates a history record with `change_type='reopened'`.
  - [x] 9.5 Implement annotator selector in audit bar: When auditor selects a different annotator from the dropdown, the workspace loads that annotator's annotations for the current item. If multiple annotators have annotated the same item, the auditor can switch between them.

- [x] 10.0 Reporting, Export & Analytics Dashboard
  - [x] 10.1 Create `src/lib/lnl/export.ts`: Functions — `generateCsvExport(taskId, filters?)`: queries all annotations for the task (joining items, users), formats as flat CSV rows with columns: item_id, item_index, audio_filename, text, annotator_email, annotator_name, annotation_date, labels (JSON string), boolean_answers (JSON string), scores (JSON string), overall_comment, status, time_spent_ms. Returns CSV string. `generateJsonExport(taskId, filters?)`: returns full structured JSON with nested data and task config metadata.
  - [x] 10.2 Create `src/app/api/listen-and-log/tasks/[taskId]/export/route.ts`: GET handler. Query params: `format` (csv|json), `annotator` (user ID, optional), `status` (optional), `from`/`to` (date range, optional). Validates the user is lnl_admin or admin. Calls `generateCsvExport` or `generateJsonExport`. Returns file with appropriate Content-Type and Content-Disposition headers.
  - [x] 10.3 Create `src/app/api/listen-and-log/tasks/[taskId]/analytics/route.ts`: GET handler returning JSON analytics: total items, completed items, completion percentage, per-annotator progress (array of `{email, completed, total}`), label distribution (object of `{labelName: count}`), average time per item (ms), flagged items count. Restricted to lnl_admin and admin.
  - [x] 10.4 Create `src/components/lnl/admin/analytics-charts.tsx`: Renders analytics data as charts. Label distribution as a horizontal bar chart (or simple styled bars using Tailwind — no charting library needed for v1). Completion rate as a progress bar. Per-annotator progress as a table with inline progress bars. Average time per item displayed as a stat card.
  - [x] 10.5 Create `src/components/lnl/admin/export-controls.tsx`: Export panel with: format selector (CSV / JSON radio buttons), annotator filter dropdown, date range picker (simple from/to date inputs), status filter, "Download" button that triggers a fetch to the export API and initiates a browser download. "Copy API Endpoint" button that copies the export URL to clipboard.
  - [x] 10.6 Create `src/app/listen-and-log/admin/reports/page.tsx`: Reports page. Task selector dropdown at top. Below: analytics charts section (label distribution, completion, per-annotator) and export controls section. Fetches analytics data on task selection.

- [x] 11.0 Task Completion Celebration & Polish
  - [x] 11.1 Create `src/components/lnl/workspace/completion-celebration.tsx`: Full-screen overlay with confetti animation (use `canvas-confetti` library or CSS-based confetti — `npm install canvas-confetti`). Shows completion summary: total items completed, total time spent, labels assigned count, items flagged count, average time per item. Two buttons: "Review My Annotations" (returns to item 1) and "Back to Dashboard" (navigates to `/listen-and-log`). Triggered when the annotator completes the last item.
  - [x] 11.2 Create `src/components/lnl/workspace/keyboard-shortcuts.tsx`: Global keyboard shortcut handler using `useEffect` with `keydown` listener. Implements all shortcuts from the PRD: Space (play/pause), ←/→ (skip 2s), Ctrl+← (restart), 1–5 (assign labels), Ctrl+→/← (next/prev item), Ctrl+F (flag), Escape (clear selection), [ / ] (loop segment). Includes a "?" shortcut that opens a help overlay listing all shortcuts.
  - [x] 11.3 Implement the keyboard shortcuts help overlay: A modal triggered by pressing "?" that displays a two-column table of all keyboard shortcuts with descriptions. Dismissable by pressing "?" again or Escape.
  - [x] 11.4 Create `src/app/listen-and-log/page.tsx`: Annotator/auditor dashboard. Fetches all tasks assigned to the current user. Displays task cards with: name, tool type badge, status badge (Not Started / In Progress / Completed with colors), progress bar, item count, "Start" or "Continue" button. For completed tasks, shows a "✅ Completed" badge with the completion date. Sort: active tasks first, then completed.
  - [x] 11.5 Create `src/app/listen-and-log/admin/page.tsx`: Admin dashboard overview. Shows: total tasks count (by status), total users count, total annotations count, recent activity feed (last 10 annotation events). Quick links to: create new task, manage users, view reports.
  - [x] 11.6 Handle edge cases in the annotation workspace: audio load failure (show error message on audio panel, "Skip Item" option), empty transcript (show "No transcript available" message), network error on auto-save (show "Save failed — retrying..." toast, retry with exponential backoff up to 3 attempts), navigating away with unsaved changes (save immediately via `beforeunload`).
  - [x] 11.7 Final polish pass: verify all L&L pages use the minimal design system consistently, ensure all interactive elements have hover/focus/active states, add loading skeletons for async data fetches, test keyboard navigation throughout the workspace, verify deep-linked URLs work correctly (direct navigation to `/listen-and-log/tasks/abc/items/47` loads the correct item).

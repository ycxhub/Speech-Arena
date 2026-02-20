# PRD: Listen & Log — Tool 1: Text Annotation with Single Audio

## Introduction / Overview

**Listen & Log** is a new invite-only section of speecharena.org (`/listen-and-log`) designed for computational linguists and speech ML researchers. It dramatically reduces the time spent on data preparation — labeling, annotation, and analysis — for building TTS, STT, and translation models.

**Tool 1: Text Annotation with Single Audio** is the first of three tools in the Listen & Log platform. It enables annotators to listen to an audio clip while interacting with its transcript, assigning predefined labels to individual words or text segments, and providing comments. The primary use case is capturing Grapheme-to-Phoneme (G2P) errors, Text Normalization (TN) issues, and voice model quality problems at scale.

This PRD also defines the **shared platform foundation** (roles, invitations, task configuration, auto-save, reporting) that Tools 2 and 3 build upon.

---

## Goals

1. Enable annotators to label words and text segments in a transcript while listening to the corresponding audio, reducing annotation time by 80% compared to manual spreadsheet-based workflows.
2. Provide a task configuration system that allows Listen & Log Admins to define label sets, boolean questions, scoring fields, and comment options per task.
3. Implement auto-save with resume capability so annotators never lose work and can pick up exactly where they left off.
4. Support audit workflows where auditors can review, re-open, and revise annotations with full change history.
5. Deliver exportable reports (CSV, JSON, dashboard, API) containing all annotation data plus metadata (annotator name, timestamps, task config).
6. Design for 5–20 concurrent annotators handling 1,000–10,000 items per task, with architecture that scales to 100+ annotators and 100,000+ items.

---

## User Stories

### Annotator

- **As an annotator**, I want to play the full audio for a given item so I can understand the overall pronunciation and quality.
- **As an annotator**, I want to select and play specific segments of the audio (e.g., by clicking a word in the transcript) so I can focus on particular pronunciation issues.
- **As an annotator**, I want to highlight individual words or sequences of words in the transcript and assign predefined labels to them (e.g., "G2P Error", "TN Issue", "Mispronunciation") so that issues are categorized consistently.
- **As an annotator**, I want to add a free-text comment to each label I assign, explaining the specific issue.
- **As an annotator**, I want to add an overall comment for the entire item if I have general observations.
- **As an annotator**, I want my annotations to save automatically so I never lose work, even if I close the browser.
- **As an annotator**, I want to see my progress (e.g., "47 / 500 items completed") and task status (not started, in progress, completed).
- **As an annotator**, I want to jump to a specific item by number so I can revisit previous annotations.
- **As an annotator**, I want to resume annotation from the last labeled item when I return to a task.
- **As an annotator**, I want to toggle the transcript visibility (show/hide) if the task requires blind listening.
- **As an annotator**, I want to toggle additional text fields (IPA transcription, normalized text) when available for the task.

### Auditor / Reviewer

- **As an auditor**, I want to view any annotator's completed work so I can review their labels and comments.
- **As an auditor**, I want to re-open a completed annotation and modify labels or comments, with the system recording who made each change and when.
- **As an auditor**, I want to filter items by annotation status (unlabeled, labeled, flagged, reviewed) to focus my review efforts.

### Listen & Log Admin (Task Manager)

- **As a Listen & Log Admin**, I want to create a new annotation task by uploading audio files and transcripts (CSV + audio), pulling from the existing Speech Arena audio pipeline, or via API ingestion.
- **As a Listen & Log Admin**, I want to configure the label set for a task (1–5 labels, each with a name, color, and explanation/description).
- **As a Listen & Log Admin**, I want to configure boolean questions (e.g., "Is the pronunciation acceptable?"), scoring fields (e.g., "Rate naturalness 1–5"), and free comment fields per task.
- **As a Listen & Log Admin**, I want to assign annotators to a task by inviting users to the platform.
- **As a Listen & Log Admin**, I want to enable or disable specific task options: randomized item order, transcript visibility, additional fields (IPA, TN).
- **As a Listen & Log Admin**, I want to view task-level analytics: completion rates, average annotation time per item, label distribution.
- **As a Listen & Log Admin**, I want to export reports in CSV, JSON, or via API with all annotation data and metadata.

### Site Admin

- **As a site admin**, I want full access to all Listen & Log functionality, including admin capabilities, without needing a separate role assignment.

---

## Functional Requirements

### A. Listen & Log Platform Foundation (Shared Across All 3 Tools)

#### A1. Roles & Access Control

1. **New role: `lnl_admin`** — added to the `profiles.role` enum (alongside existing `user` and `admin`). Listen & Log Admins can manage tasks, invite users, configure label sets, view all annotations, and export reports within the Listen & Log platform. They cannot access the main Speech Arena admin dashboard.
2. **Existing `admin` role** retains full permissions across the entire platform, including all Listen & Log functionality.
3. **New role: `lnl_annotator`** — the default role for users invited to Listen & Log. They can access assigned tasks, create/edit annotations, and view other annotators' work within their assigned tasks.
4. **New role: `lnl_auditor`** — can do everything an annotator can, plus re-open and revise any annotation within tasks they are assigned to. Changes are tracked with full audit history.
5. Role hierarchy: `admin` > `lnl_admin` > `lnl_auditor` > `lnl_annotator`.

#### A2. Invite-Only Access

6. The Listen & Log platform is **invite-only**. Users cannot self-register for Listen & Log access.
7. Listen & Log Admins (and site admins) can invite users by email. The system sends an invitation email with a unique link.
8. If the invited email matches an existing Speech Arena account, the user gains Listen & Log access with the assigned role. If not, a new account is created with the assigned Listen & Log role.
9. Invitations have an expiry (configurable, default 7 days). Expired invitations can be resent.
10. An invitation management UI allows admins to view pending, accepted, and expired invitations.

#### A3. Task Configuration System

11. A **task** is the fundamental unit of work. Each task has:
    - A name and description.
    - A tool type (`text_annotation`, `audio_evaluation`, or `ipa_validation`).
    - A dataset (collection of items — each item is an audio file + associated metadata).
    - A label configuration (label set, boolean questions, scoring fields, comment settings).
    - Task options (randomized order, transcript visibility, additional fields).
    - Assigned users (annotators, auditors).
    - Status: `draft`, `active`, `paused`, `completed`, `archived`.

12. **Label configuration** per task:
    - **Label set**: 1–5 predefined labels. Each label has: `name` (string, max 50 chars), `color` (hex), `description` (string, max 200 chars), `shortcut_key` (optional, single character for keyboard shortcut).
    - **Boolean questions**: 0–10 yes/no questions (e.g., "Is pronunciation acceptable?").
    - **Scoring fields**: 0–5 numeric rating scales. Each has: `name`, `min` (default 1), `max` (default 5), `description`.
    - **Free comment**: enabled/disabled at task level. If enabled, annotators see a free-text comment field per item.
    - **Per-label comments**: enabled/disabled. If enabled, annotators can add a comment to each individual label assignment.

13. **Dataset upload**:
    - **CSV + Audio upload** (primary): Admin uploads a CSV file with columns like `item_id`, `text`, `ipa` (optional), `normalized_text` (optional), `audio_filename`, plus any custom metadata columns. Audio files are uploaded as a ZIP or individually. The system validates that every referenced audio file is present.
    - **Speech Arena pipeline**: Admin can select audio files already in the R2 storage from Speech Arena's existing pipeline, associating them with transcripts.
    - **API ingestion**: A REST API endpoint (`POST /api/listen-and-log/tasks/{taskId}/items`) accepts JSON payloads with audio URLs and metadata for programmatic data loading.

14. **Task assignment**: Admin assigns specific users (by email or user ID) to a task with a role (annotator or auditor). A user can be assigned to multiple tasks.

#### A4. Auto-Save & Resume

15. Annotations are saved automatically on every change (debounced, 1-second delay after last interaction). No "Save" button is needed.
16. Each save creates a versioned record. The current annotation is always the latest version; previous versions are retained for audit history.
17. When an annotator returns to a task, the system resumes at the **first unlabeled item** or the **last item they were working on** (whichever is more recent), preserving all in-progress work.

#### A5. Progress Tracking

18. Each annotator sees a persistent progress bar: `X / N items completed` where N is the total items in the task.
19. Task-level status per annotator: `not_started` (0 items), `in_progress` (1+ items but not all), `completed` (all items labeled).
20. Listen & Log Admins see an aggregated dashboard: per-annotator progress, overall task completion percentage, average time per item.

#### A6. Reporting & Export

21. **CSV export**: All annotation data in a flat table format. Columns include: `item_id`, `audio_filename`, `text`, `annotator_email`, `annotator_name`, `annotation_date`, `labels` (JSON array of `{word/segment, label, comment}`), `boolean_answers`, `scores`, `overall_comment`, `status`, `audit_history`.
22. **JSON export**: Full structured data including nested label assignments, audit trails, and task configuration metadata.
23. **In-app dashboard**: Visual analytics showing label distribution (bar/pie charts), completion rates over time, average annotation time per item, inter-annotator agreement metrics (when multiple annotators are assigned, future-ready).
24. **API endpoint**: `GET /api/listen-and-log/tasks/{taskId}/export?format=csv|json` with authentication. Supports filtering by annotator, date range, and status.

#### A7. Audit Trail

25. Every annotation change is recorded: who changed it, when, what the previous value was, and what the new value is.
26. Auditors can view the full history of changes for any item.
27. When an auditor re-opens and modifies an annotation, the original annotator's work is preserved as a previous version, and the auditor's changes become the current version.

#### A8. Navigation & Routing

28. All Listen & Log pages live under `/listen-and-log/*`:
    - `/listen-and-log` — Dashboard (task list, progress overview).
    - `/listen-and-log/tasks/[taskId]` — Task detail / annotation workspace.
    - `/listen-and-log/admin` — Admin panel (task creation, user management, reports).
    - `/listen-and-log/admin/tasks/new` — New task creation wizard.
    - `/listen-and-log/admin/tasks/[taskId]` — Task configuration & management.
    - `/listen-and-log/admin/users` — User invitation & role management.
    - `/listen-and-log/admin/reports` — Reporting dashboard.
29. The main Speech Arena navigation includes a "Listen & Log" link visible only to users with an `lnl_*` role or `admin` role.

---

### B. Tool 1 Specific: Text Annotation with Single Audio

#### B1. Annotation Workspace Layout

30. The annotation workspace is a single-page interface with the following regions:
    - **Top bar**: Task name, progress indicator (`47 / 500`), task status badge, item navigation (previous / next / jump-to-item input).
    - **Audio panel** (upper area): Waveform visualization of the audio clip with play/pause, scrub, and segment selection. Displays current time / total duration. Keyboard shortcut: `Space` to play/pause, `←/→` to skip 2 seconds.
    - **Transcript panel** (middle area): The text transcript displayed with word-level granularity. Each word is an interactive element that can be clicked or highlighted.
    - **Annotation panel** (right sidebar or bottom panel): Shows the label palette (available labels with colors and shortcuts), the list of annotations made on the current item, boolean questions, scoring fields, and the comment field.
    - **Additional fields panel** (collapsible): IPA transcription, normalized text, and any custom metadata fields. Toggled by a button or task configuration.

#### B2. Audio Interaction

31. **Full playback**: A prominent play/pause button plays the entire audio clip. A waveform visualization (using a library such as WaveSurfer.js or Peaks.js — verify latest docs for 2026 compatibility) shows the audio timeline.
32. **Segment playback**: The annotator can click on a word in the transcript to jump the audio playback to the corresponding timestamp (if word-level timestamps are available in the dataset). Alternatively, the annotator can click-and-drag on the waveform to select and play a specific time range.
33. **Playback speed**: A speed control allows 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x playback. Useful for catching subtle pronunciation issues.
34. **Keyboard shortcuts**: `Space` = play/pause, `Ctrl+←` = restart from beginning, `←/→` = skip back/forward 2s, `[` / `]` = loop selected segment.

#### B3. Text Highlighting & Label Assignment

35. **Word selection**: Clicking a single word highlights it. Clicking and dragging across multiple words selects a contiguous text segment. Selected text is visually highlighted with a neutral color.
36. **Label assignment**: Once text is selected, the annotator assigns a label by:
    - Clicking a label button in the label palette, OR
    - Pressing the label's keyboard shortcut (e.g., `1` for label 1, `2` for label 2, etc.).
37. **Visual feedback**: After a label is assigned, the selected word(s) in the transcript are highlighted with the label's configured color. A small badge or tag appears above or below the word showing the label name.
38. **Overlapping labels**: A single word can have multiple labels assigned (e.g., both "G2P Error" and "TN Issue"). Overlapping labels are shown with multiple colored underlines or stacked badges.
39. **Label removal**: Right-clicking (or long-pressing on mobile) a labeled word opens a context menu to remove a specific label or all labels from that word/segment.
40. **Per-label comment**: If enabled in task config, assigning a label opens a small inline comment input where the annotator can type a brief explanation (max 500 chars). This comment is attached to that specific label on that specific word/segment.

#### B4. Annotation Side Panel

41. **Label palette**: Displays all available labels as colored buttons with name, keyboard shortcut, and a tooltip with the label description. The currently active label (if any) is visually distinguished.
42. **Annotation list**: A scrollable list of all annotations made on the current item. Each entry shows: the labeled text, the label name (with color), the comment (if any), and a delete/edit button. Clicking an entry scrolls the transcript to that word and highlights it.
43. **Boolean questions**: Rendered as toggle switches or Yes/No radio buttons, each with the question text.
44. **Scoring fields**: Rendered as a row of clickable numbers (e.g., 1–5 stars or numbered buttons) with the field name and description.
45. **Overall comment**: A multi-line text area at the bottom of the panel for general observations about the item. Max 2,000 characters.

#### B5. Item Navigation

46. **Sequential navigation**: "Previous" and "Next" buttons move through items in order (or randomized order if enabled).
47. **Jump to item**: A numeric input field where the annotator can type an item number and press Enter to jump directly to it.
48. **Randomized order**: If enabled by the task admin, items are presented in a pseudo-random order seeded per annotator (so the order is consistent for that annotator across sessions but different between annotators). The annotator does not see the underlying item IDs.
49. **Skip item**: An annotator can skip an item without labeling it. Skipped items are tracked and can be returned to later. They do not count toward the completion total.
50. **Flagging**: An annotator can flag an item for review (e.g., if the audio is corrupted or the transcript is wrong). Flagged items appear in the admin dashboard.

#### B6. Text Visibility & Additional Fields

51. **Transcript toggle**: A button/switch to show or hide the transcript text. When hidden, only the audio player is visible. This is useful for tasks where annotators should first listen without reading, then reveal the text. The default state (shown/hidden) is set by the task admin.
52. **IPA transcription**: If available for the item and enabled in task config, an "IPA" toggle shows the phonetic transcription below the standard text.
53. **Normalized text**: If available and enabled, a "Normalized" toggle shows the text-normalized version.
54. **Custom metadata**: Any additional columns from the uploaded CSV are displayed as read-only fields in the additional fields panel.

#### B7. Keyboard Shortcuts Summary

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause audio |
| `←` / `→` | Skip backward / forward 2 seconds |
| `Ctrl + ←` | Restart from beginning |
| `[` / `]` | Set loop start / end for selected segment |
| `1` – `5` | Assign label 1–5 to selected text |
| `Ctrl + S` | Force save (though auto-save handles this) |
| `Ctrl + →` | Next item |
| `Ctrl + ←` | Previous item |
| `Ctrl + F` | Flag current item |
| `Escape` | Clear current text selection |

---

## Non-Goals (Out of Scope for v1)

- **LLM-based auto-labeling**: Pre-populating labels using an LLM is a future enhancement. The schema should support `source: 'manual' | 'auto' | 'auto_reviewed'` on annotations to accommodate this later.
- **Real-time collaboration**: Multiple annotators working on the same item simultaneously with live cursors. For v1, items are independently annotated.
- **Inter-annotator agreement (IAA) scoring**: The schema supports multiple annotators per item, but IAA calculation and visualization is deferred to v2.
- **Mobile-optimized annotation**: The annotation workspace is designed for desktop/laptop use. Basic mobile access should work but is not optimized.
- **Audio editing / trimming**: Annotators cannot modify the audio itself.
- **Offline mode**: Annotations require an active internet connection.
- **Custom annotation types beyond labels**: E.g., bounding boxes on spectrograms, entity linking, etc.

---

## Design Considerations

- **Annotation workspace must minimize context switching**. The audio player, transcript, and label palette should all be visible simultaneously without scrolling on a standard 1080p+ display.
- **Synchronized audio-text interaction**: Clicking a word in the transcript should seek the audio to the corresponding timestamp (when word-level timing data is available). Conversely, as audio plays, the currently spoken word should be subtly highlighted in the transcript (karaoke-style).
- **Efficient keyboard-driven workflow**: Power users (linguists) should be able to annotate entirely via keyboard — select words with arrow keys, assign labels with number keys, navigate items with shortcuts. Every mouse action should have a keyboard equivalent.
- **Visual clarity for overlapping labels**: Use colored underlines (not background highlights) for labels so overlapping labels are distinguishable. Show a legend/key for label colors.
- **Consistent with Speech Arena's glassmorphism design** but adapted for a productivity tool: less decorative glass effects, more focus on readability and information density. Use the existing `GlassCard`, `GlassButton`, and `GlassInput` components but favor lighter glass effects and higher contrast text for long annotation sessions.
- **Dark mode by default** (consistent with Speech Arena) with an option for light mode, since annotators may work for extended hours.
- **Responsive progress feedback**: The progress bar should update instantly on annotation, and the task status badge should transition smoothly between states.

---

## Technical Considerations

### Database Schema (New Tables)

The following new Supabase tables are needed. All tables use RLS policies scoped to the appropriate Listen & Log roles.

- **`lnl_tasks`**: Task definition — `id`, `name`, `description`, `tool_type` (enum: `text_annotation`, `audio_evaluation`, `ipa_validation`), `label_config` (JSONB), `task_options` (JSONB), `status` (enum), `created_by`, `created_at`, `updated_at`.
- **`lnl_task_items`**: Individual items within a task — `id`, `task_id` (FK), `item_index` (integer), `audio_url` (R2 key or external URL), `text`, `ipa_text` (nullable), `normalized_text` (nullable), `metadata` (JSONB for custom columns), `word_timestamps` (JSONB, nullable — array of `{word, start_ms, end_ms}`), `created_at`.
- **`lnl_task_assignments`**: Which users are assigned to which tasks — `id`, `task_id` (FK), `user_id` (FK), `role` (enum: `annotator`, `auditor`), `assigned_by`, `assigned_at`.
- **`lnl_annotations`**: Annotation data — `id`, `task_id` (FK), `item_id` (FK), `user_id` (FK), `version` (integer, auto-increment per item+user), `is_current` (boolean), `labels` (JSONB — array of `{start_word_index, end_word_index, label_name, comment}`), `boolean_answers` (JSONB), `scores` (JSONB), `overall_comment` (text), `status` (enum: `in_progress`, `completed`, `flagged`, `reviewed`), `source` (enum: `manual`, `auto`, `auto_reviewed`), `time_spent_ms` (integer), `created_at`, `updated_at`.
- **`lnl_annotation_history`**: Audit trail — `id`, `annotation_id` (FK), `changed_by` (FK to profiles), `previous_data` (JSONB — snapshot of changed fields), `change_type` (enum: `created`, `updated`, `reviewed`, `reopened`), `change_description` (text), `created_at`.
- **`lnl_invitations`**: Platform invitations — `id`, `email`, `role` (enum: `lnl_admin`, `lnl_auditor`, `lnl_annotator`), `invited_by` (FK), `task_ids` (array of task IDs, nullable), `token` (unique string), `status` (enum: `pending`, `accepted`, `expired`, `revoked`), `expires_at`, `accepted_at`, `created_at`.
- **`lnl_providers`**: Provider configuration specifically for Listen & Log — `id`, `name`, `provider_type`, `api_key_encrypted`, `config` (JSONB), `is_active`, `created_at`. Separate from Speech Arena's provider system.

### Audio Storage

- Audio files are stored in Cloudflare R2 (same bucket as Speech Arena or a dedicated `lnl-audio` bucket). Files are keyed as `lnl/{taskId}/{itemId}/{filename}`.
- Signed URLs are generated server-side with a 1-hour expiry for playback.
- For API ingestion, external audio URLs are supported directly (no R2 upload required, but optional).

### Waveform Visualization

- Use **WaveSurfer.js** (v7+) or **Peaks.js** for waveform rendering. These libraries support click-to-seek, region selection, and real-time playback position. Verify compatibility with Next.js 15 and React 19 before implementation.
- The waveform should be pre-computed server-side (generate waveform data on upload) to avoid client-side audio decoding delays.

### Word-Level Timestamp Alignment

- If the dataset includes word-level timestamps (in the `word_timestamps` JSONB field), the UI enables click-word-to-seek and karaoke-style highlighting.
- If timestamps are not provided, word click still highlights the word for labeling but does not seek audio. A future enhancement could use a forced alignment model (e.g., Whisper-based) to auto-generate timestamps.

### API Endpoints

- `POST /api/listen-and-log/tasks` — Create task (lnl_admin, admin).
- `GET /api/listen-and-log/tasks` — List tasks (all lnl roles).
- `GET /api/listen-and-log/tasks/{taskId}` — Task detail (assigned users + admins).
- `POST /api/listen-and-log/tasks/{taskId}/items` — Upload/add items (lnl_admin, admin).
- `POST /api/listen-and-log/tasks/{taskId}/items/bulk` — Bulk upload via CSV + audio ZIP (lnl_admin, admin).
- `GET /api/listen-and-log/tasks/{taskId}/items/{itemId}` — Get item with annotations.
- `POST /api/listen-and-log/annotations` — Create/update annotation (auto-save).
- `GET /api/listen-and-log/tasks/{taskId}/export` — Export report (lnl_admin, admin).
- `POST /api/listen-and-log/invitations` — Invite user (lnl_admin, admin).
- `GET /api/listen-and-log/tasks/{taskId}/analytics` — Task analytics (lnl_admin, admin).

### Middleware Updates

- Extend `src/middleware.ts` to protect `/listen-and-log/*` routes:
  - `/listen-and-log/admin/*` — requires `lnl_admin` or `admin` role.
  - `/listen-and-log/*` — requires any `lnl_*` role or `admin` role.
  - Unauthenticated or unauthorized users are redirected to `/auth/sign-in` with a message.

### Performance

- Paginate task items (load 1 item at a time in the annotation workspace, pre-fetch the next 2 items for instant navigation).
- Debounce auto-save at 1 second to avoid excessive database writes.
- Use optimistic UI updates for annotation actions (label assignment, comment typing).
- Cache task configuration and label sets client-side (they don't change during an annotation session).

---

## Success Metrics

1. **Annotation speed**: Average time per item is under 60 seconds for a standard text + audio annotation (baseline: measure initial cohort and target 80% improvement by end of pilot).
2. **Completion rate**: 95%+ of assigned items are annotated (measured via progress tracking).
3. **Data quality**: Less than 5% of annotations are flagged for review by auditors.
4. **System reliability**: Auto-save succeeds on 99.9% of attempts with no data loss.
5. **User satisfaction**: Annotators rate the tool 4+ out of 5 on a usability survey.
6. **Report accuracy**: Exported reports contain 100% of annotation data with correct metadata.

---

## Decisions (Resolved from Open Questions)

1. **Word-level timestamps**: Optional in the upload CSV. When provided, click-to-seek and karaoke-style highlighting are enabled. When absent, word highlighting for labeling still works but audio seeking is manual. A future auto-alignment feature (e.g., Whisper-based forced alignment) will generate timestamps for datasets that lack them.
2. **Comment granularity**: Support both per-label comments and per-item overall comments. Both are configurable per task — the admin can enable or disable either independently.
3. **Concurrent annotation**: Multiple annotators can be assigned to the same item in v1 (the schema supports it via `lnl_task_assignments` and `lnl_annotations`). IAA scoring and disagreement resolution workflows are deferred to v2.
4. **Maximum label set size**: Enforce 1–5 labels per task in v1. The UI prevents creating more than 5. Revisit if users demonstrate a need for more.
5. **Audio format support**: MP3, WAV, OGG, FLAC, and M4A are all supported. The HTML `<audio>` element handles these natively. Server-side validation rejects unsupported formats during upload.
6. **Batch operations**: Deferred to v2. In v1, annotators work item-by-item. The schema does not preclude batch operations in the future.
7. **Role architecture**: Listen & Log roles (`lnl_admin`, `lnl_auditor`, `lnl_annotator`) are stored in a **separate `lnl_user_roles` table** with a foreign key to `profiles.id`. This avoids modifying the existing `profiles.role` enum and allows a user to hold both a Speech Arena role (e.g., `user` or `admin`) and a Listen & Log role simultaneously.

8. **Auto-alignment service**: Whisper-based forced alignment is a v2 feature. When added, it will run **on-demand** — triggered when an annotator opens an item that lacks timestamps (~1-3s latency, then cached). This avoids the need for background job infrastructure (queues, workers, monitoring). If on-demand latency becomes a pain point at scale, background batch pre-processing can be added as a v2.1 optimization. The schema is the same either way (`word_timestamps` JSONB column).
9. **Task deadlines**: No deadlines, no reminders in v1. Progress tracking and status indicators (not started / in progress / completed) are sufficient.
10. **Data deletion / GDPR**: Not applicable. Listen & Log is an internal tool. No special data retention or deletion policies are required.
11. **Email infrastructure**: Use **Supabase's built-in email** for invitation delivery. Simple, no additional service to configure. If deliverability becomes an issue at scale, migration to a dedicated provider (Resend, SendGrid) is straightforward since the invitation logic is server-side.
12. **Navigation placement**: Listen & Log gets its own **separate navigation bar** when inside `/listen-and-log/*`. The layout switches to an L&L-specific header/sidebar that suits the productivity-tool context. The main Speech Arena nav includes a "Listen & Log" link visible only to users with an L&L role or site admin, which transitions the user into the L&L layout.
13. **CSV upload validation**: **Strict validation with a preview step.** The upload flow parses the CSV, shows a table preview with green (valid) / red (error) indicators per row, and lists all validation issues (missing audio files, malformed columns, etc.). The admin reviews and confirms before the data is committed. Partially valid uploads are not allowed — all errors must be resolved first.
14. **Design language**: Listen & Log uses a **new minimal design system** — clean, flat components inspired by Notion/Linear. Prioritizes readability, information density, and low visual fatigue for long annotation sessions. The design should still feel cohesive with speecharena.org (shared color palette base, typography scale) but drops the glassmorphism blur/glass effects in favor of solid surfaces, crisp borders, and high-contrast text. New component set: `LnlCard`, `LnlButton`, `LnlInput`, `LnlSelect`, `LnlSidebar`, etc.
15. **Sidebar navigation**: A **persistent, always-visible sidebar** (Linear-style) inside `/listen-and-log/*`. Contents: Dashboard, My Tasks, All Tasks (visible to auditors and admins), and an Admin section (visible to `lnl_admin` and `admin` roles). The sidebar collapses to icons on narrow viewports but is never hidden entirely.
16. **Task completion behavior**: When an annotator finishes all items, show a **celebratory completion summary** — total items completed, time spent, label counts, and a delightful animation/confetti moment. Annotations remain **editable** — the annotator can go back and revise any item until the admin archives the task. Status changes to "Completed" but is not locked.
17. **Annotation workspace URL**: Deep-linkable with the item encoded in the path: **`/listen-and-log/tasks/[taskId]/items/[itemIndex]`**. This enables auditors to share direct links to specific items, supports browser back/forward navigation between items, and makes bookmarking possible. The URL updates as the annotator navigates between items.

---

## V2 Backlog & Future Ideas

Items below are explicitly out of scope for v1. They are captured here for planning and to ensure the v1 schema and architecture do not preclude them.

### High Priority (v2)

1. **Notification system**: Email and/or in-app notifications when annotators are assigned to new tasks, when auditors re-open annotations, and when tasks are published. Channels (email, in-app, or both) should be configurable per user.
2. **Inter-annotator agreement (IAA)**: Calculate and visualize agreement metrics (Cohen's kappa, Fleiss' kappa, Krippendorff's alpha) when multiple annotators are assigned to the same items. Surface disagreements in the admin dashboard with an adjudication workflow.
3. **LLM-based auto-labeling**: Pre-populate labels using an LLM (e.g., GPT-4, Claude) to suggest G2P errors, TN issues, etc. Annotators review and accept/reject suggestions. The `source` field on `lnl_annotations` (`manual` / `auto` / `auto_reviewed`) already supports this.
4. **Whisper forced alignment**: On-demand word-level timestamp generation for audio files uploaded without timestamps. Enables click-to-seek and karaoke highlighting for any dataset.
5. **Batch annotation operations**: Apply the same label to multiple items at once, bulk mark items as completed, bulk re-assign items to a different annotator.
6. **Task templates**: Save and reuse task configurations (label sets, questions, options) as templates for recurring annotation projects.

### Medium Priority (v2–v3)

7. **Real-time collaboration**: Multiple annotators working on the same item simultaneously with live cursors and conflict resolution (operational transforms or CRDTs).
8. **Mobile-optimized annotation**: Responsive annotation workspace optimized for tablet use (e.g., iPad with external keyboard).
9. **Configurable task deadlines & reminders**: Per-task deadlines with automated email reminders at configurable intervals (e.g., 3 days before, 1 day before, overdue).
10. **Custom annotation types**: Beyond text labels — support for entity linking, relation annotation, and structured data entry fields.
11. **Annotator performance analytics**: Per-annotator metrics — speed, consistency, agreement with consensus, quality score over time. Useful for identifying top annotators and those who need training.
12. **Annotation guidelines viewer**: In-app display of task-specific annotation guidelines (Markdown or PDF) with a split-view so annotators can reference guidelines while working.
13. **Expanded label sets**: Allow more than 5 labels per task for complex annotation schemas.

### Low Priority / Wishlist

14. **Spectrogram visualization**: Display spectrograms alongside waveforms for expert-level audio analysis.
15. **Audio editing / trimming**: Allow annotators to mark and trim problematic audio segments.
16. **Offline mode**: PWA support for annotation without internet, with sync when reconnected.
17. **Webhook integrations**: Notify external systems (Slack, Jira, custom endpoints) on task events (published, completed, flagged items).
18. **Plugin system**: Allow custom evaluation instruments and annotation types via a plugin API.
19. **Background batch pre-processing**: For forced alignment and future auto-labeling — queue-based background job infrastructure (BullMQ / Inngest) that pre-processes items on upload for zero-latency annotator experience.
20. **Dataset versioning**: Track changes to the dataset itself (items added, removed, modified) with the ability to roll back.

# Listen & Log — Architecture & User Journey

**Listen & Log** is an invite-only annotation platform for computational linguists and speech ML researchers. It cuts data preparation time by ~80% compared to manual spreadsheet workflows by combining three purpose-built tools: **word-level text annotation** (G2P errors, TN issues, pronunciation quality), **holistic audio evaluation** (including blind A/B testing), and **IPA validation** with on-the-fly TTS re-rendering. Auto-save, versioned audit trails, and configurable export keep teams productive at scale.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        speecharena.org                              │
│                                                                     │
│  ┌──────────────────────┐      ┌──────────────────────────────────┐ │
│  │   Speech Arena        │      │   Listen & Log (/listen-and-log) │ │
│  │   (existing)          │      │   (new)                          │ │
│  │                       │      │                                  │ │
│  │  /blind-test          │      │  /listen-and-log                 │ │
│  │  /custom-test         │      │  /listen-and-log/tasks/[id]      │ │
│  │  /leaderboard         │      │  /listen-and-log/admin           │ │
│  │  /my-results          │      │  /listen-and-log/admin/tasks     │ │
│  │  /admin               │      │  /listen-and-log/admin/users     │ │
│  │                       │      │  /listen-and-log/admin/reports   │ │
│  └──────────────────────┘      └──────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Shared: Auth, Middleware, Supabase Client          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────┐      ┌──────────────────────────────────┐ │
│  │  Glassmorphism UI     │      │  Minimal/Flat UI (Notion-style) │ │
│  │  GlassCard, GlassBtn │      │  LnlCard, LnlBtn, LnlSidebar   │ │
│  │  (Speech Arena pages) │      │  (Listen & Log pages)            │ │
│  └──────────────────────┘      └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
         │                           │                      │
         ▼                           ▼                      ▼
┌──────────────┐          ┌──────────────────┐    ┌────────────────┐
│  Supabase    │          │  Cloudflare R2   │    │  TTS Providers │
│  (PostgreSQL)│          │  (Audio Storage) │    │  (Murf AI etc) │
│              │          │                  │    │  L&L-specific  │
│  - profiles  │          │  - sa-audio/     │    │  config only   │
│  - lnl_*     │          │  - lnl-audio/    │    └────────────────┘
│    tables    │          │                  │
└──────────────┘          └──────────────────┘
```

### Key Architectural Principles

1. **Shared foundation, separate domain**: Listen & Log shares auth and middleware with Speech Arena, but has its **own design system** (minimal/flat, Notion-style — separate from Speech Arena's glassmorphism), its **own navigation** (separate header + sidebar inside `/listen-and-log/*`), its own database tables (`lnl_*`), its own role system (`lnl_user_roles`), and its own TTS provider configuration.
2. **Invite-only boundary**: The `/listen-and-log` route tree is gated at the middleware level. Only users with a row in `lnl_user_roles` (or site admins) can access it.
3. **Task-centric data model**: Everything flows through tasks. A task defines the tool type, label configuration, dataset, assigned users, and reporting.
4. **Auto-save everywhere**: No save buttons. Every interaction is persisted via debounced writes. Versioned annotations enable full audit trails.

---

## 2. Data Model (Simplified ER Diagram)

```
profiles (existing)
  │
  ├──< lnl_user_roles >──┐
  │     user_id (FK)      │
  │     role (enum)       │
  │     invited_by (FK)   │
  │                       │
  │                       │
  ├──< lnl_invitations    │
  │     email             │
  │     role              │
  │     token             │
  │     status            │
  │                       │
  │                       ▼
  │                  lnl_tasks
  │                    id
  │                    name
  │                    tool_type (text_annotation | audio_evaluation | ipa_validation)
  │                    label_config (JSONB)
  │                    task_options (JSONB)
  │                    status (draft | active | paused | completed | archived)
  │                    created_by (FK → profiles)
  │                       │
  │           ┌───────────┼───────────────┐
  │           │           │               │
  │           ▼           ▼               ▼
  │    lnl_task_items  lnl_task_      lnl_item_audios
  │      id            assignments     id
  │      task_id       task_id         item_id (FK)
  │      text          user_id (FK)    audio_position
  │      audio_url     role            audio_url
  │      ipa_text      (annotator|     source_identifier
  │      metadata       auditor)
  │      word_timestamps
  │           │
  │           ▼
  │    lnl_annotations
  │      id
  │      item_id (FK)
  │      user_id (FK)
  │      version
  │      is_current
  │      labels (JSONB)
  │      boolean_answers (JSONB)
  │      scores (JSONB)
  │      overall_comment
  │      status
  │      source (manual | auto | auto_reviewed)
  │           │
  │           ▼
  │    lnl_annotation_history
  │      annotation_id (FK)
  │      changed_by (FK)
  │      previous_data (JSONB)
  │      change_type
  │      change_description
  │
  └──  (Additional tables: lnl_providers, lnl_ipa_symbol_sets,
       lnl_blind_mappings, lnl_render_cache — used by Tools 2 & 3)
```

---

## 3. Role Hierarchy & Permissions

```
┌─────────────────────────────────────────────────────────────────┐
│                     Site Admin (admin)                           │
│  Full access to everything: Speech Arena + Listen & Log         │
├─────────────────────────────────────────────────────────────────┤
│                   Listen & Log Admin (lnl_admin)                │
│  Create/manage tasks, invite users, configure labels,           │
│  view all annotations, export reports, manage L&L providers     │
│  NO access to Speech Arena admin dashboard                      │
├─────────────────────────────────────────────────────────────────┤
│                   Auditor (lnl_auditor)                         │
│  Everything an annotator can do, PLUS:                          │
│  Re-open & revise any annotation, view all annotators' work,    │
│  filter by annotation status                                    │
├─────────────────────────────────────────────────────────────────┤
│                   Annotator (lnl_annotator)                     │
│  Access assigned tasks, create/edit own annotations,            │
│  view other annotators' work (read-only), see progress          │
└─────────────────────────────────────────────────────────────────┘
```

Roles are stored in `lnl_user_roles` (separate from `profiles.role`), so a user can be both a Speech Arena `user` and a Listen & Log `lnl_auditor` simultaneously.

---

## 4. User Journeys

### Journey A: Listen & Log Admin — Setting Up a New Task

```
Admin logs in
     │
     ▼
Navigates to /listen-and-log/admin
     │
     ▼
Clicks "New Task"
     │
     ▼
Step 1: BASICS ─────────────────────────────────────────────────
│  - Enter task name & description
│  - Select tool type: Text Annotation / Audio Evaluation / IPA Validation
│  - Select status: Draft (default)
     │
     ▼
Step 2: DATASET UPLOAD ─────────────────────────────────────────
│  - Option A: Upload CSV + audio files (ZIP)
│  │    → System validates CSV columns, matches audio filenames
│  │    → Shows preview: "150 items parsed, 150 audio files matched"
│  │    → Uploads audio to R2 (lnl-audio/{taskId}/...)
│  │
│  - Option B: Select from Speech Arena pipeline
│  │    → Browse existing audio in R2, select files
│  │    → Enter/upload transcripts for selected audio
│  │
│  - Option C: API ingestion (show API endpoint + docs)
│       → Items can be pushed in later via REST API
     │
     ▼
Step 3: LABEL CONFIGURATION ────────────────────────────────────
│  - Add 1–5 labels, each with:
│      Name (e.g., "G2P Error")
│      Color (color picker)
│      Description (e.g., "Grapheme-to-phoneme conversion error")
│      Keyboard shortcut (e.g., "1")
│  - Add boolean questions (0–10)
│  - Add scoring scales (0–5), each with name, min, max, anchors
│  - Toggle: per-label comments (on/off)
│  - Toggle: overall item comment (on/off)
     │
     ▼
Step 4: TASK OPTIONS ───────────────────────────────────────────
│  - Randomized item order: on/off
│  - Transcript visibility default: shown / hidden / annotator-toggleable
│  - Additional fields: IPA transcription / normalized text (on/off per field)
     │
     ▼
Step 5: ASSIGN USERS ───────────────────────────────────────────
│  - Search existing L&L users or invite new ones by email
│  - Assign role per user per task: annotator or auditor
│  - Invited users receive an email with a link to accept
     │
     ▼
Step 6: REVIEW & PUBLISH ──────────────────────────────────────
│  - Preview task configuration summary
│  - Publish (status → active) or save as draft
     │
     ▼
Task is live. Assigned annotators see it on their dashboard.
```

### Journey B: Annotator — Completing an Annotation Task

```
Annotator receives invitation email
     │
     ▼
Clicks link → lands on /listen-and-log
     │
     ├── New user? → Account created, lnl_annotator role assigned
     └── Existing user? → lnl_annotator role added to their profile
     │
     ▼
DASHBOARD (/listen-and-log) ────────────────────────────────────
│  Sees a list of assigned tasks with:
│    - Task name
│    - Tool type badge (Text Annotation)
│    - Status badge (Not Started / In Progress / Completed)
│    - Progress bar (0 / 150 items)
│    - "Continue" or "Start" button
     │
     ▼
Clicks "Start" on a task
     │
     ▼
ANNOTATION WORKSPACE (/listen-and-log/tasks/[taskId]) ──────────
│
│  ┌─── TOP BAR ───────────────────────────────────────────────┐
│  │  Task: "Model QA - English v2"    47 / 150    In Progress │
│  │  [◀ Prev]  Item #47  [Next ▶]  [Jump to: ___]  [Flag 🚩] │
│  └────────────────────────────────────────────────────────────┘
│
│  ┌─── AUDIO PANEL ───────────────────────────────────────────┐
│  │  ▶ ──────────●──────────── 0:03 / 0:07   [0.5x 1x 1.5x] │
│  │  ░░░░░░░░░██████░░░░░░░░░░░░░░░░  (waveform)             │
│  └────────────────────────────────────────────────────────────┘
│
│  ┌─── TRANSCRIPT PANEL ──────────────────────────────────────┐
│  │                                                            │
│  │  "The  quick  brown  fox  jumps  over  the  lazy  dog"    │
│  │                ▲▲▲▲▲                                       │
│  │              [brown] ← highlighted, labeled "G2P Error"    │
│  │                                                            │
│  │  [Show IPA ▼]  [Show Normalized ▼]                        │
│  └────────────────────────────────────────────────────────────┘
│
│  ┌─── ANNOTATION PANEL (sidebar) ────────────────────────────┐
│  │                                                            │
│  │  LABELS                                                    │
│  │  [1] G2P Error     ████  (red)                            │
│  │  [2] TN Issue      ████  (orange)                         │
│  │  [3] Mispronounce  ████  (yellow)                         │
│  │  [4] Audio Defect  ████  (purple)                         │
│  │                                                            │
│  │  ANNOTATIONS ON THIS ITEM                                  │
│  │  ┌──────────────────────────────┐                         │
│  │  │ "brown" → G2P Error         │                         │
│  │  │ Comment: "vowel shifted"    │                         │
│  │  │                    [✕ Remove]│                         │
│  │  └──────────────────────────────┘                         │
│  │                                                            │
│  │  QUESTIONS                                                 │
│  │  Is pronunciation acceptable?  [Yes] [No]                 │
│  │  Rate naturalness:  ① ② ③ ④ ⑤                           │
│  │                                                            │
│  │  OVERALL COMMENT                                           │
│  │  ┌──────────────────────────────┐                         │
│  │  │ Generally good but the...   │                         │
│  │  └──────────────────────────────┘                         │
│  │                                                            │
│  │             [auto-saved ✓ 2s ago]                         │
│  └────────────────────────────────────────────────────────────┘
│
     │
     ▼
Annotator works through items:
  1. Play audio (Space)
  2. Highlight word(s) in transcript (click/drag)
  3. Assign label (press 1-5 or click label button)
  4. Add comment if needed
  5. Answer boolean questions / scoring
  6. Add overall comment if needed
  7. → Auto-saved. Press Next (Ctrl+→) to move on.
  URL updates: /listen-and-log/tasks/abc/items/48
     │
     ▼
After last item → 🎉 COMPLETION CELEBRATION
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                     🎉 Confetti animation                  │
│                                                            │
│              "You've completed all 150 items!"             │
│                                                            │
│    ┌──────────────────────────────────────────────┐       │
│    │  Total items:      150                       │       │
│    │  Time spent:       2h 14m                    │       │
│    │  Labels assigned:  87                        │       │
│    │  Items flagged:    3                         │       │
│    │  Avg time/item:    53s                       │       │
│    └──────────────────────────────────────────────┘       │
│                                                            │
│    [Review My Annotations]    [Back to Dashboard]          │
│                                                            │
│    You can still go back and edit any item.                │
└────────────────────────────────────────────────────────────┘
Dashboard shows ✅ badge. Annotations remain editable.
```

### Journey C: Auditor — Reviewing Annotations

```
Auditor logs in → Dashboard (/listen-and-log)
     │
     ▼
Sees assigned tasks. Clicks a task.
     │
     ▼
AUDIT VIEW ─────────────────────────────────────────────────────
│  Same workspace as annotator, but with additional controls:
│
│  ┌─── FILTER BAR ────────────────────────────────────────────┐
│  │  Filter by: [All ▼] [Annotator: Jane ▼] [Status: Flagged]│
│  │  Sort by: [Item # ▼]                                      │
│  └────────────────────────────────────────────────────────────┘
│
│  The auditor sees the annotator's labels, comments, scores
│  overlaid on the transcript (read-only by default).
│
│  To modify:
│    → Clicks "Edit Annotation" button
│    → Fields become editable
│    → Changes are saved as a new version
│    → Audit log records: who, when, what changed
│
│  Auditor can also:
│    - Mark item as "Reviewed" ✓
│    - Send item back to annotator with a note
│    - View annotation history (version timeline)
```

### Journey D: Listen & Log Admin — Exporting Reports

```
Admin navigates to /listen-and-log/admin/reports
     │
     ▼
REPORTS DASHBOARD ──────────────────────────────────────────────
│
│  ┌─── TASK SELECTOR ──────────────┐
│  │  Select task: [Model QA v2 ▼]  │
│  └─────────────────────────────────┘
│
│  ┌─── ANALYTICS ──────────────────────────────────────────────┐
│  │                                                             │
│  │  Completion: ████████████████░░░░ 80% (120/150 items)      │
│  │                                                             │
│  │  Label Distribution:                                        │
│  │    G2P Error    ████████████ 45                             │
│  │    TN Issue     ██████ 22                                   │
│  │    Mispronounce ████ 15                                     │
│  │    Audio Defect ██ 8                                        │
│  │                                                             │
│  │  Avg time/item: 42s     Flagged items: 3                   │
│  │                                                             │
│  │  Per-Annotator Progress:                                    │
│  │    Jane:  ████████████████████ 60/60 ✅                    │
│  │    Alex:  ████████████░░░░░░░░ 40/60                       │
│  │    Sam:   ██████░░░░░░░░░░░░░░ 20/60                      │
│  └─────────────────────────────────────────────────────────────┘
│
│  ┌─── EXPORT ──────────────────────────────────────────────────┐
│  │  Format: [CSV ▼]  [JSON]                                    │
│  │  Filter: [All annotators ▼]  Date range: [Feb 1 – Feb 20]  │
│  │  Include audit history: [✓]                                  │
│  │                                                              │
│  │  [Download]   [Copy API Endpoint]                            │
│  │                                                              │
│  │  API: GET /api/listen-and-log/tasks/abc123/export?format=csv │
│  └──────────────────────────────────────────────────────────────┘
```

---

## 5. Request Flow (Technical)

### Annotation Save Flow

```
Annotator makes a change (e.g., assigns a label)
     │
     ▼
React state updates optimistically (instant UI feedback)
     │
     ▼
1-second debounce timer starts
     │
     ▼
Timer fires → Server Action: saveAnnotation()
     │
     ▼
Server Action:
  1. Validates user is assigned to the task
  2. Checks if an annotation exists for this item + user
     ├── Yes → Creates new version (version + 1), sets is_current = true
     │         on new row, is_current = false on previous
     └── No  → Creates first version (version = 1, is_current = true)
  3. Inserts lnl_annotation_history record
  4. Returns success
     │
     ▼
Client shows "auto-saved ✓" indicator
```

### Item Navigation Flow

```
Annotator clicks "Next" (or Ctrl+→)
     │
     ▼
Client already has next item pre-fetched (optimistic)
     │
     ▼
Swap UI to next item instantly
     │
     ▼
Background: pre-fetch item N+2
Background: load waveform for next item's audio
     │
     ▼
If pre-fetch wasn't ready → show loading skeleton for ~200ms
```

### Invitation Flow

```
Admin enters email + role in /listen-and-log/admin/users
     │
     ▼
Server Action: createInvitation()
  1. Generate unique token (crypto.randomUUID)
  2. Insert into lnl_invitations (status: pending, expires in 7 days)
  3. Send email via Supabase/Resend with link:
     speecharena.org/listen-and-log/invite?token=abc123
     │
     ▼
User clicks link
     │
     ▼
/listen-and-log/invite?token=abc123 page:
  1. Validate token (not expired, not already used)
  2. Check if user is logged in
     ├── Yes → Add lnl_user_roles row, mark invitation accepted
     └── No  → Check if email has existing account
               ├── Yes → Redirect to sign-in, then back to invite page
               └── No  → Redirect to sign-up, then back to invite page
     │
     ▼
User lands on /listen-and-log dashboard with their new role
```

---

## 6. Page Map

```
/listen-and-log
├── / .......................... Dashboard (task list, progress)
├── /tasks
│   └── /[taskId]
│       ├── / .................. Task overview (description, config, assigned users)
│       └── /items
│           └── /[itemIndex] ... Annotation workspace (deep-linkable per item)
├── /invite .................... Invitation acceptance page
└── /admin
    ├── / ...................... Admin dashboard (overview, stats)
    ├── /tasks
    │   ├── /new ............... Task creation wizard (6 steps)
    │   └── /[taskId] ......... Task management (config, status, users)
    ├── /users ................. User & invitation management
    ├── /reports ............... Reporting dashboard & export
    └── /providers ............. TTS provider configuration (for Tool 3)
```

### Sidebar (Persistent, Linear-style)

```
┌─────────────────────────┐
│  🎧 Listen & Log        │  ← Brand / home link
│                         │
│  Dashboard              │  ← /listen-and-log
│  My Tasks               │  ← Filtered to current user's assigned tasks
│  All Tasks              │  ← All tasks (auditors + admins)
│                         │
│  ── Admin ────────────  │  ← Section divider (lnl_admin + admin only)
│  Task Management        │  ← /listen-and-log/admin/tasks
│  Users & Invitations    │  ← /listen-and-log/admin/users
│  Reports                │  ← /listen-and-log/admin/reports
│  Providers              │  ← /listen-and-log/admin/providers
│                         │
│  ── User ─────────────  │
│  ↩ Back to Speech Arena │  ← Returns to speecharena.org main nav
└─────────────────────────┘
```

---

## 7. Tech Stack Summary

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Shared with Speech Arena |
| UI | React 19 + Tailwind v4 | **New minimal component set** (`LnlCard`, `LnlButton`, etc.) — clean/flat, Notion/Linear-inspired. No glassmorphism. High contrast for long sessions. |
| Audio | WaveSurfer.js / Peaks.js | Waveform rendering, click-to-seek |
| Database | Supabase (PostgreSQL) | New `lnl_*` tables, RLS policies |
| Auth | Supabase Auth | Shared with Speech Arena |
| Email | Supabase built-in email | For invitation delivery |
| Storage | Cloudflare R2 | Separate `lnl-audio/` prefix |
| TTS (Tool 3) | Murf AI + configurable | Separate provider config |
| State | React state + Server Actions | Auto-save via debounced Server Actions |
| Export | Custom API endpoints | CSV, JSON, dashboard |
| Navigation | Separate L&L nav/layout | Own header + sidebar inside `/listen-and-log/*` |

---

## 8. What Gets Built, In What Order

### Phase 0: Design System & Layout
- L&L minimal component set (`LnlCard`, `LnlButton`, `LnlInput`, `LnlSelect`, `LnlSidebar`, `LnlTable`, `LnlBadge`, `LnlProgress`)
- L&L layout shell: separate header + sidebar for `/listen-and-log/*` routes
- "Listen & Log" link in main Speech Arena nav (visible only to L&L roles + admin)

### Phase 1: Platform Foundation
- `lnl_user_roles` table + RLS policies
- `lnl_invitations` table + invitation flow (Supabase built-in email)
- Middleware updates for `/listen-and-log/*` route protection
- Dashboard page (`/listen-and-log`) — task list shell
- Admin page shell (`/listen-and-log/admin`)
- User management page (`/listen-and-log/admin/users`)

### Phase 2: Task System
- `lnl_tasks` table + task creation wizard
- `lnl_task_items` table + CSV/audio upload pipeline
- `lnl_task_assignments` table + user assignment UI
- Task management page (`/listen-and-log/admin/tasks/[taskId]`)

### Phase 3: Tool 1 — Text Annotation Workspace
- Annotation workspace page (`/listen-and-log/tasks/[taskId]`)
- Audio player with waveform (WaveSurfer.js integration)
- Transcript panel with word-level interaction
- Label palette + assignment mechanics
- Boolean questions, scoring, comments
- Auto-save + versioning (`lnl_annotations`, `lnl_annotation_history`)
- Progress tracking + item navigation
- Keyboard shortcuts

### Phase 4: Reporting & Audit
- Export API endpoints (CSV, JSON)
- Reports dashboard (`/listen-and-log/admin/reports`)
- Audit view for auditors (review, re-open, revise)
- Analytics charts (label distribution, completion, time per item)

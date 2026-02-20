# PRD: Listen & Log — Tool 2: Audio Evaluation

## Introduction / Overview

**Tool 2: Audio Evaluation** is the second tool in the Listen & Log platform. It enables annotators to evaluate one or more audio samples by answering predefined questions, assigning scores, and providing comments — without needing to label specific parts of the audio or transcript. The primary use cases are capturing audio quality issues, voice preferences (A/B/n comparisons), and model output quality at scale.

Unlike Tool 1 (Text Annotation), this tool focuses on holistic audio assessment rather than word-level transcript labeling. It supports both single-audio and multi-audio evaluation (e.g., comparing 2–4 audio renditions of the same text), with a critical capability for **blind tests** where audio source/model identity is hidden from the annotator and only revealed ("un-blinded") in the exported reports.

This PRD builds upon the shared Listen & Log platform foundation (roles, invitations, task configuration, auto-save, reporting) defined in the Tool 1 PRD.

---

## Goals

1. Enable annotators to evaluate single or multiple audio samples per item by answering boolean questions, preference questions, and numeric scoring scales.
2. Support **blind evaluation mode** where audio sources are randomized and anonymized, with un-blinding only in exported reports.
3. Provide per-audio comments and optional overall comments for rich qualitative feedback.
4. Maintain the same task configuration, auto-save, progress tracking, and reporting capabilities as the shared platform foundation.
5. Support side-by-side comparison of multiple audio versions with synchronized playback controls.
6. Design for the same scale targets: 5–20 concurrent annotators, 1K–10K items per task, architectured for 100+ annotators and 100K+ items.

---

## User Stories

### Annotator

- **As an annotator**, I want to play the full audio for a single-audio evaluation item so I can assess its overall quality.
- **As an annotator**, I want to select and play specific segments of the audio by clicking on the waveform so I can focus on particular sections.
- **As an annotator**, I want to see the transcript text alongside the audio (if enabled for the task) to judge pronunciation accuracy.
- **As an annotator**, I want to listen to multiple audio versions of the same text (e.g., Audio A, Audio B, Audio C) and compare them side by side.
- **As an annotator**, I want to answer boolean questions about each audio (e.g., "Does this audio contain background noise?" — Yes/No).
- **As an annotator**, I want to answer preference questions (e.g., "Which audio sounds more natural?" — Audio A / Audio B / No preference).
- **As an annotator**, I want to rate each audio on predefined scoring scales (e.g., "Naturalness: 1–5", "Clarity: 1–5").
- **As an annotator**, I want to add a free-text comment to each individual audio explaining my reasoning.
- **As an annotator**, I want to add an overall comment for the entire evaluation item.
- **As an annotator**, I want my evaluations to save automatically so I never lose work.
- **As an annotator**, I want to see my progress and navigate between items (previous, next, jump-to).
- **As an annotator**, I want the audio sources to be anonymized in blind test mode so my evaluation is unbiased.

### Auditor / Reviewer

- **As an auditor**, I want to view any annotator's evaluations and override scores or comments if needed, with full audit history.
- **As an auditor**, I want to see aggregated evaluation data per item (e.g., average scores, agreement rates) to identify inconsistencies.

### Listen & Log Admin

- **As a Listen & Log Admin**, I want to create an audio evaluation task with configurable questions, scoring scales, and comment fields.
- **As a Listen & Log Admin**, I want to upload multiple audio versions per item (e.g., 2–4 renditions from different models) and associate them with a shared transcript.
- **As a Listen & Log Admin**, I want to enable or disable blind test mode, which randomizes audio presentation order and hides source identifiers.
- **As a Listen & Log Admin**, I want to configure the number of audio versions per item (1 for single-audio evaluation, 2–4 for comparison tasks).
- **As a Listen & Log Admin**, I want to export un-blinded reports that map anonymized audio labels (Audio A, B, C) back to their actual source identifiers (model name, version, etc.).
- **As a Listen & Log Admin**, I want to view aggregated analytics: score distributions, preference rankings, agreement metrics.

---

## Functional Requirements

### C1. Task Configuration (Audio Evaluation Specific)

1. When creating a task with `tool_type = audio_evaluation`, the admin configures:
   - **Evaluation mode**: `single_audio` (one audio per item) or `multi_audio` (2–4 audios per item for comparison).
   - **Audio sources per item**: For `multi_audio`, specify the number of audio versions (2, 3, or 4).
   - **Blind mode**: Enabled or disabled. When enabled, the system randomizes the order of audio versions per item per annotator, and labels them generically (Audio A, Audio B, etc.) instead of showing source names.
   - **Blind seed strategy**: `per_annotator` (each annotator sees a different randomization) or `global` (all annotators see the same randomized order per item).

2. **Question configuration**: The admin configures one or more evaluation instruments:
   - **Boolean questions** (per audio): e.g., "Does this audio contain artifacts?" — Yes/No.
   - **Preference questions** (across audios, multi_audio only): e.g., "Which audio is most natural?" — select one audio (or "No preference").
   - **Ranking questions** (across audios, multi_audio only): e.g., "Rank audios by clarity from best to worst" — drag-and-drop or numbered ranking.
   - **Scoring scales** (per audio): e.g., "Rate naturalness" — numeric scale (configurable min/max, default 1–5). Support MOS (Mean Opinion Score) style scales with labeled anchors (1=Bad, 2=Poor, 3=Fair, 4=Good, 5=Excellent).
   - **Free comment** (per audio): enabled/disabled.
   - **Overall comment** (per item): enabled/disabled.

3. **Transcript visibility**: Configurable per task — show transcript, hide transcript, or annotator-toggleable (default: hidden, annotator can reveal).

4. **Additional fields**: Same as Tool 1 — IPA transcription, normalized text, custom metadata — all toggleable.

### C2. Dataset Upload (Audio Evaluation Specific)

5. **Single-audio CSV format**:
   ```
   item_id, text, audio_filename, [ipa], [normalized_text], [custom_columns...]
   ```

6. **Multi-audio CSV format**:
   ```
   item_id, text, audio_1_filename, audio_1_source, audio_2_filename, audio_2_source, [audio_3_filename, audio_3_source, audio_4_filename, audio_4_source], [ipa], [normalized_text], [custom_columns...]
   ```
   The `audio_X_source` column stores the real identity of each audio version (e.g., model name, version). This is hidden from annotators in blind mode and included in un-blinded reports.

7. **Audio file upload**: Same as Tool 1 — ZIP or individual files, stored in R2 at `lnl/{taskId}/{itemId}/{filename}`.

### C3. Evaluation Workspace Layout

8. The evaluation workspace adapts based on evaluation mode:

   **Single-audio mode**:
   - **Top bar**: Task name, progress (`47 / 500`), item navigation.
   - **Audio panel**: Single waveform player with full playback controls.
   - **Transcript panel** (if enabled): Text displayed below the audio.
   - **Evaluation panel** (right sidebar or below): Boolean questions, scoring scales, comment field.

   **Multi-audio mode**:
   - **Top bar**: Same as single-audio.
   - **Audio panels**: 2–4 audio players arranged side-by-side (on desktop) or stacked (on narrow screens). Each labeled "Audio A", "Audio B", etc. In blind mode, labels are shuffled. Each player has independent waveform, play/pause, and progress controls.
   - **Transcript panel** (shared, if enabled): One transcript displayed above or below the audio panels (since all audios correspond to the same text).
   - **Evaluation panel**: Structured by question type — boolean questions per audio, preference/ranking questions across audios, scoring per audio, comments per audio, overall comment.

### C4. Audio Interaction

9. **Full playback**: Each audio has a dedicated play/pause button and waveform visualization.
10. **Segment selection**: Annotators can click-and-drag on the waveform to select and loop a segment.
11. **Synchronized playback** (multi-audio): A "Play All" button plays all audio versions sequentially (Audio A, then B, then C...) with a configurable gap (default 1 second). This helps annotators compare without manually switching between players.
12. **A/B toggle** (multi-audio, 2 audios): A quick-toggle button that alternates playback between Audio A and Audio B from the same timestamp, making comparison easier.
13. **Playback speed**: Same controls as Tool 1 — 0.5x to 2x.
14. **Keyboard shortcuts**:
    | Shortcut | Action |
    |---|---|
    | `Space` | Play/Pause current audio |
    | `1` – `4` | Switch focus to Audio 1–4 |
    | `Tab` | Cycle through audios |
    | `Shift + Space` | Play All (sequential) |
    | `←` / `→` | Skip backward / forward 2s |
    | `Ctrl + →` | Next item |
    | `Ctrl + ←` | Previous item |

### C5. Evaluation Instruments UI

15. **Boolean questions**: Rendered as Yes/No toggle buttons per audio. Clear visual state (green for Yes, red for No, gray for unanswered). Each audio's answers are grouped under its label.

16. **Preference questions**: Rendered as a set of radio buttons or clickable audio labels. The annotator clicks the preferred audio. A "No preference" option is always available. The winning audio's card gets a subtle highlight.

17. **Ranking questions**: Rendered as a drag-and-drop list or numbered dropdown selectors. The annotator orders audios from best (1) to worst (N). Ties are optionally supported (configurable by admin).

18. **Scoring scales**: Rendered as a horizontal scale with clickable/tappable numbers. Each number has a label anchor if configured (e.g., 1=Bad, 5=Excellent). The selected score is highlighted. Compact view for multiple scoring dimensions (e.g., a matrix: rows = dimensions, columns = score values).

19. **Per-audio comment**: A text area below each audio's evaluation section. Max 1,000 characters.

20. **Overall comment**: A text area at the bottom of the evaluation panel. Max 2,000 characters.

### C6. Blind Test Mode

21. When blind mode is enabled:
    - Audio versions are labeled generically: "Audio A", "Audio B", "Audio C", "Audio D".
    - The order is randomized per the configured seed strategy (`per_annotator` or `global`).
    - No source metadata (model name, version, provider) is shown anywhere in the UI.
    - The randomization mapping is stored server-side: `lnl_blind_mappings` table with columns `item_id`, `user_id` (null for global), `original_position`, `displayed_position`.
    - Annotators cannot inspect audio filenames or URLs to determine source (signed URLs use opaque keys).

22. **Un-blinding in reports**: Exported reports include both the blind label ("Audio A") and the real source identifier ("Model X v2.1") for each evaluation. The report clearly marks which audio was preferred/top-scored and maps it back to the real source.

23. **Blind integrity**: The system prevents admins from accidentally un-blinding a task while annotators are still working. A warning is shown if the admin attempts to change blind mode settings on an active task.

### C7. Multi-Audio Item Data Model

24. The `lnl_task_items` table is extended (or a related `lnl_item_audios` table is created) to support multiple audio versions per item:
    - **`lnl_item_audios`**: `id`, `item_id` (FK), `audio_position` (integer, 1-based), `audio_url` (R2 key or external URL), `source_identifier` (string — the real model/version name, hidden in blind mode), `metadata` (JSONB).

25. The `lnl_annotations` table for audio evaluation stores:
    - `boolean_answers`: JSONB — `{ "question_id": { "audio_position_1": true, "audio_position_2": false } }`
    - `preferences`: JSONB — `{ "question_id": "audio_position_2" }` (or `"no_preference"`)
    - `rankings`: JSONB — `{ "question_id": [2, 1, 3] }` (ordered audio positions, best first)
    - `scores`: JSONB — `{ "dimension_id": { "audio_position_1": 4, "audio_position_2": 3 } }`
    - `audio_comments`: JSONB — `{ "audio_position_1": "Clear but robotic", "audio_position_2": "Natural but has artifacts" }`
    - `overall_comment`: text.

### C8. Progress & Navigation

26. Same progress tracking as Tool 1: `X / N items completed`, status badges, jump-to-item, previous/next.
27. Items are considered "completed" when all required questions are answered (boolean, preference, scoring). Comments are optional unless configured as required.
28. An item with partial answers shows as "in progress" with a visual indicator of which questions are unanswered.

### C9. Auto-Save & Resume

29. Same auto-save mechanics as Tool 1: debounced 1-second save, versioned records, resume at last item.
30. Partial evaluations (some questions answered but not all) are saved and resumable.

---

## Non-Goals (Out of Scope for v1)

- **Audio-level labeling** (e.g., marking specific segments of audio as "artifact" or "glitch"): This is a future enhancement (mentioned in the spec as "out of scope v1"). The schema should include a `source` field to accommodate future auto-detected audio-level labels.
- **Real-time aggregation display**: Showing live consensus scores or agreement metrics to annotators during annotation. This could bias evaluations. Aggregation is available only in admin reports.
- **Audio waveform comparison overlay**: Displaying multiple waveforms stacked/overlaid for visual comparison. Stick to side-by-side players.
- **Spectrogram visualization**: Useful for expert evaluation but adds significant complexity. Defer to v2.
- **Dynamic re-randomization**: Changing blind mode mappings mid-task. Once set, the randomization is locked.
- **Pairwise preference matrix**: Automatically generating all pairwise comparisons from N audio versions (e.g., 6 pairs from 4 audios). For v1, the admin manually configures comparison groups.

---

## Design Considerations

- **Multi-audio layout must be clean and scannable**. Each audio player should be a self-contained card with its own controls and evaluation fields. Avoid visual clutter by using collapsible sections.
- **Color-neutral audio cards in blind mode**: Do not use distinct colors for Audio A, B, C, D that could create bias. Use identical card designs with only the letter label as distinction.
- **Evaluation instruments should feel like a focused questionnaire**, not a spreadsheet. Group related questions visually. Use clear section headings.
- **MOS-style scoring scales** should use large, tappable buttons with anchor labels. The currently selected score should be prominently highlighted.
- **The "Play All" sequential mode** should show a visual indicator of which audio is currently playing (e.g., highlight the active card, dim the others).
- **Consistent with the Listen & Log design language** established in Tool 1: glassmorphism-lite, high contrast, keyboard-driven, dark mode default.
- **Preference questions should feel decisive**: When the annotator selects a preferred audio, the chosen card gets a subtle "winner" highlight (e.g., a gold border or checkmark) while others remain neutral.

---

## Technical Considerations

### Database Schema (Additional Tables)

- **`lnl_item_audios`**: Multiple audio versions per item — `id`, `item_id` (FK to `lnl_task_items`), `audio_position` (integer), `audio_url`, `source_identifier`, `metadata` (JSONB), `created_at`.
- **`lnl_blind_mappings`**: Blind test randomization — `id`, `task_id` (FK), `item_id` (FK), `user_id` (FK, nullable for global seed), `original_position` (integer), `displayed_position` (integer), `created_at`.
- The `lnl_annotations` table uses the same structure as Tool 1 but with extended JSONB fields for preferences, rankings, and per-audio scores/comments (as defined in C7.25).

### Blind Mode Implementation

- Randomization is computed once when the annotator first opens an item (or when the task is published, for global seeds). The mapping is stored in `lnl_blind_mappings` and never changes for that task+item+user combination.
- The API layer intercepts item responses and reorders audio data according to the blind mapping before sending to the client. The client never sees the original order.
- Report export performs the reverse mapping: joins `lnl_blind_mappings` with `lnl_annotations` to reconstruct which displayed audio corresponds to which real source.

### Audio Delivery

- Same R2 storage with signed URLs as Tool 1.
- For multi-audio items, all audio URLs are fetched in a single API call. Pre-fetching the next item's audio URLs happens during the current item's annotation.
- Consider lazy-loading audio data: fetch metadata first, then load audio on play (to avoid loading 4 audio files simultaneously on page load).

### API Endpoints (Additional)

- `POST /api/listen-and-log/tasks/{taskId}/items/bulk-multi-audio` — Bulk upload for multi-audio items (CSV + audio ZIP with multiple versions per item).
- `GET /api/listen-and-log/tasks/{taskId}/items/{itemId}/audios` — Get all audio versions for an item (with blind mode applied if active).
- `GET /api/listen-and-log/tasks/{taskId}/export?format=csv|json&unblind=true` — Export with un-blinding.
- `GET /api/listen-and-log/tasks/{taskId}/analytics/scores` — Aggregated scoring analytics (distributions, means, rankings).

### Performance

- Multi-audio pages can be heavy (2–4 waveforms). Use lazy initialization: only render waveform for the audio the user is actively playing. Show a placeholder (static waveform image or simplified bar) for inactive audios.
- Defer waveform computation to a Web Worker to avoid blocking the main thread.

---

## Success Metrics

1. **Evaluation speed**: Average time per item is under 90 seconds for single-audio and under 180 seconds for multi-audio (4 versions).
2. **Completion rate**: 95%+ of assigned items are evaluated within the task deadline.
3. **Blind test integrity**: 0 instances of annotators accessing source identifiers during blind evaluation (validated via audit logs and URL inspection).
4. **Report accuracy**: Un-blinded reports correctly map 100% of displayed audio labels to real source identifiers.
5. **Score consistency**: For items evaluated by multiple annotators, inter-rater agreement (Krippendorff's alpha or Fleiss' kappa) exceeds 0.6 on scoring dimensions (baseline metric for future IAA).
6. **User satisfaction**: Annotators rate the multi-audio comparison experience 4+ out of 5 on usability.

---

## Open Questions

1. **Maximum audios per item**: The spec implies 2–4. Should we cap at 4, or allow more for specialized use cases (e.g., comparing 8 model outputs)? Recommendation: cap at 4 for v1 UI, but schema supports unlimited.
2. **Tie handling in rankings**: Should annotators be allowed to assign the same rank to multiple audios (ties)? Recommendation: configurable per task.
3. **Mandatory vs optional questions**: Should all configured questions be required before an item is marked "completed"? Recommendation: configurable per question (required/optional).
4. **Annotator fatigue management**: For large evaluation tasks, should the system enforce breaks (e.g., after 50 items, suggest a 5-minute break)? Recommendation: optional, configurable per task.
5. **Audio normalization**: Should the system normalize audio volume levels before presenting them to avoid loudness bias? Recommendation: yes, apply loudness normalization (EBU R128 / ITU-R BS.1770) server-side during upload.
6. **Preference question variants**: Beyond "which is best", should we support pairwise preferences (A vs B, then A vs C, etc.)? Recommendation: defer pairwise matrix to v2; v1 supports "pick best" and "rank all."

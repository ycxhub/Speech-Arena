# PRD: Listen & Log — Tool 3: IPA Validation & Correction

## Introduction / Overview

**Tool 3: IPA Validation & Correction** is the third and most specialized tool in the Listen & Log platform. It enables phonetic specialists to review, validate, and correct IPA (International Phonetic Alphabet) transcriptions by listening to audio renditions and comparing original vs. corrected pronunciations. The goal is to ensure that IPA transcriptions accurately represent standard pronunciation in line with organizational transcription conventions, improving pronunciation accuracy and modeling consistency across voices within a given locale.

This tool has a unique workflow: after editing an IPA transcription, the annotator can **re-render audio on the fly** using configured TTS providers (primarily Murf AI) to hear how the corrected IPA sounds across multiple voices, enabling immediate validation of the correction without waiting for an offline rendering pipeline.

This PRD builds upon the shared Listen & Log platform foundation (roles, invitations, task configuration, auto-save, reporting) defined in the Tool 1 PRD, and the multi-audio data model from Tool 2.

---

## Goals

1. Enable phonetic specialists to review IPA transcriptions word-by-word or phrase-by-phrase, validating them against audio renditions.
2. Provide a locale-aware on-screen IPA keyboard with symbol validation to ensure only valid phonetic symbols are used for the target language.
3. Allow annotators to edit IPA transcriptions and immediately re-render audio with the updated IPA using configured TTS providers, hearing the results across 2 voices.
4. Maintain clear distinction between original and modified audio/IPA, allowing side-by-side comparison.
5. Support annotation outcomes (correct, needs review, could not fix, etc.) for systematic tracking of validation progress.
6. Design for the same scale and platform standards (auto-save, audit trail, reporting) as Tools 1 and 2.

---

## User Stories

### Annotator (Phonetic Specialist)

- **As a phonetic specialist**, I want to see the word or phrase currently in focus for review, along with its existing IPA transcription, so I know exactly what I'm validating.
- **As a phonetic specialist**, I want to play the audio sample rendered with "voice 1" using the existing IPA so I can hear how it currently sounds.
- **As a phonetic specialist**, I want to see the text transcript alongside the audio to understand the pronunciation context.
- **As a phonetic specialist**, I want to see the valid IPA symbols for the target locale/language so I know which symbols are allowed.
- **As a phonetic specialist**, I want to insert or edit IPA symbols using an on-screen IPA keyboard organized by the IPA chart layout (consonants, vowels, diacritics, suprasegmentals).
- **As a phonetic specialist**, I want to type IPA symbols directly in an editable field using a smart input method (typing Roman characters suggests phonetically similar IPA symbols).
- **As a phonetic specialist**, I want the system to warn me if I use an invalid or disallowed symbol for the current locale.
- **As a phonetic specialist**, I want to re-render audio with my edited IPA using both voice 1 and voice 2, so I can hear whether my correction sounds right across different voices.
- **As a phonetic specialist**, I want to compare the original audio (with original IPA) side by side with the re-rendered audio (with my edited IPA), clearly seeing which is which.
- **As a phonetic specialist**, I want to select an annotation outcome from predefined options (e.g., "Correct as-is", "Corrected", "Needs further review", "Could not fix") to record my conclusion.
- **As a phonetic specialist**, I want to add a comment explaining my correction or why I marked something as "could not fix."
- **As a phonetic specialist**, I want my edits and outcome to save automatically and be resumable.

### Auditor / Reviewer

- **As an auditor**, I want to review phonetic specialists' corrections, comparing the original IPA with the corrected version and hearing both audio renditions.
- **As an auditor**, I want to approve, reject, or further modify a correction with full audit trail.

### Listen & Log Admin

- **As a Listen & Log Admin**, I want to configure IPA validation tasks specifying the target locale, valid IPA symbol set, TTS provider(s) and voice(s) for rendering.
- **As a Listen & Log Admin**, I want to upload a dataset of words/phrases with existing IPA transcriptions and pre-rendered audio.
- **As a Listen & Log Admin**, I want to configure the TTS provider(s) used for on-the-fly re-rendering (separate from Speech Arena's provider system).
- **As a Listen & Log Admin**, I want to set the two voices (voice 1 and voice 2) used for rendering, per task.
- **As a Listen & Log Admin**, I want to export a report showing: original IPA, corrected IPA (if changed), annotation outcome, specialist name, timestamps, and any comments.

---

## Functional Requirements

### D1. Task Configuration (IPA Validation Specific)

1. When creating a task with `tool_type = ipa_validation`, the admin configures:
   - **Target locale**: The language/locale for validation (e.g., `en-US`, `fr-FR`, `de-DE`). This determines the valid IPA symbol set.
   - **Valid IPA symbol set**: Auto-loaded based on locale but editable by admin. A JSON array of allowed IPA symbols (consonants, vowels, diacritics, suprasegmentals) for the language. Symbols outside this set trigger a warning.
   - **TTS provider configuration**: One or more providers configured specifically for Listen & Log (separate from Speech Arena). Each provider entry includes: provider name, API endpoint, API key (encrypted), and configuration parameters.
   - **Voice 1**: The primary voice used for pre-rendered audio and initial re-rendering. Specified as a voice ID within the configured provider.
   - **Voice 2**: A secondary voice for cross-voice validation. Ensures corrections generalize across voices.
   - **Annotation outcomes**: A list of predefined outcome options (default: "Correct as-is", "Corrected", "Needs further review", "Could not fix", "Skipped"). Admins can customize labels and add/remove options.
   - **Focus mode**: `word_by_word` (default — one word at a time) or `phrase` (annotator reviews multi-word sequences).

2. **Dataset format** for IPA validation:
   ```
   item_id, word_or_phrase, ipa_transcription, audio_voice1_filename, [audio_voice2_filename], [context_sentence], [language_code], [custom_columns...]
   ```
   - `word_or_phrase`: The text being validated.
   - `ipa_transcription`: The existing IPA transcription to review.
   - `audio_voice1_filename`: Pre-rendered audio using voice 1 and the existing IPA.
   - `audio_voice2_filename` (optional): Pre-rendered audio using voice 2. If not provided, voice 2 audio is only available after re-rendering.
   - `context_sentence` (optional): The full sentence containing the word/phrase, for pronunciation context.

### D2. IPA Validation Workspace Layout

3. The workspace is organized into distinct regions optimized for the IPA editing workflow:

   **Top bar**: Task name, progress indicator, item navigation (previous / next / jump-to), locale badge.

   **Focus panel** (upper left):
   - The word or phrase in focus, displayed in large text.
   - Below it: the current IPA transcription in a clearly styled, readable font (e.g., Charis SIL or Doulos SIL for proper IPA rendering).
   - Context sentence (if available) with the focus word highlighted.
   - Item metadata (language code, custom fields).

   **Audio comparison panel** (upper right):
   - Two rows of audio players:
     - **Row 1 — Original**: "Voice 1 — Original IPA" player and "Voice 2 — Original IPA" player (if pre-rendered).
     - **Row 2 — Modified** (appears after IPA edit + render): "Voice 1 — Modified IPA" player and "Voice 2 — Modified IPA" player.
   - Each player has: play/pause, waveform, current time / duration.
   - A visual indicator clearly labeling "Original" vs "Modified" (e.g., blue border for original, green border for modified).
   - An "A/B" toggle button per voice: quickly switch between original and modified audio for that voice.

   **IPA Editor** (middle area):
   - An editable text field pre-populated with the current IPA transcription.
   - Inline validation: invalid symbols are highlighted in red with a tooltip explaining the error.
   - A "Reset" button to revert to the original IPA.
   - A "Render" button that sends the edited IPA to the TTS provider and generates new audio for both voices.

   **IPA Keyboard** (below the editor):
   - An on-screen keyboard organized by the standard IPA chart layout:
     - **Consonants** (pulmonic): Grid organized by place and manner of articulation.
     - **Vowels**: Trapezoid layout.
     - **Diacritics**: Grouped by type (voicing, aspiration, nasalization, etc.).
     - **Suprasegmentals**: Stress marks, length marks, tone markers.
     - **Affricates and co-articulated consonants**.
   - Only symbols valid for the current locale are fully visible/clickable. Invalid symbols are dimmed or hidden.
   - A "Recently used" row at the top showing the last 10 symbols the annotator used (persisted per session).
   - A search/filter input: typing a Roman character (e.g., "t") highlights phonetically similar IPA symbols.
   - Clicking a symbol inserts it at the cursor position in the IPA editor.

   **Annotation panel** (right sidebar or bottom):
   - **Outcome selector**: Radio buttons or dropdown for the predefined annotation outcomes.
   - **Comment field**: Free-text area for explaining corrections or issues. Max 1,000 characters.
   - **Boolean questions**: If configured for the task (e.g., "Does the original IPA match the audio?").
   - **Scoring fields**: If configured (e.g., "Rate confidence in correction: 1–5").

### D3. Audio Interaction

4. **Pre-rendered audio**: The original audio (voice 1, and optionally voice 2) is pre-rendered and loaded from R2. No API call is needed for initial playback.

5. **On-the-fly re-rendering**: When the annotator clicks "Render" after editing the IPA:
   - The system sends the edited IPA and configured voice IDs to the TTS provider API.
   - A loading spinner appears on the "Modified" audio players.
   - Upon success, the re-rendered audio is stored temporarily (in R2 or in-memory) and the "Modified" players become active.
   - If rendering fails, an error message is shown with the provider's error details.

6. **Render debouncing**: The "Render" button is only active when the IPA has been modified from the last rendered version. Rapid clicks are debounced (2-second cooldown between renders).

7. **Audio comparison controls**:
   - **Per-voice A/B toggle**: For each voice, a toggle button switches between original and modified audio playback.
   - **Play All**: Plays original voice 1 → modified voice 1 → original voice 2 → modified voice 2 sequentially, with 0.5-second gaps.
   - Keyboard shortcut: `A` = play original voice 1, `S` = play modified voice 1, `D` = play original voice 2, `F` = play modified voice 2.

8. **Playback speed**: Same 0.5x–2x controls as Tools 1 and 2.

### D4. IPA Symbol Validation

9. Each locale has a defined **valid symbol set** stored in the task configuration. The symbol set is loaded when the task is created and can be customized by the admin.

10. **Real-time validation**: As the annotator types or inserts symbols in the IPA editor, the system checks each character/symbol against the valid set:
    - **Valid symbols**: Displayed normally.
    - **Invalid symbols**: Highlighted with a red underline and a tooltip: "Symbol [X] is not valid for [locale]. Did you mean [Y]?" (suggests the nearest valid symbol if possible).
    - **Warning symbols**: Symbols that are technically valid but rarely used for the locale — shown with a yellow underline: "Symbol [X] is uncommon for [locale]. Please verify."

11. **Validation is non-blocking**: The annotator can still save and render with invalid symbols (they may be intentional), but the system logs a warning.

12. **Symbol categories for validation**: The valid symbol set is organized into: required (must be available), optional (available but uncommon), and forbidden (not valid for the locale). This is stored as a JSONB field on the task configuration.

### D5. IPA Keyboard Implementation

13. **Unicode-based**: All IPA symbols are Unicode characters. The keyboard renders them using a font stack that prioritizes IPA-capable fonts: Charis SIL, Doulos SIL, Arial Unicode MS, Segoe UI.

14. **Locale filtering**: The keyboard shows only the symbols relevant to the current locale by default. A "Show all IPA" toggle reveals the full IPA chart (with non-locale symbols dimmed).

15. **Keyboard layout modes**:
    - **Chart mode** (default): Traditional IPA chart layout — consonants in a place×manner grid, vowels in a trapezoid.
    - **Category mode**: Flat grid grouped by category — plosives, fricatives, nasals, vowels, diacritics, etc.
    - **Favorites mode**: User's most-used symbols, auto-sorted by frequency.

16. **Smart input**: An input field above the keyboard where the annotator can type a Roman character and see matching IPA symbols in a dropdown (e.g., typing "sh" suggests ʃ, typing "th" suggests θ and ð). Selecting a suggestion inserts it into the IPA editor.

17. **Diacritics application**: Diacritics are applied to the last inserted or selected base symbol. The annotator selects a base symbol in the editor, then clicks a diacritic to apply it (e.g., select "t" → click "aspirated" → becomes "tʰ").

18. **Copy/paste support**: The IPA editor supports standard copy/paste. Pasted content is validated against the locale's symbol set.

### D6. Annotation Outcome & Comments

19. **Outcome selection**: The annotator must select an outcome before the item is considered "completed":
    - "Correct as-is" — The original IPA is accurate, no changes needed.
    - "Corrected" — The IPA was modified and the correction is validated.
    - "Needs further review" — The annotator is unsure; flagged for a more senior specialist.
    - "Could not fix" — The issue is identified but the annotator cannot determine the correct IPA.
    - "Skipped" — The annotator chooses to skip this item.
    Custom outcomes can be added via task configuration.

20. **Comment**: A free-text comment field for explaining the correction, the issue, or the reason for the selected outcome. Max 1,000 characters.

21. **Boolean questions & scores**: Same mechanics as Tools 1 and 2, if configured for the task.

### D7. Data Model (IPA Validation Specific)

22. The `lnl_task_items` table for IPA validation items includes:
    - `word_or_phrase` (text): The text being validated (stored alongside or as the `text` field).
    - `ipa_original` (text): The original IPA transcription.
    - `context_sentence` (text, nullable): The full sentence for context.
    - `language_code` (string): The locale code.

23. The `lnl_annotations` table for IPA validation stores:
    - `ipa_modified` (text, nullable): The edited IPA transcription (null if unchanged).
    - `outcome` (string): The selected annotation outcome.
    - `render_history` (JSONB): Array of render events — `{ ipa, voice_id, audio_url, rendered_at, provider, status }`. Tracks every re-render for audit purposes.
    - `boolean_answers`, `scores`, `overall_comment` — same as other tools.

24. **`lnl_ipa_symbol_sets`**: Locale-specific IPA symbol configurations — `id`, `locale` (string, e.g., "en-US"), `symbols` (JSONB — `{ required: [...], optional: [...], forbidden: [...] }`), `version` (integer), `created_by`, `created_at`, `updated_at`. Shared across tasks of the same locale.

25. **`lnl_render_cache`**: Cache of rendered audio to avoid redundant TTS calls — `id`, `ipa_text`, `voice_id`, `provider_id`, `audio_url`, `created_at`, `expires_at`. If the same IPA + voice combination has been rendered before, the cached audio is returned instead of making a new API call.

### D8. TTS Provider Integration (Listen & Log Specific)

26. Listen & Log has its **own provider configuration system**, separate from Speech Arena's TTS providers. This uses the `lnl_providers` table defined in the Tool 1 PRD.

27. The provider integration layer supports:
    - **Murf AI** (primary): IPA-to-speech synthesis via Murf's API. Verify Murf AI's latest IPA synthesis API docs (2025/2026) for endpoint signatures, supported IPA formats, and voice IDs.
    - **Configurable additional providers**: The admin can configure other TTS providers that support IPA input. Each provider has an adapter implementing a common interface: `renderIPA(ipa: string, voiceId: string, options: RenderOptions): Promise<AudioBuffer>`.

28. **Rate limiting**: On-the-fly renders are rate-limited per user (e.g., max 30 renders per minute, max 500 per day per user) to control API costs. Limits are configurable per task.

29. **Cost tracking**: Each render call's provider cost is logged for budgeting purposes. Admins can view cumulative render costs per task.

30. **Fallback behavior**: If the primary provider fails, the system can optionally try a secondary provider (if configured). The annotator sees a warning: "Rendered using fallback provider [name]."

### D9. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Play/Pause currently focused audio |
| `A` | Play original voice 1 |
| `S` | Play modified voice 1 |
| `D` | Play original voice 2 |
| `F` | Play modified voice 2 |
| `R` | Render audio with current IPA edits |
| `Ctrl + Z` | Undo last IPA edit |
| `Ctrl + Shift + Z` | Redo IPA edit |
| `Ctrl + R` | Reset IPA to original |
| `Ctrl + →` | Next item |
| `Ctrl + ←` | Previous item |
| `Enter` (in outcome panel) | Confirm outcome and advance to next item |

### D10. Progress & Navigation

31. Same progress tracking as Tools 1 and 2.
32. Items with outcome "Needs further review" or "Could not fix" are visually flagged in the navigation and can be filtered.
33. An admin dashboard widget shows: % corrected, % confirmed correct, % needing review, % unfixable — giving a quick health overview of the IPA dataset.

---

## Non-Goals (Out of Scope for v1)

- **Batch processing**: Reviewing and correcting IPA for multiple words at once in a batch view (e.g., a table of 20 words with inline editing). This is a high-priority v2 feature. Design the schema to support it.
- **LLM-based IPA suggestions**: Using an LLM or phonetic model to auto-suggest IPA corrections. This is planned for future integration. The schema includes a `source` field (`manual`, `auto`, `auto_reviewed`) to accommodate this.
- **Smart pronunciation suggestions**: Auto-suggesting corrections based on common error patterns or phonetic rules. Deferred to v2.
- **QA role with specialized workflows**: A formal QA role with approval queues and quality gates. For v1, the auditor role covers this. A dedicated QA workflow can be designed when the team scales.
- **Spectrogram-based validation**: Showing spectrograms alongside audio for expert analysis.
- **Batch re-rendering**: Rendering all corrected IPAs at once (e.g., "render all corrections for this task"). For v1, rendering is item-by-item.
- **Multi-locale tasks**: A single task covers one locale. Multi-locale datasets should be split into separate tasks.

---

## Design Considerations

- **The IPA keyboard is the centerpiece of this tool**. It must be ergonomic, fast, and not feel like a hindrance. Prioritize keyboard shortcuts and smart input over mouse-clicking individual symbols.
- **IPA font rendering is critical**: Use web fonts (Charis SIL, Doulos SIL) that render all IPA symbols correctly. Test thoroughly on macOS, Windows, and Linux. Include a font loading strategy (FOUT prevention) so symbols never appear as tofu (missing character boxes).
- **Audio comparison must be effortless**: The annotator should be able to switch between original and modified audio in a single keystroke. Visual labels (Original vs. Modified) must be unambiguous — use both text labels and color coding (blue = original, green = modified).
- **The IPA editor should feel like a code editor**: Syntax highlighting for IPA (different colors for consonants, vowels, diacritics, suprasegmentals), cursor positioning, undo/redo, and inline validation. Consider using a lightweight code editor component (e.g., CodeMirror with a custom IPA mode).
- **Render feedback must be immediate and clear**: Show a loading spinner during rendering, a success indicator with the render time ("Rendered in 1.2s"), and clear error messages if rendering fails.
- **Locale badge**: Always show the current locale prominently (e.g., "en-US" badge in the top bar) so the annotator always knows which symbol set is active.
- **Consistent with the Listen & Log design language**: Same glassmorphism-lite, dark mode, and component library as Tools 1 and 2.

---

## Technical Considerations

### IPA Font Stack

- Include **Charis SIL** and **Doulos SIL** as web fonts (both are open-source, SIL Open Font License). These are the gold standard for IPA rendering.
- Font stack CSS: `font-family: 'Charis SIL', 'Doulos SIL', 'Arial Unicode MS', 'Lucida Sans Unicode', sans-serif;`
- Use `@font-face` declarations with `woff2` format for optimal loading.
- Test rendering for all IPA symbols in the supported locale set before launching.

### IPA Symbol Set Management

- Maintain a master IPA symbol database covering all locales. Source: the Unicode IPA Extensions block (U+0250–U+02AF), IPA Extensions (U+1D00–U+1D7F), and combining diacritics (U+0300–U+036F).
- Per-locale subsets are curated by phonetic experts and stored in `lnl_ipa_symbol_sets`. Provide sensible defaults for common locales (en-US, en-GB, fr-FR, de-DE, es-ES, etc.) that can be refined by admins.
- The symbol set is versioned — if a set is updated, existing tasks retain their original version for consistency.

### TTS Provider Adapter

- Create a `LnlTtsProvider` interface:
  ```typescript
  interface LnlTtsProvider {
    renderIPA(params: {
      ipa: string;
      voiceId: string;
      locale: string;
      options?: { speed?: number; format?: 'mp3' | 'wav' };
    }): Promise<{ audioUrl: string; durationMs: number; cost?: number }>;
    
    getVoices(locale: string): Promise<Array<{ id: string; name: string; gender: string }>>;
  }
  ```
- Implement `MurfAiLnlProvider` as the primary adapter. Additional providers implement the same interface.
- The adapter handles authentication, request formatting, error handling, and response parsing.
- Re-rendered audio is stored in R2 at `lnl/{taskId}/{itemId}/renders/{ipa_hash}_{voiceId}.mp3` for caching.

### Render Caching

- Before making a TTS API call, check `lnl_render_cache` for an existing render with the same IPA text + voice ID + provider.
- Cache entries expire after a configurable period (default: 30 days).
- This significantly reduces API costs for common words/phrases that multiple annotators or auditors re-render.

### API Endpoints (Additional)

- `POST /api/listen-and-log/render-ipa` — Render audio from IPA. Body: `{ taskId, itemId, ipa, voiceId }`. Returns: `{ audioUrl, durationMs }`. Rate-limited.
- `GET /api/listen-and-log/ipa-symbols/{locale}` — Get the valid IPA symbol set for a locale.
- `PUT /api/listen-and-log/ipa-symbols/{locale}` — Update a locale's IPA symbol set (lnl_admin only).
- `GET /api/listen-and-log/tasks/{taskId}/render-stats` — Render usage statistics (count, cost, cache hit rate).

### Performance

- IPA keyboard rendering: Use a virtualized grid for the full IPA chart (200+ symbols). Only render visible symbols.
- Render latency: Target < 3 seconds for on-the-fly TTS rendering. Show a progress indicator if longer.
- Smart input search: Use a pre-built index (trie or hash map) of Roman-to-IPA mappings for instant lookup.
- Pre-load the IPA symbol set and keyboard layout on task entry (one API call).

---

## Success Metrics

1. **Validation speed**: Average time per item is under 120 seconds (including re-render time).
2. **Correction accuracy**: Auditor rejection rate of corrections is under 10%.
3. **Render success rate**: 99%+ of re-render requests succeed on first attempt.
4. **Render cache hit rate**: After initial task ramp-up, 30%+ of renders are served from cache.
5. **Symbol accuracy**: 0 instances of invalid IPA symbols in finalized annotations (after auditor review).
6. **Completion rate**: 95%+ of assigned items are validated within the task deadline.
7. **Cross-voice consistency**: Corrections validated on voice 1 also sound correct on voice 2 in 90%+ of cases (validated by auditor spot-checks).

---

## Open Questions

1. **Murf AI IPA API**: What is the exact API endpoint and request format for IPA-to-speech rendering in Murf AI? Verify against Murf AI's latest docs (2025/2026). Does Murf support SSML with `<phoneme>` tags, direct IPA input, or a proprietary format?
2. **IPA symbol set curation**: Who curates the per-locale IPA symbol sets — the Listen & Log Admin, a dedicated linguist role, or is it provided as a platform default? Recommendation: platform provides sensible defaults; Listen & Log Admin can customize per task.
3. **Render cost allocation**: How should TTS rendering costs be tracked and allocated — per task, per annotator, or globally? Recommendation: per task with per-annotator breakdown in reports.
4. **Batch rendering (v2 scope)**: When batch processing is added, should all items in a batch be rendered in parallel, or queued? This depends on API rate limits. Design the queue infrastructure in v1 even if batch rendering is deferred.
5. **Phonetic rule validation**: Beyond symbol-level validation, should the system validate phonotactic rules (e.g., "this consonant cluster is not valid in this language")? Recommendation: defer to v2 with LLM-based validation.
6. **Voice selection flexibility**: Should annotators be able to choose additional voices beyond the two configured for the task? Recommendation: no for v1. Annotators use the task-configured voices. Admins can create separate tasks with different voices.
7. **Context audio**: Should there be an option to render and play the entire context sentence (not just the focus word) with the corrected IPA? Recommendation: useful but complex — defer to v2.

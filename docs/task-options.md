# Task Options Reference

Task options control how annotators experience and complete Listen & Log (L&L) tasks. They are configured when creating a task (via the wizard or the "Create from Blind Tests" flow) and stored in `lnl_tasks.task_options`.

---

## Overview

Task options are grouped into four categories:

1. **Display Options** — What the annotator sees and in what order
2. **Comment Options** — Whether annotators can add comments
3. **Boolean Questions** — Yes/No questions per item (up to 10)
4. **Scoring Fields** — Numeric rating scales per item (up to 5)

---

## Display Options

### Randomized item order

- **Type:** Boolean
- **Default:** `false`
- **Effect:** When enabled, each annotator sees items in a different, deterministic order. The order is seeded by `userId + taskId`, so the same user always sees the same order for a given task.
- **Use case:** Reduces order bias (e.g., annotators being more lenient on later items). Useful for quality evaluation tasks.
- **Implementation:** Uses `lnl_blind_mappings`-style logic via `getDisplayOrder()` — display index is mapped to actual `item_index` in the database.

### Transcript visibility

- **Type:** String (`"shown"` | `"hidden"` | `"toggleable"`)
- **Default:** `"shown"`
- **Options:**
  - **Always shown** (`shown`): The transcript text is always visible below the audio player.
  - **Always hidden** (`hidden`): The transcript is never shown. Use for pure listening tasks (e.g., transcription or quality without reference text).
  - **Annotator can toggle** (`toggleable`): The annotator can show/hide the transcript. Useful when you want to encourage listening first, then checking against text.
- **Relationship:** Works with the transcript panel. Labels are applied to word spans in the transcript; if the transcript is hidden, label assignment is not possible (the annotator must select words to assign labels).

### Show IPA transcription field

- **Type:** Boolean
- **Default:** `false`
- **Effect:** When enabled, an IPA (International Phonetic Alphabet) transcription field is shown for each item — if the item has `ipa_text` in its metadata. The field is collapsible.
- **Use case:** IPA validation tasks, pronunciation correction, or when you want annotators to compare audio against a phonetic representation.
- **Relationship:** Requires `lnl_task_items.ipa_text` to be populated (e.g., via CSV upload with an `ipa` column). If the option is on but the item has no IPA, nothing is shown.

### Show normalized text field

- **Type:** Boolean
- **Default:** `false`
- **Effect:** When enabled, a normalized text field is shown for each item — if the item has `normalized_text` in its metadata. The field is collapsible.
- **Use case:** When the reference text differs from the spoken form (e.g., numbers vs. words, abbreviations expanded). Helps annotators compare what was said vs. what was intended.
- **Relationship:** Requires `lnl_task_items.normalized_text` to be populated (e.g., via CSV upload with a `normalized_text` column).

---

## Comment Options

### Per-label comments

- **Type:** Boolean
- **Default:** `true`
- **Effect:** When enabled, each label assignment (span annotation) has an optional comment field. Annotators can add notes specific to that span (e.g., "mispronounced 'th'").
- **Relationship:** Tied to **Labels**. Each label in `label_config` can be assigned to word spans; per-label comments attach to those span-level annotations. Stored in `lnl_annotations.labels` as part of each label entry.

### Overall item comment

- **Type:** Boolean
- **Default:** `true`
- **Effect:** When enabled, a free-text "Overall Comment" textarea is shown for each item. Annotators can add general observations (e.g., "Overall quality is good, minor issues at 0:15").
- **Relationship:** Stored in `lnl_annotations.overall_comment`. Independent of labels — applies to the whole item, not to specific spans.

---

## Boolean Questions

- **Type:** Array of strings (max 10)
- **Default:** `[]`
- **Effect:** Each string is a Yes/No question shown in the annotation side panel. Annotators answer with a toggle. Example: "Is the pronunciation acceptable?"
- **Relationship:** Stored in `lnl_annotations.boolean_answers` as `{ "0": true, "1": false, ... }` (indexed by question index). Useful for quick, item-level judgments that don’t require span selection.
- **Use case:** Quality checks, acceptability judgments, or any binary decision per item.

---

## Scoring Fields

- **Type:** Array of objects: `{ name, min, max, description }`
- **Default:** `[]`
- **Max:** 5 fields per task
- **Effect:** Each field defines a numeric scale (e.g., 1–5). Annotators pick a value for each field. Example: `{ name: "Naturalness", min: 1, max: 5, description: "Rate how natural the speech sounds" }`.
- **Relationship:** Stored in `lnl_annotations.scores` as `{ "Naturalness": 4, "Clarity": 5 }`. Used for MOS-style (Mean Opinion Score) or similar ratings.
- **Use case:** Subjective ratings (naturalness, clarity, prosody) or any numeric scale per item.

---

## How Options Relate to the Task

| Option / Group        | Affects                          | Stored in                    |
|----------------------|----------------------------------|------------------------------|
| Randomized order     | Item navigation, display index    | `lnl_blind_mappings` (logic) |
| Transcript visibility| Transcript panel visibility      | Task config only             |
| Show IPA / normalized| Additional fields panel          | Task config + item metadata  |
| Per-label comments   | Label span annotations          | `lnl_annotations.labels`      |
| Overall comment      | Item-level comment              | `lnl_annotations.overall_comment` |
| Boolean questions    | Side panel questions            | `lnl_annotations.boolean_answers`  |
| Scoring fields       | Side panel scoring              | `lnl_annotations.scores`      |

---

## How Options Relate to Each Other

- **Labels** are required for text annotation tasks. Per-label comments only apply when labels exist and are assigned to spans.
- **Transcript visibility** affects whether the transcript (and thus label assignment) is available. If `hidden`, annotators can still use Boolean Questions, Scoring Fields, and Overall Comment.
- **Show IPA / Show normalized text** depend on item-level data (`ipa_text`, `normalized_text`). They are display toggles; they don’t change what’s stored.
- **Boolean Questions** and **Scoring Fields** are independent of labels and transcript. They provide item-level structured data alongside (or instead of) span-level labels.
- **Overall Comment** is independent of all other options and provides unstructured feedback per item.

---

## Tool Types

Task options apply primarily to **text_annotation** (Text Annotation with Single Audio). Other tool types (e.g., `audio_evaluation`, `ipa_validation`) may use a subset of these options. The wizard and "Create from Blind Tests" flow create `text_annotation` tasks by default.

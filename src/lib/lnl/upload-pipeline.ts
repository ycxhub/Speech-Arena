import { getAdminClient } from "@/lib/supabase/admin";
import { uploadAudio } from "@/lib/r2/storage";
import type { ParsedRow } from "./csv-parser";

export async function processDatasetUpload(
  taskId: string,
  csvRows: ParsedRow[],
  audioFiles: Map<string, Buffer>
): Promise<{ itemsCreated: number; errors: string[] }> {
  const adminClient = getAdminClient();
  const errors: string[] = [];
  let itemsCreated = 0;

  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i];
    const itemIndex = i + 1;

    let audioUrl = "";
    const audioBuffer = audioFiles.get(row.audio_filename.toLowerCase());

    if (audioBuffer) {
      const r2Key = `lnl/${taskId}/${itemIndex}/${row.audio_filename}`;
      try {
        await uploadAudio(audioBuffer, r2Key);
        audioUrl = r2Key;
      } catch (err) {
        errors.push(
          `Row ${i + 1}: Failed to upload audio "${row.audio_filename}": ${err instanceof Error ? err.message : "Unknown error"}`
        );
        continue;
      }
    } else {
      audioUrl = row.audio_filename;
    }

    const metadata: Record<string, string> = {};
    for (const [key, val] of Object.entries(row)) {
      if (
        !["item_id", "text", "audio_filename", "ipa", "normalized_text"].includes(key) &&
        val !== undefined
      ) {
        metadata[key] = val;
      }
    }

    const { error } = await adminClient.from("lnl_task_items").insert({
      task_id: taskId,
      item_index: itemIndex,
      audio_url: audioUrl,
      text: row.text,
      ipa_text: row.ipa || null,
      normalized_text: row.normalized_text || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : {},
    });

    if (error) {
      errors.push(`Row ${i + 1}: Database insert failed: ${error.message}`);
    } else {
      itemsCreated++;
    }
  }

  return { itemsCreated, errors };
}

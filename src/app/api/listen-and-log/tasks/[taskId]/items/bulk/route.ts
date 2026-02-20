import { createClient } from "@/lib/supabase/server";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { parseAndValidateCsv } from "@/lib/lnl/csv-parser";
import { processDatasetUpload } from "@/lib/lnl/upload-pipeline";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const csvFile = formData.get("csv") as File | null;

  if (!csvFile) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  const audioEntries = formData.getAll("audio") as File[];
  const audioFiles = new Map<string, Buffer>();

  for (const file of audioEntries) {
    const buffer = Buffer.from(await file.arrayBuffer());
    audioFiles.set(file.name.toLowerCase(), buffer);
  }

  const csvContent = await csvFile.text();
  const audioNames = Array.from(audioFiles.keys());
  const parseResult = parseAndValidateCsv(csvContent, audioNames);

  if (!parseResult.valid) {
    return NextResponse.json(
      { error: "CSV validation failed", errors: parseResult.errors },
      { status: 400 }
    );
  }

  const result = await processDatasetUpload(taskId, parseResult.rows, audioFiles);

  return NextResponse.json({
    itemsCreated: result.itemsCreated,
    errors: result.errors,
  });
}

import { createClient } from "@/lib/supabase/server";
import { isLnlAdmin } from "@/lib/lnl/roles";
import { generateCsvExport, generateJsonExport } from "@/lib/lnl/export";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { searchParams } = new URL(request.url);

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

  const format = searchParams.get("format") ?? "csv";
  const filters = {
    annotator: searchParams.get("annotator") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  };

  try {
    if (format === "json") {
      const data = await generateJsonExport(taskId, filters);
      const filename = `lnl-export-${taskId}-${Date.now()}.json`;
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const csv = await generateCsvExport(taskId, filters);
    const filename = `lnl-export-${taskId}-${Date.now()}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    );
  }
}

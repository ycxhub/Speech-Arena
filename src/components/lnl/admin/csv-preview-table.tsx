"use client";

import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import type { ParseResult } from "@/lib/lnl/csv-parser";

interface Props {
  result: ParseResult;
}

export function CsvPreviewTable({ result }: Props) {
  const errorsByRow = new Map<number, string[]>();
  for (const err of result.errors) {
    const msgs = errorsByRow.get(err.row) ?? [];
    msgs.push(`${err.column}: ${err.message}`);
    errorsByRow.set(err.row, msgs);
  }

  const validCount = result.rows.length - errorsByRow.size;
  const displayCols = result.headers.slice(0, 5);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <LnlBadge variant={result.valid ? "success" : "error"}>
          {result.valid ? "All valid" : `${result.errors.length} errors`}
        </LnlBadge>
        <span className="text-sm text-neutral-400">
          {validCount} of {result.rows.length} rows valid
        </span>
      </div>

      <div className="max-h-80 overflow-auto rounded-lg border border-neutral-800">
        <table className="w-full min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900">
              <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">
                #
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">
                Status
              </th>
              {displayCols.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left text-xs font-medium text-neutral-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.slice(0, 50).map((row, i) => {
              const rowNum = i + 2;
              const rowErrors = errorsByRow.get(rowNum);
              const hasError = !!rowErrors;

              return (
                <tr
                  key={i}
                  className={`border-b border-neutral-800/50 ${
                    hasError ? "bg-red-950/20" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-neutral-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    {hasError ? (
                      <span className="text-red-400" title={rowErrors.join("; ")}>
                        ✕
                      </span>
                    ) : (
                      <span className="text-emerald-400">✓</span>
                    )}
                  </td>
                  {displayCols.map((col) => (
                    <td
                      key={col}
                      className="max-w-[200px] truncate px-3 py-2 text-neutral-300"
                    >
                      {row[col] ?? ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {result.rows.length > 50 && (
          <p className="px-3 py-2 text-xs text-neutral-500">
            Showing first 50 of {result.rows.length} rows
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

export interface GlassTableColumn<T = Record<string, unknown>> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface GlassTableProps<T = Record<string, unknown>> {
  columns: GlassTableColumn<T>[];
  data: T[];
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  className?: string;
}

export function GlassTable<T extends Record<string, unknown>>({
  columns,
  data,
  onSort,
  onRowClick,
  loading = false,
  className,
}: GlassTableProps<T>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-white/10",
        className
      )}
    >
      <table className="w-full min-w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "border-b border-white/10 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-white/40",
                  col.sortable && "cursor-pointer select-none hover:text-white/60"
                )}
                onClick={
                  col.sortable && onSort ? () => onSort(col.key) : undefined
                }
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="border-b border-white/10 px-4 py-8 text-center text-white/40"
              >
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="border-b border-white/10 px-4 py-8 text-center text-white/40"
              >
                No data
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-b border-white/5 transition-colors hover:bg-white/5",
                  rowIndex % 2 === 0 ? "bg-white/[0.02]" : "bg-white/[0.05]",
                  onRowClick && "cursor-pointer"
                )}
                onClick={
                  onRowClick
                    ? (e) => {
                        if ((e.target as HTMLElement).closest("button, [role='switch']")) return;
                        onRowClick(row);
                      }
                    : undefined
                }
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-white">
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as React.ReactNode) ?? ""}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

export interface LnlTableColumn<T = Record<string, unknown>> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

export interface LnlTableProps<T = Record<string, unknown>> {
  columns: LnlTableColumn<T>[];
  data: T[];
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function LnlTable<T extends Record<string, unknown>>({
  columns,
  data,
  onSort,
  onRowClick,
  loading = false,
  emptyMessage = "No data",
  className,
}: LnlTableProps<T>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-neutral-800",
        className
      )}
    >
      <table className="w-full min-w-full border-collapse">
        <thead>
          <tr className="border-b border-neutral-800 bg-neutral-900">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500",
                  col.sortable &&
                    "cursor-pointer select-none hover:text-neutral-300",
                  col.className
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
                className="px-4 py-8 text-center text-sm text-neutral-500"
              >
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-neutral-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-b border-neutral-800/50 transition-colors",
                  "hover:bg-neutral-800/50",
                  onRowClick && "cursor-pointer"
                )}
                onClick={
                  onRowClick
                    ? (e) => {
                        if (
                          (e.target as HTMLElement).closest(
                            "button, a, [role='switch']"
                          )
                        )
                          return;
                        onRowClick(row);
                      }
                    : undefined
                }
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-sm text-neutral-200",
                      col.className
                    )}
                  >
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

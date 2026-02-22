import { cn } from "@/lib/utils";

export interface LnlBreadcrumb {
  label: string;
  href?: string;
}

export interface LnlHeaderProps {
  breadcrumbs?: LnlBreadcrumb[];
  actions?: React.ReactNode;
  className?: string;
  /** When true, stack breadcrumbs and actions vertically, centered */
  stacked?: boolean;
}

export function LnlHeader({
  breadcrumbs,
  actions,
  className,
  stacked = false,
}: LnlHeaderProps) {
  return (
    <header
      className={cn(
        "flex min-h-14 border-b border-neutral-800 bg-neutral-950 px-6 py-4",
        stacked
          ? "flex-col items-center justify-center gap-4"
          : "items-center justify-between gap-6",
        className
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <svg className="size-3.5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="text-neutral-400 transition-colors hover:text-neutral-200"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="font-medium text-neutral-100">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      ) : (
        stacked ? null : <div />
      )}

      {actions && (
        <div className={cn(
          "flex flex-wrap items-center gap-4",
          stacked && "flex-col"
        )}>
          {actions}
        </div>
      )}
    </header>
  );
}

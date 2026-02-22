export default function AnnotationItemLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <header className="flex min-h-14 items-center justify-between gap-6 border-b border-neutral-800 bg-neutral-950 px-6 py-4">
        <nav className="flex items-center gap-1.5">
          <div className="h-4 w-24 animate-pulse rounded bg-neutral-800" />
          <div className="h-3 w-2 animate-pulse rounded bg-neutral-800" />
          <div className="h-4 w-32 animate-pulse rounded bg-neutral-800" />
          <div className="h-3 w-2 animate-pulse rounded bg-neutral-800" />
          <div className="h-4 w-16 animate-pulse rounded bg-neutral-800" />
        </nav>
        <div className="flex items-center gap-6">
          <div className="h-5 w-20 animate-pulse rounded bg-neutral-800" />
          <div className="flex gap-2">
            <div className="h-8 w-14 animate-pulse rounded bg-neutral-800" />
            <div className="h-8 w-14 animate-pulse rounded bg-neutral-800" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content skeleton */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {/* Audio player placeholder */}
          <div className="h-24 animate-pulse rounded-lg bg-neutral-800" />

          {/* Transcript placeholder */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex flex-wrap gap-x-1.5 gap-y-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="h-5 w-16 animate-pulse rounded bg-neutral-800" />
              ))}
            </div>
          </div>

          {/* Additional fields placeholder */}
          <div className="h-20 animate-pulse rounded-lg bg-neutral-800/50" />
        </div>

        {/* Side panel skeleton */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-6">
          <div className="flex flex-col gap-6">
            <div>
              <div className="mb-2 h-3 w-16 animate-pulse rounded bg-neutral-800" />
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-20 animate-pulse rounded-md bg-neutral-800" />
                ))}
              </div>
            </div>
            <div className="mt-auto border-t border-neutral-800 pt-4">
              <div className="h-8 w-full animate-pulse rounded-lg bg-neutral-800" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

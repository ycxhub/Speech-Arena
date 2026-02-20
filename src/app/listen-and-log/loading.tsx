export default function LnlDashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-neutral-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
          >
            <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-800" />
            <div className="h-4 w-full animate-pulse rounded bg-neutral-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-800" />
            <div className="mt-2 h-2 w-full animate-pulse rounded-full bg-neutral-800" />
            <div className="h-9 w-24 animate-pulse rounded-lg bg-neutral-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

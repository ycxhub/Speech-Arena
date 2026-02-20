export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-neutral-800" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-neutral-800" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-800" />
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-neutral-800/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

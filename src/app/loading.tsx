export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl"
          >
            <div className="mb-4 h-4 w-3/4 rounded bg-white/10" />
            <div className="mb-2 h-3 w-full rounded bg-white/5" />
            <div className="mb-2 h-3 w-4/5 rounded bg-white/5" />
            <div className="h-3 w-2/3 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

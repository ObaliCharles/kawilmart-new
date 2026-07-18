// Route-level loading boundary: shown instantly by the App Router on every
// navigation into a route segment that is still rendering on the server.
// Neutral page skeleton (navbar strip + content blocks) so no transition
// ever presents a frozen or blank screen, and layout doesn't shift on load.
const shimmer = "animate-pulse rounded-lg bg-gray-200/70";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading page">
      {/* navbar placeholder */}
      <div className="border-b border-gray-100 bg-white px-3 py-2.5 md:px-5">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3">
          <div className={`h-10 w-10 shrink-0 rounded-xl ${shimmer}`} />
          <div className={`h-10 min-w-0 flex-1 rounded-full ${shimmer}`} />
          <div className={`hidden h-9 w-24 shrink-0 md:block ${shimmer}`} />
          <div className={`hidden h-9 w-9 shrink-0 rounded-full md:block ${shimmer}`} />
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-3 py-4 md:px-5">
        {/* hero */}
        <div className={`aspect-[2.2/1] w-full md:aspect-[3.4/1] ${shimmer}`} />

        {/* category rail */}
        <div className="mt-4 flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex shrink-0 flex-col items-center gap-2">
              <div className={`h-12 w-12 rounded-full ${shimmer}`} />
              <div className={`h-2.5 w-10 rounded-full ${shimmer}`} />
            </div>
          ))}
        </div>

        {/* product grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className={`aspect-[1.12/1] w-full ${shimmer}`} />
              <div className={`h-3 w-4/5 rounded-full ${shimmer}`} />
              <div className={`h-3 w-2/5 rounded-full ${shimmer}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

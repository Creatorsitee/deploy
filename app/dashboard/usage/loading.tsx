export default function UsageLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="border-b border-neutral-200/80 pb-5 space-y-2">
        <div className="h-7 bg-neutral-200 rounded w-44 animate-pulse"></div>
        <div className="h-3 bg-neutral-100 rounded w-72 animate-pulse"></div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-36 bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
              <div className="h-4 bg-neutral-100 rounded w-4"></div>
            </div>
            <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
            <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-3"></div>
            <div className="h-3 bg-neutral-100 rounded w-2/3 mt-2"></div>
          </div>
        ))}
      </div>

      {/* Details Box Skeleton */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs animate-pulse space-y-3">
        <div className="h-5 bg-neutral-200 rounded w-36"></div>
        <div className="h-3 bg-neutral-100 rounded w-4/5"></div>
        <div className="h-3 bg-neutral-100 rounded w-2/3"></div>
      </div>
    </div>
  );
}

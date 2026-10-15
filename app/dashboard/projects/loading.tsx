export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div className="space-y-2">
          <div className="h-7 bg-neutral-200 rounded w-40 animate-pulse"></div>
          <div className="h-3 bg-neutral-100 rounded w-64 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 bg-neutral-200 rounded-lg w-28 animate-pulse"></div>
          <div className="h-9 bg-neutral-200 rounded-lg w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-3 flex gap-3 shadow-2xs">
        <div className="h-9 bg-neutral-100 rounded-lg flex-1 animate-pulse"></div>
        <div className="h-9 bg-neutral-100 rounded-lg w-28 animate-pulse"></div>
      </div>

      {/* Projects Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-40 bg-white border border-neutral-200 rounded-xl p-5 animate-pulse space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
              <div className="h-5 bg-neutral-100 rounded-full w-14"></div>
            </div>
            <div className="h-3 bg-neutral-100 rounded w-2/3"></div>
            <div className="h-4 bg-neutral-100 rounded w-1/2 mt-4"></div>
            <div className="h-8 bg-neutral-50 rounded-lg mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

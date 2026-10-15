export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Project Header Skeleton */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs animate-pulse space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 bg-neutral-200 rounded w-48"></div>
              <div className="h-5 bg-neutral-100 rounded-full w-16"></div>
            </div>
            <div className="h-4 bg-neutral-100 rounded w-64"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-neutral-200 rounded-lg w-24"></div>
            <div className="h-9 bg-neutral-200 rounded-lg w-28"></div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 bg-white border border-neutral-200 rounded-xl p-5 animate-pulse space-y-3 shadow-2xs"
          >
            <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
            <div className="h-6 bg-neutral-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-neutral-200 pb-2">
        <div className="h-8 bg-neutral-200 rounded-lg w-28 animate-pulse"></div>
        <div className="h-8 bg-neutral-100 rounded-lg w-28 animate-pulse"></div>
        <div className="h-8 bg-neutral-100 rounded-lg w-28 animate-pulse"></div>
        <div className="h-8 bg-neutral-100 rounded-lg w-28 animate-pulse"></div>
      </div>

      {/* Main Content Box Skeleton */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 animate-pulse space-y-4 shadow-2xs">
        <div className="h-5 bg-neutral-200 rounded w-40"></div>
        <div className="h-4 bg-neutral-100 rounded w-full"></div>
        <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
        <div className="h-20 bg-neutral-50 rounded-lg mt-4 border border-neutral-100"></div>
      </div>
    </div>
  );
}

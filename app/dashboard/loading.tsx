export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome & Action Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div className="space-y-2">
          <div className="h-7 bg-neutral-200 rounded-lg w-56 animate-pulse"></div>
          <div className="h-3.5 bg-neutral-100 rounded w-72 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 bg-neutral-200 rounded-lg w-36 animate-pulse"></div>
        </div>
      </div>

      {/* Overview Stat Cards Skeleton (2 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3.5 bg-neutral-100 rounded w-28"></div>
            <div className="w-4 h-4 bg-neutral-100 rounded"></div>
          </div>
          <div className="h-8 bg-neutral-200 rounded w-20"></div>
          <div className="h-2 bg-neutral-100 rounded-full w-full"></div>
          <div className="h-3 bg-neutral-100 rounded w-44"></div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3.5 bg-neutral-100 rounded w-28"></div>
            <div className="w-4 h-4 bg-neutral-100 rounded"></div>
          </div>
          <div className="h-8 bg-neutral-200 rounded w-20"></div>
          <div className="h-2 bg-neutral-100 rounded-full w-full"></div>
          <div className="h-3 bg-neutral-100 rounded w-44"></div>
        </div>
      </div>

      {/* Projects List Header & Cards Skeleton */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="h-5 bg-neutral-200 rounded w-36 animate-pulse"></div>
          <div className="h-8 bg-neutral-100 rounded-lg w-48 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-2xs animate-pulse space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="h-5 bg-neutral-200 rounded w-1/2"></div>
                  <div className="h-3.5 bg-neutral-100 rounded w-3/4"></div>
                </div>
                <div className="w-6 h-6 rounded bg-neutral-100 shrink-0"></div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div className="h-3 bg-neutral-100 rounded w-20"></div>
                <div className="h-3 bg-neutral-100 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

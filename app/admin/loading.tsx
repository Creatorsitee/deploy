export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div className="space-y-2">
          <div className="h-7 bg-neutral-200 rounded w-48 animate-pulse"></div>
          <div className="h-3 bg-neutral-100 rounded w-72 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 bg-neutral-100 rounded-lg w-28 animate-pulse"></div>
          <div className="h-9 bg-neutral-200 rounded-lg w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Stats Summary Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs animate-pulse space-y-3"
          >
            <div className="h-3 bg-neutral-100 rounded w-1/3"></div>
            <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
            <div className="h-3 bg-neutral-100 rounded w-2/3"></div>
          </div>
        ))}
      </div>

      {/* Admin Tabs Skeleton */}
      <div className="flex gap-2 border-b border-neutral-200 pb-2">
        <div className="h-8 bg-neutral-200 rounded-lg w-28 animate-pulse"></div>
        <div className="h-8 bg-neutral-100 rounded-lg w-28 animate-pulse"></div>
        <div className="h-8 bg-neutral-100 rounded-lg w-28 animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-neutral-200/80 rounded-xl shadow-2xs overflow-hidden p-4 space-y-3">
        <div className="h-9 bg-neutral-100 rounded-lg w-full animate-pulse"></div>
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-neutral-50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

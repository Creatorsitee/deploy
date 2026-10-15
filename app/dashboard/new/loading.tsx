export default function NewProjectLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header Skeleton */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs animate-pulse space-y-3">
        <div className="h-6 bg-neutral-200 rounded w-48"></div>
        <div className="h-3 bg-neutral-100 rounded w-80"></div>
        {/* Step Indicator */}
        <div className="flex items-center gap-2 pt-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-2.5 sm:h-3.5 bg-neutral-200/80 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Main Step Form Skeleton */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-6 sm:p-8 shadow-2xs animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-32"></div>
          <div className="h-10 bg-neutral-100 rounded-lg w-full"></div>
        </div>

        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-40"></div>
          <div className="h-10 bg-neutral-100 rounded-lg w-full"></div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="h-28 bg-neutral-50 border border-neutral-100 rounded-xl"></div>
          <div className="h-28 bg-neutral-50 border border-neutral-100 rounded-xl"></div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-neutral-100">
          <div className="h-9 bg-neutral-100 rounded-lg w-24"></div>
          <div className="h-9 bg-neutral-200 rounded-lg w-28"></div>
        </div>
      </div>
    </div>
  );
}

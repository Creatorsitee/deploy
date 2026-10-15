export default function DocsLoading() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-neutral-900 selection:text-white">
      {/* Navbar Skeleton */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-200 animate-pulse shrink-0"></div>
            <div className="h-5 bg-neutral-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 bg-neutral-200 rounded-lg w-28 animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Docs Content Skeleton */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Docs Sidebar Skeleton */}
          <aside className="hidden md:block md:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-4">
              <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-4 bg-neutral-100 rounded w-4/5 animate-pulse"></div>
                ))}
              </div>
              <div className="pt-4 border-t border-neutral-100">
                <div className="h-9 bg-neutral-200 rounded-lg w-full animate-pulse"></div>
              </div>
            </div>
          </aside>

          {/* Docs Main Content Skeleton */}
          <div className="md:col-span-9 space-y-8">
            <div className="border-b border-neutral-200/80 pb-6 space-y-2">
              <div className="h-8 bg-neutral-200 rounded-xl w-64 animate-pulse"></div>
              <div className="h-4 bg-neutral-100 rounded w-96 animate-pulse"></div>
            </div>

            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-neutral-200/80 rounded-xl p-6 sm:p-8 shadow-2xs animate-pulse space-y-4"
              >
                <div className="h-6 bg-neutral-200 rounded w-48"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-100 rounded w-full"></div>
                  <div className="h-4 bg-neutral-100 rounded w-5/6"></div>
                  <div className="h-4 bg-neutral-100 rounded w-4/6"></div>
                </div>
                <div className="h-24 bg-neutral-50 border border-neutral-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="bg-white border-t border-neutral-200/80 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="h-4 bg-neutral-100 rounded w-40 animate-pulse"></div>
          <div className="h-4 bg-neutral-100 rounded w-20 animate-pulse"></div>
        </div>
      </footer>
    </div>
  );
}

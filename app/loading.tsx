export default function RootLoading() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-neutral-900 selection:text-white">
      {/* Navbar Skeleton - Matching Navbar.tsx perfectly */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <span className="text-base font-bold tracking-tight text-neutral-950">
              CMNTY Deploy
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-neutral-200 rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse"></div>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <div className="h-8 bg-neutral-100 rounded-lg w-16 animate-pulse"></div>
            <div className="h-8 bg-neutral-200 rounded-lg w-24 animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-neutral-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 leading-[1.1] animate-pulse">
              <span className="block h-12 bg-neutral-200 rounded-2xl w-3/4 mx-auto mb-3"></span>
              <span className="block h-12 bg-neutral-200 rounded-2xl w-1/2 mx-auto"></span>
            </h1>

            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="h-4 bg-neutral-100 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-neutral-100 rounded w-5/6 mx-auto animate-pulse"></div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <div className="h-10 bg-neutral-200 rounded-lg w-36 animate-pulse"></div>
              <div className="h-10 bg-neutral-100 rounded-lg w-36 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* 3 CORE PILLARS */}
        <section className="py-16 sm:py-24 bg-[#fafafa] border-b border-neutral-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mx-auto text-center mb-12 sm:mb-16 space-y-3">
              <div className="h-8 bg-neutral-200 rounded-xl w-64 mx-auto animate-pulse"></div>
              <div className="h-4 bg-neutral-100 rounded w-80 mx-auto animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-neutral-200/80 rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-2xs animate-pulse space-y-4"
                >
                  <div className="space-y-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100"></div>
                    <div className="h-5 bg-neutral-200 rounded w-1/2"></div>
                    <div className="h-3.5 bg-neutral-100 rounded w-full"></div>
                    <div className="h-3.5 bg-neutral-100 rounded w-4/5"></div>
                  </div>
                  <div className="pt-4 border-t border-neutral-100">
                    <div className="h-3 bg-neutral-100 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 STEPS) */}
        <section className="py-16 sm:py-24 bg-white border-b border-neutral-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mx-auto text-center mb-12 sm:mb-16 space-y-3">
              <div className="h-8 bg-neutral-200 rounded-xl w-48 mx-auto animate-pulse"></div>
              <div className="h-4 bg-neutral-100 rounded w-64 mx-auto animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="h-4 bg-neutral-100 rounded w-8"></div>
                  <div className="h-5 bg-neutral-200 rounded w-1/2"></div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-neutral-100 rounded w-full"></div>
                    <div className="h-3.5 bg-neutral-100 rounded w-4/5"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MINIMAL CTA - Matching the exact dark banner */}
        <section className="py-16 sm:py-20 bg-neutral-950 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
            <div className="h-8 bg-neutral-800 rounded-lg w-3/4 mx-auto animate-pulse"></div>
            <div className="h-4 bg-neutral-800 rounded w-1/2 mx-auto animate-pulse"></div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <div className="h-10 bg-white/20 rounded-lg w-36 animate-pulse"></div>
              <div className="h-10 bg-neutral-800 rounded-lg w-36 animate-pulse"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Skeleton */}
      <footer className="bg-white border-t border-neutral-200/80 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="h-4 bg-neutral-100 rounded w-40 animate-pulse"></div>
          <div className="flex gap-4">
            <div className="h-4 bg-neutral-100 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-neutral-100 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

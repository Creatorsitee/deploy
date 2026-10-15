import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-neutral-900">
      <div className="w-10 h-10 rounded-xl bg-neutral-950 flex items-center justify-center text-white font-bold text-base mb-4">
        C
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-neutral-950">404</h1>
      <p className="mt-2 text-sm text-neutral-500 max-w-sm text-center">
        The page or project you requested could not be found or has been moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/"
          className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition"
        >
          Home
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-neutral-950 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

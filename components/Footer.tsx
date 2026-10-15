import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-neutral-950 flex items-center justify-center text-white font-bold text-xs">
                C
              </div>
              <span className="font-bold text-neutral-950 text-sm tracking-tight">CMNTY Deploy</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Free Deploy. Simple deployment with automated custom subdomains and SSL certificates.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li>
                <Link href="/dashboard" className="hover:text-neutral-900 transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/new" className="hover:text-neutral-900 transition">
                  New Project
                </Link>
              </li>
              <li>
                <Link href="/#architecture" className="hover:text-neutral-900 transition">
                  Platform Architecture
                </Link>
              </li>
              <li>
                <Link href="/dashboard/domains" className="hover:text-neutral-900 transition">
                  Subdomain Routing
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li>
                <Link href="/docs" className="hover:text-neutral-900 transition">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/docs#ssl" className="hover:text-neutral-900 transition">
                  Auto SSL Certificates
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 3 */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">Platform</h4>
            <p className="text-xs text-neutral-500 leading-relaxed mb-3">
              CMNTY Deploy provides seamless edge deployment with automated domain configuration.
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <p>© 2026 CMNTY Deploy. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="hover:text-neutral-600 transition">
              Terms of Service
            </Link>
            <Link href="/docs" className="hover:text-neutral-600 transition">
              Security
            </Link>
            <Link href="/login" className="hover:text-neutral-600 transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

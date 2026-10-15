'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useSyncExternalStore, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Server,
  Globe,
  Gauge,
  Shield,
  Plus,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Home,
} from 'lucide-react';
import {
  authFetch,
  getStoredToken,
  setAuthSession,
  clearAuthSession,
  subscribeAuth,
  getStoredUserSnapshot,
  getServerUserSnapshot,
  ClientUser,
} from '@/lib/auth/client';
import { safeJson } from '@/lib/fetch-utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function DashboardLayout({ children, breadcrumbs }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Hydration-safe external store subscription to localStorage auth session
  const storedUserRaw = useSyncExternalStore(
    subscribeAuth,
    getStoredUserSnapshot,
    getServerUserSnapshot
  );

  const cachedUser = useMemo(() => {
    if (!storedUserRaw) return null;
    try {
      return JSON.parse(storedUserRaw) as ClientUser;
    } catch {
      return null;
    }
  }, [storedUserRaw]);

  const [validatedUser, setValidatedUser] = useState<ClientUser | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const user = validatedUser || cachedUser;
  const loading = !user && isValidating;

  useEffect(() => {
    let isMounted = true;

    // Validate session with backend using authFetch
    authFetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) {
          const currentCached = getStoredToken();
          if (!currentCached) {
            clearAuthSession();
            router.replace('/login');
          }
          return null;
        }
        return safeJson(r);
      })
      .then((d) => {
        if (!isMounted || !d) return;
        if (!d.user) {
          clearAuthSession();
          router.replace('/login');
        } else {
          setValidatedUser(d.user);
          const currentToken = getStoredToken();
          if (currentToken) {
            setAuthSession(currentToken, d.user);
          }
        }
      })
      .catch(() => {
        const currentCached = getStoredToken();
        if (isMounted && !currentCached) {
          clearAuthSession();
          router.replace('/login');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsValidating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignored
    }
    clearAuthSession();
    router.replace('/login');
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/dashboard/projects', icon: Server },
    { label: 'Usage', href: '/dashboard/usage', icon: Gauge },
    { label: 'Home', href: '/', icon: Home, external: false },
  ];

  if (user?.role === 'admin') {
    navItems.push({ label: 'Admin Panel', href: '/admin', icon: Shield });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row text-neutral-900">
        {/* Sidebar Skeleton */}
        <aside className="hidden md:flex flex-col w-64 border-r border-neutral-200 bg-white shrink-0">
          <div className="p-6 border-b border-neutral-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-200 animate-pulse shrink-0"></div>
            <div>
              <div className="h-4 bg-neutral-200 rounded w-20 animate-pulse"></div>
              <div className="h-3 bg-neutral-100 rounded w-16 animate-pulse mt-1"></div>
            </div>
          </div>
          <nav className="p-4 space-y-2 flex-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 bg-neutral-100 rounded-lg animate-pulse"></div>
            ))}
          </nav>
          <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
            <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse"></div>
          </div>
        </aside>

        {/* Main Content Skeleton (Matches Overview Page Loading Style) */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 sm:h-16 bg-white border-b border-neutral-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
            <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse"></div>
            <div className="h-8 bg-neutral-200 rounded-lg w-28 animate-pulse"></div>
          </header>
          <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            <div className="border-b border-neutral-200/80 pb-5 space-y-2">
              <div className="h-7 bg-neutral-200 rounded w-48 animate-pulse"></div>
              <div className="h-3 bg-neutral-100 rounded w-72 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5 animate-pulse space-y-3">
                <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
                <div className="h-8 bg-neutral-100 rounded w-1/3"></div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-5 animate-pulse space-y-3">
                <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
                <div className="h-8 bg-neutral-100 rounded w-1/3"></div>
              </div>
            </div>
            <div className="space-y-4 pt-2">
              <div className="h-5 bg-neutral-200 rounded w-32 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-36 bg-white border border-neutral-200 rounded-xl p-5 animate-pulse space-y-3"
                  >
                    <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
                    <div className="h-3 bg-neutral-100 rounded w-2/3"></div>
                    <div className="h-6 bg-neutral-100 rounded mt-4"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row text-neutral-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-neutral-200 bg-white shrink-0">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white font-bold text-sm shrink-0">
              C
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-neutral-950 tracking-tight truncate">CMNTY</div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold truncate">Deploy Platform</div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/' 
              ? pathname === '/' 
              : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/docs');
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition ${
                  isActive
                    ? 'bg-neutral-950 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.external && <ExternalLink className="w-3 h-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-neutral-900 truncate">{user?.name}</div>
              <div className="text-[11px] text-neutral-400 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-white rounded transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 sm:h-16 bg-white border-b border-neutral-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Breadcrumbs or Title */}
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 -ml-1 text-neutral-600 hover:text-neutral-900 rounded shrink-0"
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-neutral-500 min-w-0 truncate">
              <Link href="/dashboard" className="hover:text-neutral-900 transition shrink-0">
                Dashboard
              </Link>
              {breadcrumbs?.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                  <span className="text-neutral-300">/</span>
                  {b.href ? (
                    <Link href={b.href} className="hover:text-neutral-900 transition truncate">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-neutral-900 font-semibold truncate">{b.label}</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition active:scale-95 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Project</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </header>

        {/* Mobile Drawer (Native Fixed Layout, No Portal / No Document Mutation) */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                onClick={() => setMobileOpen(false)}
              />

              {/* Bottom Sheet Card */}
              <motion.div
                initial={{ y: '100%', opacity: 0.8 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.7 }}
                onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientY)}
                onTouchMove={(e) => {
                  if (touchStart !== null && e.targetTouches[0].clientY - touchStart > 60) {
                    setMobileOpen(false);
                    setTouchStart(null);
                  }
                }}
                className="relative z-10 w-full bg-white rounded-t-3xl border-t border-neutral-200/80 p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto pb-10"
              >
                {/* Drag Handle Bar */}
                <div className="flex flex-col items-center justify-center pt-1 pb-1">
                  <div
                    className="w-14 h-1.5 bg-neutral-300 hover:bg-neutral-400 active:bg-neutral-500 rounded-full cursor-grab transition-colors"
                    onClick={() => setMobileOpen(false)}
                  />
                  <div className="flex items-center justify-between w-full mt-3 border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-neutral-950 flex items-center justify-center text-white font-bold text-xs">
                        C
                      </div>
                      <span className="text-xs font-bold text-neutral-950">CMNTY Workspace</span>
                    </div>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="p-1.5 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 active:scale-95"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Nav Cards */}
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold transition active:scale-98 ${
                          isActive
                            ? 'bg-neutral-950 text-white shadow-xs'
                            : 'bg-neutral-50 text-neutral-800 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.external && <ExternalLink className="w-3 h-3 opacity-60" />}
                      </Link>
                    );
                  })}
                </div>

                {/* User Profile Footer */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between bg-neutral-50 p-3 rounded-xl">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-neutral-900 truncate">{user?.name || 'User'}</div>
                    <div className="text-[11px] text-neutral-400 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1.5 shrink-0 active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Content body */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

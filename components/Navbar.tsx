'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Menu, X } from 'lucide-react';
import {
  subscribeAuth,
  getStoredUserSnapshot,
  getServerUserSnapshot,
  ClientUser,
} from '@/lib/auth/client';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const storedUserRaw = useSyncExternalStore(
    subscribeAuth,
    getStoredUserSnapshot,
    getServerUserSnapshot
  );

  const user = useMemo(() => {
    if (!storedUserRaw) return null;
    try {
      return JSON.parse(storedUserRaw) as ClientUser;
    } catch {
      return null;
    }
  }, [storedUserRaw]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white font-bold text-sm transition group-hover:scale-95">
              C
            </div>
            <span className="text-base font-bold tracking-tight text-neutral-950">
              CMNTY Deploy
            </span>
          </Link>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <Link href="/#features" className="hover:text-neutral-950 transition-colors">
              Features
            </Link>
            <Link href="/#architecture" className="hover:text-neutral-950 transition-colors">
              Architecture
            </Link>
            <Link href="/docs" className="hover:text-neutral-950 transition-colors">
              Documentation
            </Link>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition active:scale-95 whitespace-nowrap"
              >
                Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 transition whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition active:scale-95 whitespace-nowrap"
                >
                  Deploy Free
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-600 hover:text-neutral-950 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Native Fixed Layout, No Portal / No Document Mutation) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Bottom Card Drawer */}
            <motion.div
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.7 }}
              onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientY)}
              onTouchMove={(e) => {
                if (touchStart !== null && e.targetTouches[0].clientY - touchStart > 60) {
                  setMobileMenuOpen(false);
                  setTouchStart(null);
                }
              }}
              className="relative z-10 w-full bg-white rounded-t-3xl border-t border-neutral-200/80 p-6 shadow-2xl space-y-5 max-h-[80vh] overflow-y-auto pb-10"
            >
              {/* Drag Handle Bar */}
              <div className="flex flex-col items-center justify-center pt-1 pb-2">
                <div
                  className="w-14 h-1.5 bg-neutral-300 hover:bg-neutral-400 active:bg-neutral-500 rounded-full cursor-grab transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="flex items-center justify-between w-full mt-3 border-b border-neutral-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Navigation Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 active:scale-95"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Cards */}
              <div className="space-y-2">
                <Link
                  href="/#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-sm font-semibold text-neutral-900 transition active:scale-98"
                >
                  <span>Features</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </Link>
                <Link
                  href="/#architecture"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-sm font-semibold text-neutral-900 transition active:scale-98"
                >
                  <span>Architecture</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </Link>
                <Link
                  href="/docs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-sm font-semibold text-neutral-900 transition active:scale-98"
                >
                  <span>Documentation</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </Link>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2.5">
                {user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3.5 text-xs font-bold text-white bg-neutral-950 rounded-xl shadow-xs active:scale-98"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-3.5 text-xs font-bold text-neutral-800 bg-neutral-100 rounded-xl active:scale-98"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-3.5 text-xs font-bold text-white bg-neutral-950 rounded-xl shadow-xs active:scale-98"
                    >
                      Deploy Free
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

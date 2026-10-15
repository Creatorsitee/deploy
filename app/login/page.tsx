'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, Shield, KeyRound, Sparkles } from 'lucide-react';
import { setAuthSession, getStoredToken, getStoredUser } from '@/lib/auth/client';
import { safeJson } from '@/lib/fetch-utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, seamlessly forward to dashboard
  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to sign in');
      }

      // Store auth session immediately in localStorage for iframe / cross-site persistence
      if (data && data.token && data.user) {
        setAuthSession(data.token, data.user);
      }

      // Redirect to dashboard
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-12 px-6 sm:px-8 text-neutral-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <span className="text-base font-bold tracking-tight text-neutral-950">
            CMNTY Deploy
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
          Sign in to your dashboard
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Free Deploy and simple deployments for your websites.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 border border-neutral-200/80 rounded-xl shadow-2xs sm:px-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-neutral-500 hover:text-neutral-950 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-950 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-neutral-500">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="font-semibold text-neutral-950 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { safeJson } from '@/lib/fetch-utils';
import {
  ArrowRight,
  Globe,
  Zap,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const [baseDomain, setBaseDomain] = useState('cmnty.biz.id');

  useEffect(() => {
    // Note: /api/config is restricted. Using fallback for public view.
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-neutral-900 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-neutral-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 leading-[1.1] text-balance">
              Platform Hosting & Deployment Web Aplikasi Modern
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Infrastruktur cloud berkinerja tinggi untuk deployment situs statis, aplikasi web, dan proyek digital dengan manajemen subdomain serta sertifikat SSL otomatis.
            </p>

            {/* Direct CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition active:scale-95 shadow-xs"
              >
                <span>Mulai Deploy</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition active:scale-95"
              >
                Buat Akun Gratis
              </Link>
            </div>
          </div>
        </section>

        {/* 3 CORE PILLARS */}
        <section id="features" className="py-16 sm:py-24 bg-[#fafafa] border-b border-neutral-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mx-auto text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                Engineered for Simplicity and Speed
              </h2>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Everything you need to ship personal projects, prototypes, and production websites.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-white border border-neutral-200/80 rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-950">Instant Deployment</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Upload a ZIP archive or a single HTML file. Your site is deployed and served on global edge nodes in seconds.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-neutral-100 text-[11px] font-mono text-neutral-400">
                  ZIP upload · Single HTML support
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-neutral-200/80 rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-950">Free Custom Subdomains</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Every project automatically receives a free *.{baseDomain} subdomain, with seamless custom domain binding.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-neutral-100 text-[11px] font-mono text-neutral-400">
                  Free subdomain · Custom domains ready
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-neutral-200/80 rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-950">Automated Free SSL</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Zero-configuration TLS certificates provisioned automatically for all your subdomains and custom apex domains.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-neutral-100 text-[11px] font-mono text-neutral-400">
                  Automated HTTPS · Secure edge routing
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 STEPS) */}
        <section id="architecture" className="py-16 sm:py-24 bg-white border-b border-neutral-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mx-auto text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                Three Steps to Launch
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                From your source code to global edge deployment in under a minute.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <span className="font-mono text-xs font-semibold text-neutral-400">01</span>
                <h3 className="text-base font-semibold text-neutral-950">1. Create & Upload</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Upload your pre-built static archive (HTML, CSS, JS) or simply upload a single HTML file.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-semibold text-neutral-400">02</span>
                <h3 className="text-base font-semibold text-neutral-950">2. Edge Processing</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Our cloud edge orchestrator assigns your subdomain, sets up security rules, and deploys assets instantly.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-semibold text-neutral-400">03</span>
                <h3 className="text-base font-semibold text-neutral-950">3. Live on the Web</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Your project is immediately live and accessible worldwide with lightning-fast response times.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MINIMAL CTA */}
        <section className="py-16 sm:py-20 bg-neutral-950 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Start Deploy your website today.
            </h2>
            <p className="text-neutral-400 text-sm max-w-lg mx-auto leading-relaxed">
              No credit card required. Free tier for personal portfolios, web tools, and community applications.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="px-6 py-2.5 bg-white text-neutral-950 text-xs sm:text-sm font-semibold rounded-lg hover:bg-neutral-100 transition active:scale-95 shadow-xs"
              >
                Create Free Account
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-neutral-800 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-neutral-700 transition active:scale-95"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { safeJson } from '@/lib/fetch-utils';
import {
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export default function DocsPage() {
  const [baseDomain, setBaseDomain] = useState('cmnty.biz.id');

  useEffect(() => {
    // Note: /api/config is restricted. Using fallback for public view.
  }, []);
  const sections = [
    { id: 'overview', title: 'Platform Overview' },
    { id: 'quickstart', title: 'Quickstart Guide' },
    { id: 'edge-engine', title: 'CMNTY Edge Infrastructure' },
    { id: 'subdomains', title: 'Custom Subdomains' },
    { id: 'ssl', title: 'Automated SSL Certificates' },
    { id: 'zip', title: 'ZIP Upload & Security' },
    { id: 'env', title: 'Environment Variables' },
    { id: 'limits', title: 'Limits & Quotas' },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-neutral-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        {/* Mobile Horizontal Quick Navigation */}
        <div className="md:hidden pb-4 mb-6 border-b border-neutral-200/80 overflow-x-auto no-scrollbar flex items-center gap-2 text-xs">
          <span className="font-semibold text-neutral-400 shrink-0">Jump to:</span>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-2.5 py-1 bg-neutral-100 rounded text-neutral-700 hover:text-neutral-950 shrink-0 whitespace-nowrap"
            >
              {s.title}
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Docs Sidebar Navigation (Desktop) */}
          <aside className="hidden md:block md:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <BookOpen className="w-4 h-4 text-neutral-900" />
                <span>Documentation</span>
              </div>
              <nav className="space-y-1 text-xs">
                {sections.map((s, idx) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block py-1.5 text-neutral-600 hover:text-neutral-950 transition"
                  >
                    {idx + 1}. {s.title}
                  </a>
                ))}
              </nav>

              <div className="pt-4 border-t border-neutral-100">
                <Link
                  href="/dashboard/new"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-950 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition shadow-xs"
                >
                  <span>Start Deploying</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Docs Content */}
          <article className="md:col-span-9 max-w-3xl space-y-10 text-sm leading-relaxed">
            {/* 1. Overview */}
            <section id="overview" className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                CMNTY Deploy Documentation
              </h1>
              <p className="text-neutral-600 leading-relaxed">
                CMNTY Deploy provides free, zero-config web Deploy powered by global edge cloud APIs. Every project gets an automatic custom subdomain (<code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">project.{baseDomain}</code>) with automatic SSL certificates.
              </p>
            </section>

            {/* 2. Quickstart */}
            <section id="quickstart" className="space-y-3 pt-6 border-t border-neutral-100">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                Quickstart Guide
              </h2>
              <ol className="list-decimal pl-5 space-y-2 text-neutral-600">
                <li>
                  <strong className="text-neutral-900">Sign Up:</strong> Create your free account at <Link href="/register" className="text-neutral-900 underline font-medium">/register</Link>.
                </li>
                <li>
                  <strong className="text-neutral-900">Create Project:</strong> Click &ldquo;+ New Project&rdquo; and enter your project name and slug (e.g. <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">my-project</code>).
                </li>
                <li>
                  <strong className="text-neutral-900">Choose Source:</strong> Upload a ZIP file or a single HTML file of your website.
                </li>
                <li>
                  <strong className="text-neutral-900">Live URL:</strong> Your website is deployed to edge Anycast and live at <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">https://my-project.{baseDomain}</code>.
                </li>
              </ol>
            </section>

            {/* 3. Edge Engine */}
            <section id="edge-engine" className="space-y-3 pt-6 border-t border-neutral-100">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                Edge Infrastructure
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                The platform interfaces directly with enterprise edge cloud networks. All API tokens and deployment secrets remain strictly encrypted server-side; client browsers never see or handle production infrastructure keys.
              </p>
            </section>

            {/* 4. Subdomains */}
            <section id="subdomains" className="space-y-3 pt-6 border-t border-neutral-100">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                Custom Subdomains
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                Every project is assigned its own <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">*.{baseDomain}</code> subdomain. Reserved words such as <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">admin, api, dashboard, docs</code> are protected from registration.
              </p>
            </section>

            {/* 5. SSL Certificates */}
            <section id="ssl" className="space-y-3 pt-6 border-t border-neutral-100">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                Automated SSL Certificates
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                SSL certificates are provisioned and renewed automatically via Let&apos;s Encrypt ACME challenges, supporting TLS 1.3 and HSTS out of the box.
              </p>
            </section>

             {/* 7. Limits */}
            <section id="limits" className="space-y-3 pt-6 border-t border-neutral-100">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                Fair Use Limits
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="text-neutral-400 font-semibold uppercase text-[10px]">Active Projects</div>
                  <div className="text-base font-bold text-neutral-900 mt-1">3 projects per account</div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="text-neutral-400 font-semibold uppercase text-[10px]">Daily Deployments</div>
                  <div className="text-base font-bold text-neutral-900 mt-1">10 builds per day</div>
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

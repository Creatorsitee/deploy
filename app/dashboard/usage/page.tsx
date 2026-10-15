'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { authFetch } from '@/lib/auth/client';
import { safeJson } from '@/lib/fetch-utils';
import { Layers, Rocket, ShieldCheck } from 'lucide-react';

export default function UsagePage() {
  const [projectsCount, setProjectsCount] = useState(0);
  const [deploymentsCount, setDeploymentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/projects')
      .then((r) => safeJson(r))
      .then((d) => {
        if (d && d.projects) {
          setProjectsCount(d.projects.length);
          const totalDeps = d.projects.reduce(
            (acc: number, p: any) => acc + (p.deploymentsCount || 1),
            0
          );
          setDeploymentsCount(totalDeps);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Usage' }]}>
      <div className="space-y-6 max-w-4xl">
        <div className="border-b border-neutral-200/80 pb-5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Resource Usage & Quotas
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Tracking your hosted applications and build capacity.
          </p>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-36 bg-white border border-neutral-200 rounded-xl p-5 animate-pulse space-y-3"
              >
                <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
                <div className="h-6 bg-neutral-100 rounded w-1/2"></div>
                <div className="h-2 bg-neutral-100 rounded-full mt-4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Projects Quota */}
            <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                  Active Projects
                </span>
                <Layers className="w-4 h-4 text-neutral-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-neutral-950 tabular-nums">
                  {projectsCount} <span className="text-neutral-400 text-base font-normal">/ 3</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-neutral-950 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (projectsCount / 3) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-neutral-400 mt-2 font-mono">
                  {3 - projectsCount} projects remaining on free tier.
                </div>
              </div>
            </div>

            {/* Daily Deployments */}
            <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                  Daily Builds
                </span>
                <Rocket className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-neutral-950 tabular-nums">
                  {deploymentsCount} <span className="text-neutral-400 text-base font-normal">/ 10</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (deploymentsCount / 10) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-neutral-400 mt-2 font-mono">
                  Resets daily at 00:00 UTC.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Minimal Quota Details */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Plan Inclusions</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <span className="text-neutral-400 text-[10px] block uppercase">Bandwidth</span>
              <span className="font-semibold text-neutral-900">Unlimited Fair-Use</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <span className="text-neutral-400 text-[10px] block uppercase">SSL Certificates</span>
              <span className="font-semibold text-neutral-900">Automatic Let&apos;s Encrypt</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
              <span className="text-neutral-400 text-[10px] block uppercase">Custom Domains</span>
              <span className="font-semibold text-neutral-900">Included Free</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

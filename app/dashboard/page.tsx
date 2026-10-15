'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DeploymentStatusBadge from '@/components/DeploymentStatusBadge';
import { authFetch } from '@/lib/auth/client';
import { useToast } from '@/lib/contexts/ToastContext';
import { safeJson } from '@/lib/fetch-utils';
import {
  Server,
  Rocket,
  Globe,
  Plus,
  ExternalLink,
  Search,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [baseDomain, setBaseDomain] = useState('cmnty.biz.id');
  const [isEngineConfigured, setIsEngineConfigured] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProjects = () => {
    authFetch('/api/projects')
      .then((r) => safeJson(r))
      .then((d) => {
        if (d && d.projects) setProjects(d.projects);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/config')
      .then((r) => safeJson(r))
      .then((d) => {
        if (isMounted && d) {
          if (d.baseDomain) setBaseDomain(d.baseDomain);
          if (d.isVercelConfigured !== undefined) setIsEngineConfigured(d.isVercelConfigured);
        }
      })
      .catch(() => {});

    authFetch('/api/projects')
      .then((r) => safeJson(r))
      .then((d) => {
        if (isMounted && d && d.projects) setProjects(d.projects);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const totalProjects = projects.length;
  const allDeployments = projects.flatMap((p) => (p.latestDeployment ? [p.latestDeployment] : []));
  const readyDeployments = allDeployments.filter((d) => d.status === 'READY').length;

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
              Dashboard Overview
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Manage your web deployments, custom subdomains, and live applications.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
            <button
              onClick={() => {
                setLoading(true);
                fetchProjects();
              }}
              className="p-2 border border-neutral-200 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition"
              title="Refresh projects"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition active:scale-95 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Projects
              </span>
              <Server className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-neutral-950 tabular-nums">
              {loading ? '—' : totalProjects}
            </div>
            <div className="mt-1 text-[11px] text-neutral-400">Active hosted apps</div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Live Builds
              </span>
              <Rocket className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-neutral-950 tabular-nums">
              {loading ? '—' : readyDeployments}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 font-medium">Production ready</div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-950 tracking-tight">
                Projects
              </h2>
              <p className="text-xs text-neutral-500">
                All websites connected to your CMNTY workspace.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter projects..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-950 transition"
              />
            </div>
          </div>

          {loading ? (
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
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-8 sm:p-12 text-center space-y-4 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <Server className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-neutral-950">No projects deployed yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Deploy your first web application with a ZIP upload or Git repository.
                </p>
              </div>
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-950 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Project</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const latest = project.latestDeployment;
                return (
                  <div
                    key={project.id}
                    className="bg-white border border-neutral-200/80 rounded-xl p-5 hover:border-neutral-400 transition flex flex-col justify-between space-y-4 shadow-2xs"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="font-bold text-sm text-neutral-950 hover:underline tracking-tight truncate block"
                          >
                            {project.name}
                          </Link>
                          <div className="text-[11px] font-mono text-neutral-400 mt-0.5 uppercase">
                            {project.framework} · {project.slug}
                          </div>
                        </div>
                        {latest && <DeploymentStatusBadge status={latest.status} />}
                      </div>

                      <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 text-xs font-mono">
                        <span className="text-[10px] text-neutral-400 block uppercase font-sans">
                          Production URL
                        </span>
                        <a
                          href={`https://${project.subdomain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-900 font-semibold hover:underline flex items-center gap-1 mt-0.5 truncate"
                        >
                          <span className="truncate">{project.subdomain}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                        </a>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-neutral-400 truncate pr-2">
                        {latest
                          ? `Updated ${new Date(latest.createdAt).toLocaleDateString()}`
                          : 'Pending'}
                      </span>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="font-semibold text-neutral-900 hover:text-neutral-600 transition flex items-center gap-1 shrink-0"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

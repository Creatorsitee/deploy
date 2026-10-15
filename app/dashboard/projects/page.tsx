'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DeploymentStatusBadge from '@/components/DeploymentStatusBadge';
import { Plus, ExternalLink, Search, RefreshCw, Layers, ArrowRight } from 'lucide-react';
import { authFetch } from '@/lib/auth/client';
import { safeJson } from '@/lib/fetch-utils';

export default function ProjectsDirectoryPage() {
  const [projects, setProjects] = useState<any[]>([]);
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

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Projects' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
              Projects
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              All applications deployed in your CMNTY workspace.
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-950 transition"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-8 sm:p-12 text-center space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-950">No projects found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No deployed applications matching your criteria.
            </p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200/80 rounded-xl shadow-2xs overflow-hidden">
            {/* Table with horizontal overflow wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[600px]">
                <thead className="bg-neutral-50 border-b border-neutral-200/80 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Project</th>
                    <th className="px-5 py-3">Subdomain</th>
                    <th className="px-5 py-3">Framework</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((p) => {
                    const latest = p.latestDeployment;
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50/60 transition">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/dashboard/projects/${p.id}`}
                            className="font-bold text-neutral-950 hover:underline"
                          >
                            {p.name}
                          </Link>
                          <div className="text-[11px] font-mono text-neutral-400">{p.slug}</div>
                        </td>
                        <td className="px-5 py-3.5 font-mono">
                          <a
                            href={`https://${p.subdomain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-700 hover:text-neutral-950 hover:underline flex items-center gap-1"
                          >
                            <span>{p.subdomain}</span>
                            <ExternalLink className="w-3 h-3 opacity-40" />
                          </a>
                        </td>
                        <td className="px-5 py-3.5 uppercase font-mono text-[11px] text-neutral-500">
                          {p.framework}
                        </td>
                        <td className="px-5 py-3.5">
                          {latest ? (
                            <DeploymentStatusBadge status={latest.status} />
                          ) : (
                            <span className="text-neutral-400 text-xs">Pending</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-neutral-400 text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/dashboard/projects/${p.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-neutral-900 hover:text-neutral-600 transition"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

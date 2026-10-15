'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import DashboardLayout from '@/components/DashboardLayout';
import DeploymentStatusBadge from '@/components/DeploymentStatusBadge';
import SslStatusBadge from '@/components/SslStatusBadge';
import { authFetch } from '@/lib/auth/client';
import { useToast } from '@/lib/contexts/ToastContext';
import { safeJson } from '@/lib/fetch-utils';
import { parseEnvString, detectRecommendedEnvForFramework } from '@/lib/env-detector';
import {
  ExternalLink,
  RefreshCw,
  Rocket,
  Globe,
  Layers,
  Key,
  Settings as SettingsIcon,
  Trash2,
  Copy,
  Check,
  Plus,
  Terminal,
  AlertCircle,
  Clock,
  Lock,
  Sparkles,
  FileText,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { toast, confirmModal } = useToast();

  const [project, setProject] = useState<any>(null);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [envVars, setEnvVars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deployments' | 'domains' | 'env' | 'settings'>('overview');
  const [detectingEnv, setDetectingEnv] = useState(false);

  // Logs modal
  const [selectedDeployment, setSelectedDeployment] = useState<any>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const handleInspectDeployment = async (dep: any) => {
    setSelectedDeployment(dep);
    setLoadingLogs(true);
    try {
      const res = await authFetch(`/api/deployments/${dep.id}`);
      if (res.ok) {
        const data = await safeJson(res);
        if (data && data.deployment) {
          setSelectedDeployment(data.deployment);
        }
      }
    } catch (err) {
      console.error('Failed to fetch build logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // New domain form
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState('');

  // New env var form
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [newEnvTargets, setNewEnvTargets] = useState<('production' | 'preview' | 'development')[]>([
    'production',
    'preview',
    'development',
  ]);
  const [showBulkEnvModal, setShowBulkEnvModal] = useState(false);
  const [bulkEnvText, setBulkEnvText] = useState('');
  const [addingEnv, setAddingEnv] = useState(false);

  // Settings form
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  // Action states
  const [redeploying, setRedeploying] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const refreshProject = async () => {
    try {
      const res = await authFetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        if (res.status === 404) router.push('/dashboard');
        return;
      }
      const data = await safeJson(res);
      if (data) {
        setProject(data.project);
        setDeployments(data.deployments || []);
        setDomains(data.domains || []);
        setEnvVars(data.environmentVariables || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!projectId) return;

    authFetch(`/api/projects/${projectId}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) router.push('/dashboard');
          return null;
        }
        return safeJson(res);
      })
      .then((data) => {
        if (!isMounted || !data) return;
        setProject(data.project);
        setDeployments(data.deployments || []);
        setDomains(data.domains || []);
        setEnvVars(data.environmentVariables || []);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, router]);

  const handleRedeploy = async () => {
    setRedeploying(true);
    try {
      const res = await authFetch(`/api/projects/${projectId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redeploy: true }),
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success('Deployment triggered successfully!');
        refreshProject();
        setActiveTab('deployments');
      } else {
        toast.error(data?.error || 'Failed to trigger redeploy');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error triggering redeploy');
    } finally {
      setRedeploying(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setDomainError('');
    setAddingDomain(true);
    try {
      const res = await authFetch(`/api/projects/${projectId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to add domain');
      setNewDomain('');
      toast.success(`Domain "${newDomain}" added successfully!`);
      refreshProject();
    } catch (err: any) {
      setDomainError(err.message);
      toast.error(err.message || 'Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainName: string) => {
    try {
      const res = await authFetch(`/api/projects/${projectId}/domains/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainName }),
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success(data?.message || `Domain "${domainName}" verification completed`);
      } else {
        toast.error(data?.error || 'Domain verification check failed');
      }
      refreshProject();
    } catch (err: any) {
      toast.error(err.message || 'Domain verification check failed');
    }
  };

  const handleRemoveDomain = (domainName: string) => {
    confirmModal({
      title: 'Remove Custom Domain',
      message: `Are you sure you want to remove "${domainName}" from this project?`,
      confirmText: 'Remove Domain',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/projects/${projectId}/domains?domain=${encodeURIComponent(domainName)}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            toast.success(`Domain "${domainName}" removed`);
            refreshProject();
          } else {
            const data = await safeJson(res);
            toast.error(data?.error || 'Failed to remove domain');
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to remove domain');
        }
      },
    });
  };

  const handleAddEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEnv(true);
    try {
      const res = await authFetch(`/api/projects/${projectId}/env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newEnvKey,
          value: newEnvValue,
          target: newEnvTargets.length > 0 ? newEnvTargets : ['production', 'preview', 'development'],
        }),
      });
      if (res.ok) {
        toast.success(`Environment variable ${newEnvKey} saved!`);
        setNewEnvKey('');
        setNewEnvValue('');
        refreshProject();
      } else {
        const d = await safeJson(res);
        toast.error(d?.error || 'Failed to add environment variable');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add environment variable');
    } finally {
      setAddingEnv(false);
    }
  };

  const handleAutoDetectEnv = async () => {
    setDetectingEnv(true);
    try {
      const recommended = detectRecommendedEnvForFramework(
        project?.framework || 'static',
        project?.name,
        project?.subdomain
      );

      const existingKeys = new Set(envVars.map((e) => e.key));
      const missing = recommended.filter((r) => !existingKeys.has(r.key));

      if (missing.length === 0) {
        toast.info('All recommended environment variables for this framework are already configured!');
        return;
      }

      let added = 0;
      for (const item of missing) {
        const res = await authFetch(`/api/projects/${projectId}/env`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: item.key,
            value: item.value,
            target: item.target || ['production', 'preview', 'development'],
          }),
        });
        if (res.ok) added++;
      }

      toast.success(`Auto-detected & added ${added} recommended variable(s) for ${(project?.framework || 'static').toUpperCase()}`);
      refreshProject();
    } catch (err: any) {
      toast.error(err.message || 'Failed to auto-detect environment variables');
    } finally {
      setDetectingEnv(false);
    }
  };

  const handleBulkEnvImport = async () => {
    if (!bulkEnvText.trim()) return;
    const parsed = parseEnvString(bulkEnvText);
    if (parsed.length === 0) {
      toast.warning('No valid KEY=VALUE pairs found in pasted text');
      return;
    }

    let addedCount = 0;
    for (const item of parsed) {
      if (item.key) {
        const res = await authFetch(`/api/projects/${projectId}/env`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: item.key,
            value: item.value,
            target: item.target || ['production', 'preview', 'development'],
          }),
        });
        if (res.ok) addedCount++;
      }
    }

    toast.success(`Imported ${addedCount} environment variable(s)!`);
    setBulkEnvText('');
    setShowBulkEnvModal(false);
    refreshProject();
  };

  const handleDeleteEnv = (key: string) => {
    confirmModal({
      title: 'Delete Environment Variable',
      message: `Are you sure you want to delete "${key}"? This will take effect on next deployment.`,
      confirmText: 'Delete Variable',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/projects/${projectId}/env?key=${encodeURIComponent(key)}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            toast.success(`Variable "${key}" removed`);
            refreshProject();
          } else {
            const data = await safeJson(res);
            toast.error(data?.error || 'Failed to remove variable');
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to remove variable');
        }
      },
    });
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmInput !== project.name && deleteConfirmInput !== project.slug) {
      toast.error(`Type "${project.name}" or "${project.slug}" to confirm deletion`);
      return;
    }
    confirmModal({
      title: 'Permanently Delete Project',
      message: `Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`,
      confirmText: 'Permanently Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirmName: deleteConfirmInput }),
          });
          if (res.ok) {
            toast.success(`Project "${project.name}" deleted`);
            router.push('/dashboard');
          } else {
            const d = await safeJson(res);
            toast.error(d?.error || 'Failed to delete project');
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to delete project');
        }
      },
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success('URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: 'Projects', href: '/dashboard' }, { label: 'Loading...' }]}>
        <div className="space-y-6">
          {/* Project Header Skeleton */}
          <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs animate-pulse space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-6 bg-neutral-200 rounded w-48"></div>
                <div className="h-4 bg-neutral-100 rounded w-64"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-9 bg-neutral-200 rounded-lg w-24"></div>
                <div className="h-9 bg-neutral-950 rounded-lg w-28"></div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white border border-neutral-200 rounded-xl p-5 animate-pulse space-y-3"
              >
                <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
                <div className="h-6 bg-neutral-100 rounded w-2/3"></div>
              </div>
            ))}
          </div>

          {/* Main Card Skeleton */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 animate-pulse space-y-4">
            <div className="h-5 bg-neutral-200 rounded w-36"></div>
            <div className="h-4 bg-neutral-100 rounded w-full"></div>
            <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
            <div className="h-10 bg-neutral-100 rounded-lg mt-4"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) return null;

  const latestDeployment = deployments[0];
  const prodUrl = `https://${project.subdomain}`;

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Projects', href: '/dashboard' }, { label: project.name }]}>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 break-words line-clamp-2">
                {project.name}
              </h1>
              {latestDeployment && <DeploymentStatusBadge status={latestDeployment.status} />}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono flex-wrap">
              <span className="truncate max-w-[150px]">{project.slug}</span>
              <span>·</span>
              <span className="uppercase">{project.framework}</span>
              <span>·</span>
              <a
                href={prodUrl}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-900 font-semibold hover:underline flex items-center gap-1 min-w-0"
              >
                <span className="truncate">{project.subdomain}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={handleRedeploy}
              disabled={redeploying}
              className="px-3.5 py-1.5 sm:py-2 border border-neutral-200 text-neutral-900 rounded-lg text-xs font-semibold hover:bg-neutral-50 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${redeploying ? 'animate-spin' : ''}`} />
              <span>{redeploying ? 'Redeploying...' : 'Redeploy'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation - Responsive Horizontal Scroll on Mobile */}
        <div className="flex items-center gap-1 border-b border-neutral-200/80 pb-px text-xs font-semibold overflow-x-auto no-scrollbar flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'deployments', label: `Deployments (${deployments.length})`, icon: Clock },
            { id: 'env', label: `Environment (${envVars.length})`, icon: Key },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b-2 transition shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'border-neutral-950 text-neutral-950'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 cols: Production Deployment */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Production Deployment
                  </div>
                  {latestDeployment && <DeploymentStatusBadge status={latestDeployment.status} />}
                </div>

                {latestDeployment ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                          Live URL
                        </div>
                        <a
                          href={latestDeployment.productionUrl || prodUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-sm font-bold text-neutral-900 hover:underline flex items-center gap-1.5"
                        >
                          <span>{latestDeployment.productionUrl || prodUrl}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <SslStatusBadge status="ACTIVE" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-neutral-50 rounded-lg">
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">Source</span>
                        <div className="font-semibold text-neutral-900 mt-0.5 truncate">
                          {latestDeployment.sourceName || 'Direct'}
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-lg">
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">Build Time</span>
                        <div className="font-mono font-semibold text-neutral-900 mt-0.5">
                          {latestDeployment.durationMs
                            ? `${(latestDeployment.durationMs / 1000).toFixed(1)}s`
                            : '—'}
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-lg">
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">Created</span>
                        <div className="font-semibold text-neutral-900 mt-0.5">
                          {new Date(latestDeployment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-lg">
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">Engine</span>
                        <div className="font-semibold text-neutral-900 mt-0.5">Cloud Edge API</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInspectDeployment(latestDeployment)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Inspect Build Logs</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-neutral-500">
                    No deployments created for this project yet.
                  </div>
                )}
              </div>
            </div>

            {/* Right col: Build settings & info */}
            <div className="space-y-6">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Build Configuration
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-neutral-400 text-[10px] uppercase font-semibold">Framework</span>
                    <div className="font-mono uppercase font-bold text-neutral-950 mt-0.5">
                      {project.framework}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] uppercase font-semibold">Build Command</span>
                    <div className="font-mono text-neutral-800 mt-0.5 bg-neutral-50 p-1.5 rounded border border-neutral-100">
                      {project.buildCommand || 'None (Static)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] uppercase font-semibold">Output Directory</span>
                    <div className="font-mono text-neutral-800 mt-0.5 bg-neutral-50 p-1.5 rounded border border-neutral-100">
                      {project.outputDirectory || './'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEPLOYMENTS */}
        {activeTab === 'deployments' && (
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-950">Deployment History</h3>
                <p className="text-xs text-neutral-500">All builds dispatched to cloud infrastructure.</p>
              </div>
              <button
                onClick={handleRedeploy}
                disabled={redeploying}
                className="px-3.5 py-1.5 bg-neutral-950 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition"
              >
                Trigger Deploy
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Commit / Source</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {deployments.map((d) => (
                    <tr key={d.id} className="hover:bg-neutral-50/50 transition">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <DeploymentStatusBadge status={d.status} />
                      </td>
                      <td className="px-6 py-3.5 max-w-xs truncate">
                        <div className="font-semibold text-neutral-900 truncate">
                          {d.commitMessage || 'Manual deployment'}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono truncate">
                          {d.sourceName || d.id}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap font-mono text-neutral-600">
                        {d.durationMs ? `${(d.durationMs / 1000).toFixed(1)}s` : '—'}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-neutral-500">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => handleInspectDeployment(d)}
                          className="font-medium text-neutral-900 hover:underline"
                        >
                          View Logs
                        </button>
                        {d.productionUrl && (
                          <a
                            href={d.productionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-500 hover:text-neutral-900"
                            title="Open production URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5 inline" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ENVIRONMENT VARIABLES */}
        {activeTab === 'env' && (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-neutral-950">Add Environment Variable</h3>
                  <p className="text-xs text-neutral-500">
                    Variables are encrypted and synced to build and runtime pipelines.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowBulkEnvModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Paste .env / Bulk Import</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddEnv} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                    placeholder="API_KEY"
                    className="px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-neutral-950"
                  />
                  <input
                    type="password"
                    required
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    placeholder="Secret value"
                    className="px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-neutral-950"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-neutral-500">Target:</span>
                    {(['production', 'preview', 'development'] as const).map((t) => (
                      <label key={t} className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer capitalize">
                        <input
                          type="checkbox"
                          checked={newEnvTargets.includes(t)}
                          onChange={() => {
                            if (newEnvTargets.includes(t)) {
                              if (newEnvTargets.length > 1) setNewEnvTargets(newEnvTargets.filter((x) => x !== t));
                            } else {
                              setNewEnvTargets([...newEnvTargets, t]);
                            }
                          }}
                          className="rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                        />
                        <span>{t}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={addingEnv || !newEnvKey.trim()}
                    className="px-4 py-2 bg-neutral-950 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition"
                  >
                    {addingEnv ? 'Saving...' : 'Add Variable'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-neutral-100">
                <h3 className="font-bold text-sm text-neutral-950">Active Environment Variables</h3>
              </div>

              {envVars.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  No environment variables added to this project yet.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {envVars.map((e) => (
                    <div key={e.id} className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">{e.key}</span>
                          <span className="text-neutral-400">=</span>
                          <span className="text-neutral-400">{e.value}</span>
                        </div>
                        {Array.isArray(e.target) && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {e.target.map((t: string) => (
                              <span key={t} className="text-[10px] uppercase font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEnv(e.key)}
                        className="text-neutral-400 hover:text-rose-600 transition self-end sm:self-auto"
                        title="Delete variable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BULK ENV MODAL */}
        {showBulkEnvModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-sm text-neutral-950">Bulk Import .env Variables</h3>
                <button
                  onClick={() => setShowBulkEnvModal(false)}
                  className="text-neutral-400 hover:text-neutral-900 text-xs font-semibold"
                >
                  ✕
                </button>
              </div>
              <textarea
                rows={8}
                value={bulkEnvText}
                onChange={(e) => setBulkEnvText(e.target.value)}
                placeholder={`KEY=VALUE\nANOTHER_KEY=VALUE`}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:border-neutral-950"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkEnvModal(false)}
                  className="px-4 py-2 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkEnvImport}
                  disabled={!bulkEnvText.trim()}
                  className="px-4 py-2 bg-neutral-950 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 disabled:opacity-40"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Danger Zone: Delete Project */}
            <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-rose-700">Danger Zone: Delete Project</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Permanently deletes this project, releases the custom subdomain, and tears down all deployment records. This action cannot be undone.
              </p>
              <div className="space-y-2 max-w-md">
                <label className="block text-xs text-neutral-500">
                  Type <span className="font-bold font-mono text-neutral-900">{project.name}</span> to confirm:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder={project.name}
                    className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-rose-600"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={deleteConfirmInput !== project.name && deleteConfirmInput !== project.slug}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-40"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Build Logs Modal */}
        <AnimatePresence>
          {selectedDeployment && (
            <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-neutral-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden"
              >
                {/* Clean Minimal Header */}
                <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-neutral-950 flex items-center justify-center shadow-xs shrink-0">
                      <Terminal className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-[11px] font-mono text-neutral-500">
                      {selectedDeployment.id}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedDeployment(null)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-200/60 rounded-lg transition"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Log Viewport */}
                <div className="flex-1 overflow-hidden flex flex-col bg-neutral-950">
                  <div className="flex-1 overflow-y-auto p-5 font-mono text-[11px] leading-relaxed text-neutral-300 scrollbar-thin scrollbar-thumb-neutral-800">
                    {loadingLogs ? (
                      <div className="flex items-center gap-3 py-4 text-neutral-500">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                        <span className="animate-pulse">Loading logs...</span>
                      </div>
                    ) : selectedDeployment.logs && selectedDeployment.logs.length > 0 ? (
                      <div className="space-y-1">
                        {selectedDeployment.logs.map((line: string, i: number) => {
                          const cleanLine = line.replace(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/g, `https://${project?.subdomain || 'site.cmnty.biz.id'}`);
                          return (
                            <div key={i} className="flex gap-4 group">
                              <span className="w-7 shrink-0 text-neutral-700 text-right select-none">{i + 1}</span>
                              <span className="break-all whitespace-pre-wrap">{cleanLine}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-neutral-600 py-4 italic">No logs recorded.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

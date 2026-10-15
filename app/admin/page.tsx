'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { authFetch } from '@/lib/auth/client';
import { useToast } from '@/lib/contexts/ToastContext';
import { safeJson } from '@/lib/fetch-utils';
import {
  Shield,
  Server,
  Users,
  Layers,
  Globe,
  RefreshCw,
  AlertCircle,
  Key,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  Search,
  UserCheck,
  UserX,
  Sliders,
  Activity,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { toast, confirmModal } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'domains' | 'infrastructure' | 'logs'>('users');

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  // Settings configuration form
  const [tokenInput, setTokenInput] = useState('');
  const [teamIdInput, setTeamIdInput] = useState('');
  const [baseDomainInput, setBaseDomainInput] = useState('cmnty.biz.id');
  const [availableDomainsList, setAvailableDomainsList] = useState<string[]>(['cmnty.biz.id']);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');
  const [cleaningDb, setCleaningDb] = useState(false);

  const handleCleanDatabase = () => {
    confirmModal({
      title: 'Reset & Clean Database',
      message: 'This will reset test projects, deployments, and logs, keeping only registered user accounts. Continue?',
      confirmText: 'Reset Database',
      danger: true,
      onConfirm: async () => {
        setCleaningDb(true);
        try {
          const res = await authFetch('/api/admin/database/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keepUsers: true }),
          });
          const d = await safeJson(res);
          if (res.ok) {
            toast.success('Database reset successfully! All test projects and logs cleared.');
            loadAdminData();
          } else {
            toast.error(d?.error || 'Failed to clean database');
          }
        } catch (err: any) {
          toast.error(err.message || 'Error cleaning database');
        } finally {
          setCleaningDb(false);
        }
      },
    });
  };

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/admin/overview');
      if (!res.ok) {
        if (res.status === 403) {
          setError('Access restricted to administrators.');
        } else {
          setError('Failed to fetch admin statistics');
        }
        return;
      }
      const json = await safeJson(res);
      if (json) setData(json);

      // Load settings & domains
      const settingsRes = await authFetch('/api/admin/settings');
      if (settingsRes.ok) {
        const sData = await safeJson(settingsRes);
        if (sData) {
          setTeamIdInput(sData.settings?.vercelTeamId || '');
          setBaseDomainInput(sData.settings?.baseDomain || 'cmnty.biz.id');
          setAvailableDomainsList(sData.settings?.availableDomains || [sData.settings?.baseDomain || 'cmnty.biz.id']);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAdmin = async () => {
      try {
        const res = await authFetch('/api/admin/overview');
        if (!res.ok) {
          if (isMounted) {
            if (res.status === 403) {
              setError('Access restricted to administrators.');
            } else {
              setError('Failed to fetch admin statistics');
            }
          }
          return;
        }
        const json = await safeJson(res);
        if (isMounted && json) setData(json);

        const settingsRes = await authFetch('/api/admin/settings');
        if (settingsRes.ok) {
          const sData = await safeJson(settingsRes);
          if (isMounted && sData) {
            setTeamIdInput(sData.settings?.vercelTeamId || '');
            setBaseDomainInput(sData.settings?.baseDomain || 'cmnty.biz.id');
            setAvailableDomainsList(sData.settings?.availableDomains || [sData.settings?.baseDomain || 'cmnty.biz.id']);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error loading admin data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsStatus('');
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vercelToken: tokenInput,
          vercelTeamId: teamIdInput,
          baseDomain: baseDomainInput,
        }),
      });
      const resJson = await safeJson(res);
      if (res.ok) {
        setSettingsStatus('Settings updated and stored in JSON database. Connection verified.');
        setTokenInput('');
        loadAdminData();
      } else {
        setSettingsStatus(`Error: ${resJson?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setSettingsStatus(`Error: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddRootDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newDomainInput.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean) return;

    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addDomain: clean,
        }),
      });
      if (res.ok) {
        setNewDomainInput('');
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveRootDomain = (domain: string) => {
    confirmModal({
      title: 'Remove Root Domain',
      message: `Are you sure you want to remove "${domain}" from available domains?`,
      confirmText: 'Remove Domain',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              removeDomain: domain,
            }),
          });
          if (res.ok) {
            toast.success(`Domain "${domain}" removed successfully`);
            loadAdminData();
          } else {
            const d = await safeJson(res);
            toast.error(d?.error || 'Failed to remove domain');
          }
        } catch (err: any) {
          toast.error(err.message || 'Error removing domain');
        }
      },
    });
  };

  const handleSetDefaultDomain = async (domain: string) => {
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseDomain: domain,
        }),
      });
      if (res.ok) {
        toast.success(`Primary domain set to ${domain}`);
        loadAdminData();
      } else {
        const d = await safeJson(res);
        toast.error(d?.error || 'Failed to set primary domain');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error setting primary domain');
    }
  };

  const handleToggleUserRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    confirmModal({
      title: 'Change User Role',
      message: `Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`,
      confirmText: 'Update Role',
      danger: newRole === 'admin',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole }),
          });
          if (res.ok) {
            toast.success(`User role updated to ${newRole.toUpperCase()}`);
            loadAdminData();
          } else {
            const d = await safeJson(res);
            toast.error(d?.error || 'Failed to update user role');
          }
        } catch (err: any) {
          toast.error(err.message || 'Error updating user role');
        }
      },
    });
  };

  const handleResetSecurity = (userId: string, userEmail: string) => {
    confirmModal({
      title: 'Reset Security Lock',
      message: `Clear the IP and Device lock for "${userEmail}"? This allows the user to re-register or update their primary device.`,
      confirmText: 'Reset Security',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resetSecurity' }),
          });
          if (res.ok) {
            toast.success('Security lock cleared successfully');
            loadAdminData();
          } else {
            const d = await safeJson(res);
            toast.error(d?.error || 'Failed to reset security');
          }
        } catch (err: any) {
          toast.error(err.message || 'Error resetting security');
        }
      },
    });
  };

  const handleToggleSuspendUser = (userId: string, currentStatus: boolean, userEmail: string) => {
    const action = currentStatus ? 'unsuspend' : 'suspend';
    confirmModal({
      title: currentStatus ? 'Reactivate User Account' : 'Suspend User Account',
      message: currentStatus 
        ? `Are you sure you want to reactivate account for "${userEmail}"?`
        : `Are you sure you want to suspend account for "${userEmail}"? They will be unable to login or access their projects.`,
      confirmText: currentStatus ? 'Reactivate Account' : 'Suspend Account',
      danger: !currentStatus,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
          });
          if (res.ok) {
            toast.success(`User account ${currentStatus ? 'reactivated' : 'suspended'}`);
            loadAdminData();
          } else {
            const d = await safeJson(res);
            toast.error(d?.error || 'Failed to update account status');
          }
        } catch (err: any) {
          toast.error(err.message || 'Error updating account status');
        }
      },
    });
  };

  const handleDeleteUser = (userId: string, userEmail: string) => {
    confirmModal({
      title: 'Delete User Account',
      message: `Are you sure you want to delete user account "${userEmail}"? This will tear down all associated projects.`,
      confirmText: 'Delete Account',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success(`User "${userEmail}" deleted`);
            loadAdminData();
          } else {
            const d = await safeJson(res);
            toast.error(d?.error || 'Failed to delete user');
          }
        } catch (err: any) {
          toast.error(err.message || 'Error deleting user');
        }
      },
    });
  };

  const handleToggleSuspend = async (projectId: string) => {
    try {
      const res = await authFetch(`/api/admin/projects/${projectId}/suspend`, { method: 'POST' });
      if (res.ok) {
        toast.success('Project status toggled');
        loadAdminData();
      } else {
        const d = await safeJson(res);
        toast.error(d?.error || 'Failed to toggle project status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error toggling project status');
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    confirmModal({
      title: 'Delete Project (Admin)',
      message: `Permanently delete project "${projectName}"?`,
      confirmText: 'Permanently Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ force: true, confirmName: projectName }),
          });
          if (res.ok) {
            toast.success(`Project "${projectName}" permanently deleted`);
            loadAdminData();
          } else {
            const d = await safeJson(res);
            toast.error(d?.error || 'Failed to delete project');
          }
        } catch (err: any) {
          toast.error(err.message || 'Error deleting project');
        }
      },
    });
  };

  if (error) {
    return (
      <DashboardLayout breadcrumbs={[{ label: 'Admin Panel' }]}>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-800 space-y-2 max-w-md mx-auto my-12">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold">Administrator Access Required</h2>
          <p className="text-xs text-rose-600">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 px-4 py-2 bg-neutral-950 text-white rounded-lg text-xs font-semibold"
          >
            Return to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const stats = data?.stats;
  const diagnostics = data?.diagnostics;
  const usersList = data?.users || [];
  const projectsList = data?.projects || [];

  const filteredUsers = usersList.filter(
    (u: any) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProjects = projectsList.filter(
    (p: any) =>
      p.name?.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.subdomain?.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.ownerEmail?.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Admin Panel' }]}>
      <div className="space-y-6 sm:space-y-8 max-w-6xl pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">System Administration</h1>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Global platform management, user oversight, domain routing, and infrastructure control.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              disabled={cleaningDb}
              onClick={handleCleanDatabase}
              className="px-3 py-2 border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50 active:scale-95 shadow-2xs cursor-pointer"
              title="Reset test projects, deployments and clear database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{cleaningDb ? 'Cleaning DB...' : 'Clean Database'}</span>
            </button>
            <button
              onClick={loadAdminData}
              className="p-2 border border-neutral-200 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition flex items-center gap-1.5 text-xs font-medium active:scale-95 cursor-pointer"
              title="Refresh statistics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync & Refresh</span>
            </button>
          </div>
        </div>

        {/* System Stats Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4" />
            </div>
            {loading ? (
              <div className="h-8 bg-neutral-100 rounded w-16 animate-pulse mt-2"></div>
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-neutral-950 mt-2 tabular-nums">
                {stats?.totalUsers ?? '—'}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1">Registered platform accounts</div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Projects</span>
              <Server className="w-4 h-4" />
            </div>
            {loading ? (
              <div className="h-8 bg-neutral-100 rounded w-16 animate-pulse mt-2"></div>
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-neutral-950 mt-2 tabular-nums">
                {stats?.totalProjects ?? '—'}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1">Deployments active</div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Deployments</span>
              <Activity className="w-4 h-4" />
            </div>
            {loading ? (
              <div className="h-8 bg-neutral-100 rounded w-16 animate-pulse mt-2"></div>
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-neutral-950 mt-2 tabular-nums">
                {stats?.totalDeployments ?? '—'}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1">Build runs recorded</div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Infrastructure</span>
              <Server className="w-4 h-4" />
            </div>
            {loading ? (
              <div className="h-8 bg-neutral-100 rounded w-24 animate-pulse mt-2"></div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    diagnostics?.authenticated ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span className="text-base sm:text-lg font-bold text-neutral-950 truncate">
                  {diagnostics?.authenticated ? 'Connected' : 'Token Needed'}
                </span>
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1">
              {diagnostics?.latencyMs ? `${diagnostics.latencyMs}ms API response` : 'REST API Ready'}
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1 border-b border-neutral-200 overflow-x-auto text-xs font-semibold scrollbar-none pb-0.5">
          {[
            { id: 'users', label: 'Users', icon: Users, count: usersList.length },
            { id: 'projects', label: 'Projects', icon: Server, count: projectsList.length },
            { id: 'domains', label: 'Root Domains', icon: Globe, count: availableDomainsList.length },
            { id: 'infrastructure', label: 'Credentials & Settings', icon: Key },
            { id: 'logs', label: 'Audit Logs', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'border-neutral-950 text-neutral-950 font-bold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white border border-neutral-200/80 rounded-xl shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-950">Platform Users</h2>
                <p className="text-xs text-neutral-500">Manage registered user accounts and administrator permissions.</p>
              </div>

              {/* Search user */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user email or name..."
                  className="w-full text-xs bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <div className="inline-block min-w-full align-middle px-5 sm:px-6">
                <table className="min-w-[900px] w-full text-left text-xs border-separate border-spacing-0">
                  <thead className="bg-neutral-50/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">User Details</th>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">Registration Info</th>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">Last Active</th>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">Role</th>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">Projects</th>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {loading ? (
                      [1, 2, 3, 4].map((i) => (
                        <tr key={i}>
                          <td colSpan={6} className="px-4 py-6">
                            <div className="h-4 bg-neutral-100 rounded animate-pulse w-full"></div>
                          </td>
                        </tr>
                      ))
                    ) : filteredUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors group">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-bold text-neutral-950">{u.name}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">{u.email}</div>
                          <div className="text-[9px] text-neutral-400 mt-0.5">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-4 max-w-[180px]">
                          <div className="text-[10px] font-mono font-bold text-neutral-800 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-neutral-400" />
                            {u.registeredIp || '—'}
                          </div>
                          <div className="text-[9px] text-neutral-400 truncate mt-0.5" title={u.registeredUserAgent}>
                            {u.registeredUserAgent || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {u.lastLoginAt ? (
                            <div className="space-y-0.5">
                              <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                <Activity className="w-2.5 h-2.5" />
                                {new Date(u.lastLoginAt).toLocaleDateString()}
                              </div>
                              <div className="text-[9px] font-mono text-neutral-400">{u.lastLoginIp || 'unknown'}</div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-400 italic">Never logged in</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit border ${
                                u.role === 'admin'
                                  ? 'bg-amber-100 text-amber-900 border-amber-200'
                                  : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                              }`}
                            >
                              {u.role}
                            </span>
                            {u.isSuspended && (
                              <span className="text-[9px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold uppercase w-fit">
                                Suspended
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-neutral-50 border border-neutral-100 rounded-md">
                            <Layers className="w-3 h-3 text-neutral-400" />
                            <span className="font-mono font-bold text-neutral-800">{u.projectsCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleResetSecurity(u.id, u.email)}
                            className="inline-flex items-center p-2 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Reset Security Lock (Clear IP/Device)"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleSuspendUser(u.id, u.isSuspended, u.email)}
                            className={`inline-flex items-center p-2 rounded-lg transition-colors ${
                              u.isSuspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={u.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                          >
                            {u.isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleToggleUserRole(u.id, u.role)}
                            className="inline-flex items-center px-2.5 py-1.5 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded-lg text-[11px] font-bold transition shadow-2xs active:scale-95"
                          >
                            {u.role === 'admin' ? (
                              <><UserX className="w-3 h-3 mr-1" /> Demote</>
                            ) : (
                              <><UserCheck className="w-3 h-3 mr-1" /> Promote</>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!loading && filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-neutral-400">
                            <Search className="w-8 h-8 opacity-20" />
                            <span className="text-xs">No users matching &quot;{userSearch}&quot;</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROJECTS DIRECTORY */}
        {activeTab === 'projects' && (
          <div className="bg-white border border-neutral-200/80 rounded-xl shadow-2xs overflow-hidden p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-950">Hosted Projects</h2>
                <p className="text-xs text-neutral-500">Overview of all active projects deployed across the platform.</p>
              </div>

              {/* Search project */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search project or subdomain..."
                  className="w-full text-xs bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <div className="inline-block min-w-full align-middle px-5 sm:px-6">
                <table className="min-w-[950px] w-full text-left text-xs border-separate border-spacing-0">
                  <thead className="bg-neutral-50/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">Project Name & Slug</th>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">Framework</th>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">Owner Account</th>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">Live URL</th>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {loading ? (
                      [1, 2, 3, 4].map((i) => (
                        <tr key={i}>
                          <td colSpan={6} className="px-4 py-6">
                            <div className="h-4 bg-neutral-100 rounded animate-pulse w-full"></div>
                          </td>
                        </tr>
                      ))
                    ) : filteredProjects.map((p: any) => (
                      <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors group">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-bold text-neutral-950 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{p.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                            Created {new Date(p.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-mono text-[11px] text-neutral-900 uppercase font-bold bg-neutral-100 px-2 py-0.5 rounded-md inline-block">
                            {p.vercelFramework || p.framework || 'static'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500 uppercase">
                              {p.ownerEmail?.[0] || 'U'}
                            </div>
                            <div className="font-medium text-neutral-900">{p.ownerEmail}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono">
                          <a
                            href={p.latestDeploymentUrl || `https://${p.subdomain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:text-emerald-800 underline decoration-emerald-200 underline-offset-4"
                          >
                            <span className="truncate max-w-[180px]">{p.subdomain || p.name}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                              p.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-100'
                            }`}
                          >
                            {p.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap space-x-2">
                          <Link
                            href={`/dashboard/projects/${p.dbId || p.id}`}
                            className="inline-flex items-center px-2.5 py-1.5 bg-white border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-950 hover:text-white rounded-lg text-[11px] font-bold transition shadow-2xs active:scale-95"
                          >
                            Manage
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleSuspend(p.id)}
                            className={`inline-flex items-center px-2.5 py-1.5 border rounded-lg text-[11px] font-bold transition shadow-2xs active:scale-95 ${
                              p.status === 'ACTIVE' 
                                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {p.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id, p.name)}
                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!loading && filteredProjects.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-neutral-400">
                            <Search className="w-8 h-8 opacity-20" />
                            <span className="text-xs">No projects matching &quot;{projectSearch}&quot;</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ROOT DOMAINS */}
        {activeTab === 'domains' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-neutral-900" />
                  <h2 className="text-base font-bold text-neutral-950">Available Root Domains</h2>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Manage the root domains users can select from when deploying their projects and subdomains.
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-500">{availableDomainsList.length} Active Domains</span>
            </div>

            {/* Add New Domain Form */}
            <form onSubmit={handleAddRootDomain} className="flex flex-col sm:flex-row gap-2 max-w-lg">
              <input
                type="text"
                required
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                placeholder="e.g. cmnty.biz.id, mysite.id"
                className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-neutral-950"
              />
              <button
                type="submit"
                disabled={!newDomainInput.trim()}
                className="px-4 py-2 bg-neutral-950 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 disabled:opacity-40 transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Domain</span>
              </button>
            </form>

            {/* List of Available Root Domains */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
              {availableDomainsList.map((dom) => {
                const isDefault = dom === baseDomainInput;
                return (
                  <div key={dom} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-neutral-950 truncate">{dom}</span>
                      {isDefault && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                          Default Base Domain
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultDomain(dom)}
                          className="px-2.5 py-1 border border-neutral-200 text-neutral-700 hover:text-neutral-950 rounded text-xs font-medium hover:bg-neutral-50 transition"
                        >
                          Set as Default
                        </button>
                      )}
                      {availableDomainsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRootDomain(dom)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 transition"
                          title="Delete domain"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: INFRASTRUCTURE CREDENTIALS */}
        {activeTab === 'infrastructure' && (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div>
                  <h2 className="text-base font-bold text-neutral-950">Cloud Engine Connection</h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Secure REST API credentials and routing configuration.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-tight">API Latency</span>
                    <span className="text-xs font-mono font-bold text-neutral-950">
                      {diagnostics?.latencyMs ? `${diagnostics.latencyMs}ms` : '—'}
                    </span>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${diagnostics?.authenticated ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                </div>
              </div>

              <div className="p-5 sm:p-8">
                {diagnostics?.error && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Connection Diagnostic Error</p>
                      <p className="opacity-80 break-words">{diagnostics.error}</p>
                    </div>
                  </div>
                )}

                {settingsStatus && (
                  <div className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-3 border ${
                    settingsStatus.includes('Error') 
                      ? 'bg-rose-50 border-rose-100 text-rose-800' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  }`}>
                    <Check className={`w-4 h-4 ${settingsStatus.includes('Error') ? 'text-rose-600' : 'text-emerald-600'}`} />
                    <span>{settingsStatus}</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    {/* API Token Card */}
                    <div className="group space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                          Personal Access Token
                        </label>
                        <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">Encrypted at rest</span>
                      </div>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="password"
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          placeholder="••••••••••••••••••••••••••••••••"
                          className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neutral-950/5 focus:border-neutral-950 transition-all placeholder:text-neutral-300"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-relaxed">
                        The token is used to authenticate with the Vercel REST API. It is stored securely and never sent to the browser after initial save.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Team ID Card */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                          Vercel Team ID
                        </label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            value={teamIdInput}
                            onChange={(e) => setTeamIdInput(e.target.value)}
                            placeholder="team_xxxxxxxxxxxx"
                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neutral-950/5 focus:border-neutral-950 transition-all"
                          />
                        </div>
                        <p className="text-[10px] text-neutral-400">Optional. Required for Pro/Enterprise team deployments.</p>
                      </div>

                      {/* Base Domain Card */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                          Primary Routing Domain
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            value={baseDomainInput}
                            onChange={(e) => setBaseDomainInput(e.target.value)}
                            placeholder="cmnty.biz.id"
                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neutral-950/5 focus:border-neutral-950 transition-all"
                          />
                        </div>
                        <p className="text-[10px] text-neutral-400">Used as the base for all automated wildcard subdomains.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4 border-t border-neutral-100 mt-8">
                    <div className="hidden sm:flex items-center gap-2 text-emerald-600">
                      <Shield className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">End-to-End Secure</span>
                    </div>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full sm:w-auto px-6 py-3 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 disabled:opacity-50 transition shadow-lg shadow-neutral-950/10 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {savingSettings ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Connection...</>
                      ) : (
                        <>Save & Validate Configuration</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-neutral-950 rounded-2xl p-6 text-white shadow-xl shadow-neutral-950/20 relative overflow-hidden group">
              <div className="relative z-10 space-y-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Infrastructure Hardening
                </h3>
                <p className="text-[11px] text-neutral-400 max-w-lg leading-relaxed">
                  Your credentials are encrypted using a system-level secret and stored in an atomic JSON database. 
                  Access to these settings is restricted to accounts with the Super Admin role. 
                  Any changes are recorded in the system audit logs.
                </p>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Server className="w-24 h-24 rotate-12" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-6 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-neutral-950">System Audit Trail</h3>
            <div className="font-mono text-[11px] divide-y divide-neutral-100 max-h-96 overflow-y-auto">
              {data?.auditLogs?.map((log: any) => (
                <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-neutral-600 gap-2">
                  <div className="truncate pr-2">
                    <span className="font-bold text-neutral-950">[{log.action}]</span>{' '}
                    <span>{log.userEmail}</span>
                    {log.metadata?.ip && (
                      <span className="ml-2 text-[9px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500 font-mono">
                        {log.metadata.ip as string}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {log.metadata?.ua && (
                      <span className="hidden md:inline text-[9px] text-neutral-400 truncate max-w-[200px]" title={log.metadata.ua as string}>
                        {log.metadata.ua as string}
                      </span>
                    )}
                    <span className="text-neutral-400 text-[10px] shrink-0 font-sans">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

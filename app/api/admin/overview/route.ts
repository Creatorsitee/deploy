import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import { testVercelDiagnostics } from '@/lib/vercel/diagnostics';
import { listVercelProjects } from '@/lib/vercel/projects';
import { getVercelConfig } from '@/lib/vercel/client';

export async function GET() {
  try {
    const admin = await requireAdmin();

    const users = db.getAllUsers();
    const projects = db.getAllProjects();
    const deployments = db.getAllDeployments();
    const domains = db.getAllDomains();
    const auditLogs = db.getAuditLogs(30);

    const successfulDeployments = deployments.filter((d) => d.status === 'READY').length;
    const failedDeployments = deployments.filter((d) => d.status === 'ERROR').length;
    const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;

    // Run live Vercel diagnostics
    const diagnostics = await testVercelDiagnostics();
    const config = getVercelConfig();

    let vercelProjectsList: any[] = [];
    if (config.isConfigured) {
      try {
        const vRes = await listVercelProjects();
        if (vRes.ok && vRes.data && Array.isArray(vRes.data.projects)) {
          vercelProjectsList = vRes.data.projects;
        }
      } catch (e) {
        console.warn('Failed to fetch Vercel projects list:', e);
      }
    }

    // Map all projects purely from Vercel API if available, supplemented with DB
    const allProjectsMap = new Map<string, any>();

    if (vercelProjectsList.length > 0) {
      // 1. Prioritize live projects from Vercel REST API
      vercelProjectsList.forEach((vp) => {
        const key = vp.name.toLowerCase();
        const dbMatch = projects.find(
          (p) => p.slug.toLowerCase() === key || p.vercelProjectId === vp.id || p.id === vp.id
        );
        const owner = dbMatch ? users.find((u) => u.id === dbMatch.userId) : null;
        const projectDeployments = dbMatch ? deployments.filter((d) => d.projectId === dbMatch.id) : [];

        const isPaused = Boolean(vp.paused) || dbMatch?.status === 'SUSPENDED';

        allProjectsMap.set(key, {
          id: vp.id,
          dbId: dbMatch?.id || null,
          vercelId: vp.id,
          userId: dbMatch?.userId || 'vercel_account',
          name: vp.name,
          slug: vp.name,
          framework: vp.framework || dbMatch?.framework || 'static',
          nodeVersion: (vp as any).nodeVersion || '20.x',
          buildCommand: (vp as any).buildCommand || dbMatch?.buildCommand || '',
          installCommand: (vp as any).installCommand || dbMatch?.installCommand || '',
          outputDirectory: (vp as any).outputDirectory || dbMatch?.outputDirectory || './',
          status: isPaused ? 'SUSPENDED' : 'ACTIVE',
          paused: isPaused,
          subdomain: dbMatch?.subdomain || `${vp.name}.${config.baseDomain}`,
          latestDeploymentUrl: dbMatch?.subdomain
            ? `https://${dbMatch.subdomain}`
            : `https://${vp.name}.${config.baseDomain}`,
          createdAt: new Date(vp.createdAt).toISOString(),
          updatedAt: new Date(vp.updatedAt || vp.createdAt).toISOString(),
          ownerEmail: owner?.email || 'Vercel API Account',
          deploymentsCount: Math.max(projectDeployments.length, 1),
          isLiveOnVercel: true,
          source: 'Live Vercel REST API',
        });
      });

      // 2. Include any local DB projects not present on Vercel
      projects.forEach((p) => {
        const key = p.slug.toLowerCase();
        if (!allProjectsMap.has(key)) {
          const owner = users.find((u) => u.id === p.userId);
          const projectDeployments = deployments.filter((d) => d.projectId === p.id);
          allProjectsMap.set(key, {
            ...p,
            ownerEmail: owner?.email || 'System User',
            deploymentsCount: projectDeployments.length,
            vercelId: p.vercelProjectId || null,
            vercelFramework: p.framework || 'static',
            nodeVersion: '20.x',
            latestDeploymentUrl: `https://${p.subdomain}`,
            isLiveOnVercel: false,
            source: 'Local Project',
          });
        }
      });
    } else {
      // If Vercel API returned no projects or unconfigured, list DB projects
      projects.forEach((p) => {
        const owner = users.find((u) => u.id === p.userId);
        const projectDeployments = deployments.filter((d) => d.projectId === p.id);
        allProjectsMap.set(p.slug.toLowerCase(), {
          ...p,
          ownerEmail: owner?.email || 'System User',
          deploymentsCount: projectDeployments.length,
          vercelId: p.vercelProjectId || null,
          vercelFramework: p.framework || 'static',
          nodeVersion: '20.x',
          latestDeploymentUrl: `https://${p.subdomain}`,
          isLiveOnVercel: false,
          source: 'Local Project',
        });
      });
    }

    const enrichedProjects = Array.from(allProjectsMap.values());

    return NextResponse.json({
      stats: {
        totalUsers: users.length,
        totalProjects: enrichedProjects.length,
        activeProjects,
        totalDeployments: deployments.length,
        successfulDeployments,
        failedDeployments,
        totalDomains: domains.length,
      },
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        registeredIp: u.registeredIp,
        registeredUserAgent: u.registeredUserAgent,
        registeredDeviceId: u.registeredDeviceId,
        lastLoginIp: u.lastLoginIp,
        lastLoginAt: u.lastLoginAt,
        isSuspended: Boolean(u.isSuspended),
        projectsCount: projects.filter((p) => p.userId === u.id).length,
        createdAt: u.createdAt,
      })),
      projects: enrichedProjects,
      auditLogs,
      diagnostics,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Access restricted to system administrators' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to fetch admin overview' }, { status: 500 });
  }
}

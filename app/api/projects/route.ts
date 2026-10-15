import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import { getVercelConfig } from '@/lib/vercel/client';
import { Project } from '@/lib/types';
import { isSubdomainReserved } from '@/lib/validation';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sysConfig = db.getSystemConfig();

  // DASHBOARD ISOLATION: Even admins only see their own projects in the main dashboard view.
  // Use the Admin Panel (/admin) to view global platform projects.
  const projects = db.getProjectsByUserId(user.id);

  // Attach latest deployment & domain count to each project
  const enriched = projects.map((p) => {
    const deployments = db.getDeploymentsByProjectId(p.id);
    const latestDeployment = deployments[0] || null;
    const domains = db.getDomainsByProjectId(p.id);
    return {
      ...p,
      latestDeployment,
      domainCount: domains.length,
      fullSubdomain: `${p.slug}.${sysConfig.baseDomain}`,
    };
  });

  return NextResponse.json({ projects: enriched });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getVercelConfig();
    if (!config.isConfigured) {
      return NextResponse.json(
        { error: 'Vercel API Token is not configured. Please set a valid Vercel Token in the Admin Panel.' },
        { status: 400 }
      );
    }

    const sysConfig = db.getSystemConfig();
    const userProjects = db.getProjectsByUserId(user.id);
    const maxProjects = sysConfig.maxProjectsPerUser || 3;

    // Strict enforcement for all users. Admins can override this in the database directly or Admin Panel if needed,
    // but the UI should behave consistently for everyone to avoid confusion.
    if (userProjects.length >= maxProjects) {
      return NextResponse.json(
        {
          error: `Project limit reached. Accounts are limited to ${maxProjects} active projects. Please delete an existing project before creating a new one.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, slug, framework, buildCommand, installCommand, outputDirectory, selectedDomain, environmentVariables } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const rawSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!rawSlug || rawSlug.length < 3) {
      return NextResponse.json(
        { error: 'Project slug must be at least 3 characters and contain only letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    if (rawSlug.length > 40) {
      return NextResponse.json({ error: 'Project slug cannot exceed 40 characters' }, { status: 400 });
    }

    if (isSubdomainReserved(rawSlug)) {
      return NextResponse.json(
        { error: `The subdomain "${rawSlug}" contains a reserved system pattern (like api-, -rest, etc.). Please choose a different slug.` },
        { status: 400 }
      );
    }

    const chosenDomain = selectedDomain && typeof selectedDomain === 'string'
      ? selectedDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      : sysConfig.baseDomain || 'cmnty.biz.id';

    const fullSubdomain = `${rawSlug}.${chosenDomain}`;

    // Check slug uniqueness across projects
    const existing = db.getAllProjects().find((p) => p.subdomain?.toLowerCase() === fullSubdomain.toLowerCase());
    if (existing) {
      return NextResponse.json(
        { error: `Subdomain "${fullSubdomain}" is already in use by another project.` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      name: name.trim(),
      slug: rawSlug,
      framework: framework || 'static',
      buildCommand: buildCommand || '',
      installCommand: installCommand || '',
      outputDirectory: outputDirectory || './',
      status: 'ACTIVE',
      subdomain: fullSubdomain,
      selectedDomain: chosenDomain,
      createdAt: now,
      updatedAt: now,
    };

    db.createProject(newProject);

    // Save initial environment variables if provided
    if (Array.isArray(environmentVariables) && environmentVariables.length > 0) {
      for (const env of environmentVariables) {
        if (env && env.key && env.value) {
          db.setEnvVar({
            id: `env_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            projectId: newProject.id,
            key: String(env.key).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
            value: String(env.value).trim(),
            target: Array.isArray(env.target) && env.target.length > 0 ? env.target : ['production', 'preview', 'development'],
            createdAt: now,
          });
        }
      }
    }

    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'PROJECT_CREATE',
      metadata: { projectId: newProject.id, slug: newProject.slug, subdomain: fullSubdomain },
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (err: any) {
    console.error('Create project error', err);
    return NextResponse.json({ error: err.message || 'Failed to create project' }, { status: 500 });
  }
}

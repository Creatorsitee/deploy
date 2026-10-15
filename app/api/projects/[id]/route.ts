import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import { deleteVercelProject, updateVercelProject } from '@/lib/vercel/projects';
import { getVercelConfig } from '@/lib/vercel/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let project = db.getProjectById(id);

  if (!project) {
    // If not found in DB, check if user is admin and if it exists on Vercel
    if (user.role === 'admin') {
      const config = getVercelConfig();
      if (config.isConfigured) {
        try {
          const { getVercelProject } = await import('@/lib/vercel/projects');
          const vRes = await getVercelProject(id);
          if (vRes.ok && vRes.data) {
            const vp = vRes.data;
            // Return a virtual project object
            return NextResponse.json({
              project: {
                id: vp.id,
                userId: 'vercel_account',
                name: vp.name,
                slug: vp.name,
                framework: vp.framework || 'static',
                status: vp.paused ? 'SUSPENDED' : 'ACTIVE',
                subdomain: `${vp.name}.${config.baseDomain}`,
                fullSubdomain: `${vp.name}.${config.baseDomain}`,
                vercelProjectId: vp.id,
                createdAt: new Date(vp.createdAt).toISOString(),
                updatedAt: new Date(vp.updatedAt || vp.createdAt).toISOString(),
                isVirtual: true,
              },
              deployments: [],
              domains: [],
              environmentVariables: [],
              systemConfig: {
                baseDomain: config.baseDomain,
                availableDomains: [config.baseDomain],
              },
            });
          }
        } catch (e) {
          console.warn('Vercel virtual project fetch error:', e);
        }
      }
    }
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const deployments = db.getDeploymentsByProjectId(project.id);
  const domains = db.getDomainsByProjectId(project.id);
  const envVars = db.getEnvVarsByProjectId(project.id);
  const sysConfig = db.getSystemConfig();

  // Mask env var values for security
  const maskedEnvVars = envVars.map((e) => ({
    ...e,
    value: '••••••••••••••••',
  }));

  return NextResponse.json({
    project: {
      ...project,
      fullSubdomain: project.subdomain || `${project.slug}.${sysConfig.baseDomain}`,
    },
    deployments,
    domains,
    environmentVariables: maskedEnvVars,
    systemConfig: {
      baseDomain: sysConfig.baseDomain,
      availableDomains: sysConfig.availableDomains || [sysConfig.baseDomain],
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const project = db.getProjectById(id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const updates: any = {};

  if (body.name) updates.name = body.name.trim();
  if (body.framework) updates.framework = body.framework;
  if (body.buildCommand !== undefined) updates.buildCommand = body.buildCommand;
  if (body.installCommand !== undefined) updates.installCommand = body.installCommand;
  if (body.outputDirectory !== undefined) updates.outputDirectory = body.outputDirectory;

  const updated = db.updateProject(project.id, updates);

  // Sync to Vercel API if configured
  const config = getVercelConfig();
  if (config.isConfigured && (project.vercelProjectId || project.slug)) {
    try {
      await updateVercelProject(project.vercelProjectId || project.slug, {
        name: updates.name,
        buildCommand: updates.buildCommand,
        installCommand: updates.installCommand,
        outputDirectory: updates.outputDirectory,
        framework: updates.framework,
      });
    } catch (e) {
      console.warn('Vercel project patch notice:', e);
    }
  }

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    action: 'PROJECT_UPDATE',
    metadata: { projectId: project.id, updates },
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = getVercelConfig();
  if (!config.isConfigured) {
    return NextResponse.json(
      { error: 'Vercel API Token is not configured. Project deletion is disabled.' },
      { status: 400 }
    );
  }

  const { id } = await params;
  let project = db.getProjectById(id) || db.getProjectBySlug(id);

  if (!project) {
    // If not found in local DB, but user is admin, attempt Vercel deletion and DB cleanup
    if (user.role === 'admin') {
      if (config.isConfigured) {
        try {
          await deleteVercelProject(id);
        } catch (err) {
          console.warn('Vercel project cleanup error (non-fatal):', err);
        }
      }
      db.deleteProject(id);
      db.addAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: 'PROJECT_DELETE',
        metadata: { projectId: id },
      });
      return NextResponse.json({ success: true, message: 'Project successfully deleted' });
    }
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check confirmation query param or body
  const body = await req.json().catch(() => ({}));
  if (body.force !== true && body.confirmName !== project.name && body.confirmName !== project.slug) {
    return NextResponse.json(
      { error: `Please type "${project.name}" or "${project.slug}" to confirm deletion` },
      { status: 400 }
    );
  }

  // If Vercel project exists and Vercel is configured, attempt clean deletion on Vercel
  if (config.isConfigured) {
    const targets = Array.from(
      new Set([project.vercelProjectId, project.slug, project.name, id].filter(Boolean))
    );
    for (const target of targets) {
      try {
        await deleteVercelProject(target as string);
      } catch (err) {
        console.warn(`Vercel project cleanup notice for ${target} (non-fatal):`, err);
      }
    }
  }

  db.deleteProject(project.id);
  db.deleteProject(id);

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    action: 'PROJECT_DELETE',
    metadata: { projectId: project.id, slug: project.slug },
  });

  return NextResponse.json({ success: true, message: 'Project successfully deleted' });
}

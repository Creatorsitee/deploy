import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import { getVercelConfig } from '@/lib/vercel/client';
import { pauseVercelProject, unpauseVercelProject, getVercelProject } from '@/lib/vercel/projects';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const project = db.getProjectById(id) || db.getProjectBySlug(id);
    const config = getVercelConfig();

    let isCurrentlySuspended = project?.status === 'SUSPENDED';

    // If Vercel is configured, check live status on Vercel or toggle on Vercel
    if (config.isConfigured) {
      const vercelTarget = project?.vercelProjectId || project?.slug || id;
      try {
        if (!project) {
          // Project might be from Vercel directly
          const vProject = await getVercelProject(vercelTarget);
          if (vProject.ok && vProject.data) {
            isCurrentlySuspended = Boolean(vProject.data.paused);
          }
        }

        const nextAction = isCurrentlySuspended ? 'resume' : 'pause';
        if (nextAction === 'pause') {
          await pauseVercelProject(vercelTarget);
        } else {
          await unpauseVercelProject(vercelTarget);
        }
      } catch (vercelErr) {
        console.warn('Vercel suspend API notice:', vercelErr);
      }
    }

    const nextStatus = isCurrentlySuspended ? 'ACTIVE' : 'SUSPENDED';

    if (project) {
      db.updateProject(project.id, { status: nextStatus });
    }

    db.addAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: nextStatus === 'SUSPENDED' ? 'PROJECT_SUSPEND' : 'PROJECT_REACTIVATE',
      metadata: { projectId: id, status: nextStatus },
    });

    return NextResponse.json({
      status: nextStatus,
      message: `Project status successfully changed to ${nextStatus}`,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Access restricted to system administrators' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}

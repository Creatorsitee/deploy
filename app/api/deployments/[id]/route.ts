import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import { getVercelDeployment, getVercelDeploymentEvents, cancelVercelDeployment } from '@/lib/vercel/deployments';
import { getVercelConfig } from '@/lib/vercel/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let deployment = db.getDeploymentById(id);

  if (!deployment) {
    return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
  }

  const project = db.getProjectById(deployment.projectId);
  if (deployment.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // If deployment has Vercel ID and was in progress, poll Vercel API for live status & events
  const config = getVercelConfig();
  if (config.isConfigured && deployment.vercelDeploymentId && (deployment.status === 'BUILDING' || deployment.status === 'QUEUED')) {
    try {
      const vRes = await getVercelDeployment(deployment.vercelDeploymentId);
      if (vRes.ok && vRes.data) {
        const vData = vRes.data;
        const newStatus = vData.readyState;

        // Fetch events/logs
        const logRes = await getVercelDeploymentEvents(deployment.vercelDeploymentId);
        const newLogs = logRes.ok && logRes.logs && logRes.logs.length > 0 ? logRes.logs : deployment.logs;

        db.updateDeployment(deployment.id, {
          status: newStatus,
          logs: newLogs,
          completedAt: newStatus === 'READY' || newStatus === 'ERROR' ? new Date().toISOString() : undefined,
        });

        deployment = db.getDeploymentById(id)!;
      }
    } catch (err) {
      console.warn('Error polling Vercel status:', err);
    }
  }

  return NextResponse.json({
    deployment,
    project: project
      ? {
          id: project.id,
          name: project.name,
          slug: project.slug,
          subdomain: project.subdomain,
        }
      : null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const deployment = db.getDeploymentById(id);

  if (!deployment) {
    return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
  }

  if (deployment.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  if (body.action === 'cancel' && deployment.vercelDeploymentId) {
    const config = getVercelConfig();
    if (config.isConfigured) {
      await cancelVercelDeployment(deployment.vercelDeploymentId);
    }
    const updated = db.updateDeployment(id, {
      status: 'CANCELED',
      completedAt: new Date().toISOString(),
    });
    return NextResponse.json({ deployment: updated });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

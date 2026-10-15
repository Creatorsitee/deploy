import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import { EnvironmentVariable } from '@/lib/types';
import { addVercelProjectEnv } from '@/lib/vercel/projects';
import { getVercelConfig } from '@/lib/vercel/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const envVars = db.getEnvVarsByProjectId(id);
  // Return masked value + raw key and targets
  const masked = envVars.map((e) => ({
    id: e.id,
    key: e.key,
    value: '••••••••••••••••',
    target: e.target || ['production', 'preview', 'development'],
    createdAt: e.createdAt,
  }));

  return NextResponse.json({ envVars: masked });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { key, value, target } = await req.json();

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
  }

  const cleanKey = key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const envTarget = Array.isArray(target) && target.length > 0 ? target : ['production', 'preview', 'development'];

  const newEnv: EnvironmentVariable = {
    id: `env_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    projectId: project.id,
    key: cleanKey,
    value: String(value).trim(),
    target: envTarget,
    createdAt: new Date().toISOString(),
  };

  db.setEnvVar(newEnv);

  // If Vercel is connected, attempt sync to Vercel API
  const vercelCfg = getVercelConfig();
  if (vercelCfg.isConfigured) {
    try {
      await addVercelProjectEnv(project.vercelProjectId || project.slug, {
        key: cleanKey,
        value: String(value).trim(),
        target: envTarget,
      });
    } catch (e) {
      console.warn('Vercel env sync notice:', e);
    }
  }

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    action: 'ENV_VAR_SET',
    metadata: { projectId: project.id, key: cleanKey },
  });

  return NextResponse.json({
    envVar: {
      id: newEnv.id,
      key: newEnv.key,
      value: '••••••••••••••••',
      target: newEnv.target,
      createdAt: newEnv.createdAt,
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key parameter is required' }, { status: 400 });
  }

  db.deleteEnvVar(project.id, key);

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    action: 'ENV_VAR_DELETE',
    metadata: { projectId: project.id, key },
  });

  return NextResponse.json({ success: true, message: 'Environment variable removed' });
}

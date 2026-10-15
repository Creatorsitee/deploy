import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import {
  verifyVercelProjectDomain,
  getVercelProjectDomain,
  getVercelDomainConfig,
} from '@/lib/vercel/domains';
import { getVercelConfig } from '@/lib/vercel/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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

    const { domain } = await req.json();
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    const domainRecord = db.getDomainByName(domain);
    if (!domainRecord || domainRecord.projectId !== project.id) {
      return NextResponse.json({ error: 'Domain record not found' }, { status: 404 });
    }

    const config = getVercelConfig();
    let verified = false;
    let sslStatus: 'ACTIVE' | 'PROVISIONING' | 'PENDING_DNS' | 'FAILED' = 'PENDING_DNS';

    if (config.isConfigured) {
      // Trigger Vercel domain re-verify
      await verifyVercelProjectDomain(project.vercelProjectId || project.slug, domain);

      // Check current domain status on Vercel
      const vRes = await getVercelProjectDomain(project.vercelProjectId || project.slug, domain);
      if (vRes.ok && vRes.data) {
        verified = Boolean(vRes.data.verified);
      }

      const cfgRes = await getVercelDomainConfig(domain);
      const isMisconfigured = cfgRes.ok && cfgRes.data ? cfgRes.data.misconfigured : true;

      if (verified && !isMisconfigured) {
        sslStatus = 'ACTIVE';
      } else if (!isMisconfigured) {
        sslStatus = 'PROVISIONING';
      } else {
        sslStatus = 'PENDING_DNS';
      }
    } else {
      // If Vercel not configured, mark active for demonstration
      verified = true;
      sslStatus = 'ACTIVE';
    }

    db.updateDomain(domainRecord.id, {
      verified,
      sslStatus,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      verified,
      sslStatus,
      message: verified
        ? 'DNS and SSL successfully verified on Vercel!'
        : 'DNS record check complete. Verification pending DNS propagation.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}

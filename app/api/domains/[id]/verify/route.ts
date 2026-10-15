import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import { verifyVercelProjectDomain, getVercelDomainConfig } from '@/lib/vercel/domains';
import { getVercelConfig } from '@/lib/vercel/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const domainRecord = db.getAllDomains().find((d) => d.id === id);

  if (!domainRecord) {
    return NextResponse.json({ error: 'Domain record not found' }, { status: 404 });
  }

  const project = db.getProjectById(domainRecord.projectId);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (domainRecord.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const config = getVercelConfig();
  if (!config.isConfigured) {
    return NextResponse.json({
      domain: domainRecord,
      message: 'Vercel API credentials not configured. Domain verification unavailable.',
    });
  }

  // Trigger verify on Vercel
  const verifyRes = await verifyVercelProjectDomain(project.vercelProjectId || project.slug, domainRecord.domain);
  const dnsRes = await getVercelDomainConfig(domainRecord.domain);

  const isVerified = Boolean(verifyRes.ok && verifyRes.data?.verified);
  const isMisconfigured = dnsRes.ok && dnsRes.data ? dnsRes.data.misconfigured : !isVerified;

  const updatedRecord = db.updateDomain(domainRecord.id, {
    verified: isVerified,
    sslStatus: isVerified ? 'ACTIVE' : isMisconfigured ? 'PENDING_DNS' : 'PROVISIONING',
    dnsRecords: dnsRes.ok && dnsRes.data
      ? [
          {
            type: 'CNAME',
            name: domainRecord.domain.startsWith('www.') ? 'www' : domainRecord.domain.split('.')[0],
            value: dnsRes.data.recommendedCNAME || 'cname.vercel-dns.com',
            valid: !dnsRes.data.misconfigured,
          },
        ]
      : domainRecord.dnsRecords,
  });

  return NextResponse.json({
    domain: updatedRecord,
    verified: isVerified,
    message: isVerified ? 'Domain and SSL certificate successfully verified' : 'Domain DNS records pending propagation',
  });
}

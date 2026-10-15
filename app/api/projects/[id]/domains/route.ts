import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import { addVercelProjectDomain, removeVercelProjectDomain, getVercelDomainConfig } from '@/lib/vercel/domains';
import { getVercelConfig } from '@/lib/vercel/client';
import { DomainRecord } from '@/lib/types';

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

  const domains = db.getDomainsByProjectId(id);
  return NextResponse.json({ domains });
}

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
      return NextResponse.json({ error: 'Domain name is required' }, { status: 400 });
    }

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: 'Please enter a valid domain format (e.g. blog.example.com)' }, { status: 400 });
    }

    // Check if domain is already attached
    const existing = db.getDomainByName(cleanDomain);
    if (existing) {
      return NextResponse.json({ error: `Domain "${cleanDomain}" is already connected to a project.` }, { status: 409 });
    }

    const config = getVercelConfig();
    let verified = false;

    const parts = cleanDomain.split('.');
    const isApex = parts.length === 2; // e.g. perusahaan-saya.com
    const hostName = isApex ? '@' : parts.slice(0, -2).join('.');

    let dnsRecords: { type: 'CNAME' | 'A' | 'TXT'; name: string; value: string; valid?: boolean }[] = [];

    if (isApex) {
      dnsRecords.push({
        type: 'A',
        name: '@',
        value: '76.76.21.21',
        valid: false,
      });
      dnsRecords.push({
        type: 'CNAME',
        name: 'www',
        value: 'cname.vercel-dns.com',
        valid: false,
      });
    } else {
      dnsRecords.push({
        type: 'CNAME',
        name: hostName || '@',
        value: 'cname.vercel-dns.com',
        valid: false,
      });
    }

    if (config.isConfigured) {
      const vRes = await addVercelProjectDomain(project.vercelProjectId || project.slug, cleanDomain);
      if (vRes.ok && vRes.data) {
        verified = Boolean(vRes.data.verified);
        if (Array.isArray(vRes.data.verification) && vRes.data.verification.length > 0) {
          for (const ver of vRes.data.verification) {
            dnsRecords.push({
              type: 'TXT',
              name: ver.domain || cleanDomain,
              value: ver.value,
              valid: false,
            });
          }
        }
      }
      // Inspect DNS config
      const dnsRes = await getVercelDomainConfig(cleanDomain);
      if (dnsRes.ok && dnsRes.data) {
        if (!dnsRes.data.misconfigured) {
          dnsRecords = dnsRecords.map((r) => ({ ...r, valid: true }));
        }
      }
    }

    const domainRecord: DomainRecord = {
      id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId: project.id,
      userId: user.id,
      domain: cleanDomain,
      isSubdomain: cleanDomain.endsWith(config.baseDomain),
      verified,
      sslStatus: verified ? 'ACTIVE' : 'PENDING_DNS',
      dnsRecords,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createDomain(domainRecord);

    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'DOMAIN_ATTACH',
      metadata: { projectId: project.id, domain: cleanDomain },
    });

    return NextResponse.json({ domain: domainRecord }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to attach domain' }, { status: 500 });
  }
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
  const domainName = searchParams.get('domain');

  if (!domainName) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  const domainRecord = db.getDomainByName(domainName);
  if (!domainRecord || domainRecord.projectId !== project.id) {
    return NextResponse.json({ error: 'Domain not found for this project' }, { status: 404 });
  }

  // Remove from Vercel if configured
  const config = getVercelConfig();
  if (config.isConfigured) {
    await removeVercelProjectDomain(project.vercelProjectId || project.slug, domainName);
  }

  db.deleteDomain(domainRecord.id);

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    action: 'DOMAIN_REMOVE',
    metadata: { projectId: project.id, domain: domainName },
  });

  return NextResponse.json({ success: true, message: 'Domain removed' });
}

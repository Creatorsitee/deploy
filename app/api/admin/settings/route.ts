import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import { testVercelDiagnostics } from '@/lib/vercel/diagnostics';
import { getVercelConfig } from '@/lib/vercel/client';

export async function GET() {
  try {
    await requireAdmin();

    const config = getVercelConfig();
    const sys = db.getSystemConfig();
    const diagnostics = await testVercelDiagnostics();

    // Security: Never expose the full token to the client/browser
    const tokenPreview = config.token
      ? `••••••••••••${config.token.slice(-4)}`
      : 'Not Configured';

    return NextResponse.json({
      settings: {
        isConfigured: config.isConfigured,
        tokenPreview,
        vercelTeamId: config.teamId || '',
        baseDomain: config.baseDomain,
        availableDomains: sys.availableDomains || [config.baseDomain],
        allowPublicRegistration: sys.allowPublicRegistration,
        maxProjectsPerUser: sys.maxProjectsPerUser,
        maxDeploymentsPerDay: sys.maxDeploymentsPerDay,
      },
      diagnostics,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Access restricted to system administrators' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const currentSys = db.getSystemConfig();
    const updates: any = {};

    if (body.vercelToken && typeof body.vercelToken === 'string') {
      const trimmed = body.vercelToken.trim();
      if (trimmed.length > 0 && !trimmed.includes('••••')) {
        updates.vercelToken = trimmed;
      }
    }

    if (body.vercelTeamId !== undefined) {
      updates.vercelTeamId = body.vercelTeamId.trim();
    }

    if (body.baseDomain && typeof body.baseDomain === 'string') {
      const cleanDomain = body.baseDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (cleanDomain) {
        updates.baseDomain = cleanDomain;
        const currentDomains = currentSys.availableDomains || [cleanDomain];
        if (!currentDomains.includes(cleanDomain)) {
          updates.availableDomains = [cleanDomain, ...currentDomains];
        }
      }
    }

    // Add new root domain
    if (body.addDomain && typeof body.addDomain === 'string') {
      const cleanNewDomain = body.addDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (cleanNewDomain) {
        const currentDomains = currentSys.availableDomains || [currentSys.baseDomain];
        if (!currentDomains.includes(cleanNewDomain)) {
          updates.availableDomains = [...currentDomains, cleanNewDomain];
        }
      }
    }

    // Remove root domain
    if (body.removeDomain && typeof body.removeDomain === 'string') {
      const domainToRemove = body.removeDomain.toLowerCase().trim();
      const currentDomains = currentSys.availableDomains || [currentSys.baseDomain];
      const filtered = currentDomains.filter((d) => d !== domainToRemove);
      if (filtered.length > 0) {
        updates.availableDomains = filtered;
        if (currentSys.baseDomain === domainToRemove) {
          updates.baseDomain = filtered[0];
        }
      }
    }

    if (Array.isArray(body.availableDomains) && body.availableDomains.length > 0) {
      updates.availableDomains = body.availableDomains.map((d: string) =>
        d.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      ).filter(Boolean);
    }

    if (typeof body.allowPublicRegistration === 'boolean') {
      updates.allowPublicRegistration = body.allowPublicRegistration;
    }

    if (typeof body.maxProjectsPerUser === 'number') {
      updates.maxProjectsPerUser = Math.max(1, body.maxProjectsPerUser);
    }

    const updated = db.updateSystemConfig(updates);

    db.addAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'SYSTEM_SETTINGS_UPDATE',
      metadata: {
        updatedFields: Object.keys(updates).filter((k) => k !== 'vercelToken'),
        hasTokenUpdated: Boolean(updates.vercelToken),
      },
    });

    const diagnostics = await testVercelDiagnostics();

    return NextResponse.json({
      success: true,
      message: 'System configuration updated successfully',
      diagnostics,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Access restricted to system administrators' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}

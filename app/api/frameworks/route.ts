import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { listVercelFrameworks } from '@/lib/vercel/projects';
import { getVercelConfig } from '@/lib/vercel/client';

export async function GET() {
  try {
    // Only admins or authenticated users during project creation should ideally access this
    // For now, we'll allow authenticated users as it's used in project creation wizard
    
    const config = getVercelConfig();
    if (!config.isConfigured) {
      return NextResponse.json({ frameworks: [] });
    }

    const res = await listVercelFrameworks();
    if (!res.ok) {
      return NextResponse.json({ error: res.error || 'Failed to fetch frameworks from Vercel' }, { status: res.status });
    }

    return NextResponse.json(res.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

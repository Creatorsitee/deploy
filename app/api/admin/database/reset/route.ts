import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getDb, saveDb, db } from '@/lib/db/store';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const keepUsers = body.keepUsers !== false;

    const currentDb = getDb();

    // Preserve admin users
    const preservedUsers = keepUsers
      ? currentDb.users
      : currentDb.users.filter((u) => u.role === 'admin' || u.id === admin.id);

    // Reset projects, deployments, domains, and env vars
    const resetLog = {
      id: `log_reset_${Date.now()}`,
      userId: admin.id,
      userEmail: admin.email,
      action: 'DATABASE_RESET',
      metadata: {
        performedBy: admin.email,
        usersPreserved: preservedUsers.length,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };

    await db.resetDatabaseAndSync(preservedUsers, resetLog);

    return NextResponse.json({
      success: true,
      message: 'Database cleaned and reset successfully',
      stats: {
        projects: 0,
        deployments: 0,
        domains: 0,
        users: preservedUsers.length,
      },
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Access denied: Admin only' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Database reset failed' }, { status: 500 });
  }
}

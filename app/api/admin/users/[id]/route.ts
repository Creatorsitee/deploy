import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { db, getDb, saveDb } from '@/lib/db/store';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const user = db.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update role if provided
    if (body.role && (body.role === 'admin' || body.role === 'user')) {
      const updated = db.updateUser(id, { role: body.role });
      db.addAuditLog({
        userId: admin.id,
        userEmail: admin.email,
        action: 'USER_ROLE_UPDATE',
        metadata: { targetUserId: id, targetEmail: user.email, newRole: body.role },
      });
      return NextResponse.json({ user: updated });
    }

    // Security Reset (Clear IP/UA lock)
    if (body.action === 'resetSecurity') {
      const updated = db.updateUser(id, { 
        registeredIp: undefined, 
        registeredUserAgent: undefined 
      });
      db.addAuditLog({
        userId: admin.id,
        userEmail: admin.email,
        action: 'USER_SECURITY_RESET',
        metadata: { targetUserId: id, targetEmail: user.email },
      });
      return NextResponse.json({ user: updated, message: 'Security lock cleared. User can now re-register or update device.' });
    }

    // Account Suspension
    if (body.action === 'suspend') {
      const updated = db.updateUser(id, { isSuspended: true });
      db.addAuditLog({
        userId: admin.id,
        userEmail: admin.email,
        action: 'USER_SUSPEND',
        metadata: { targetUserId: id, targetEmail: user.email },
      });
      return NextResponse.json({ user: updated, message: 'User account suspended.' });
    }

    if (body.action === 'unsuspend') {
      const updated = db.updateUser(id, { isSuspended: false, failedLoginAttempts: 0 });
      db.addAuditLog({
        userId: admin.id,
        userEmail: admin.email,
        action: 'USER_UNSUSPEND',
        metadata: { targetUserId: id, targetEmail: user.email },
      });
      return NextResponse.json({ user: updated, message: 'User account reactivated.' });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    if (id === admin.id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
    }

    const user = db.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove user's projects and deployments
    const userProjects = db.getProjectsByUserId(id);
    for (const proj of userProjects) {
      db.deleteProject(proj.id);
    }

    // Delete user from db
    const currentDb = getDb();
    currentDb.users = currentDb.users.filter((u) => u.id !== id);
    saveDb(currentDb);

    db.addAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'USER_DELETE',
      metadata: { targetUserId: id, targetEmail: user.email },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to delete user' }, { status: 500 });
  }
}

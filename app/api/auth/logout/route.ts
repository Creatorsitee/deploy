import { NextResponse } from 'next/server';
import { clearSessionCookie, getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/store';

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGOUT',
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}

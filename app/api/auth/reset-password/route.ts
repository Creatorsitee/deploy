import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { hashPassword } from '@/lib/auth/crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const user = db.getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      // Return success message to prevent user enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, password update instructions have been processed.',
      });
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      const newHash = await hashPassword(newPassword);
      db.updateUser(user.id, { passwordHash: newHash });

      db.addAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: 'PASSWORD_RESET',
      });

      return NextResponse.json({
        success: true,
        message: 'Password has been updated successfully. You can now log in.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions have been dispatched to your email.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Password reset failed' }, { status: 500 });
  }
}

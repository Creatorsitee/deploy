import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { verifyPassword, hashPassword } from '@/lib/auth/crypto';
import { createSessionCookie } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const ua = req.headers.get('user-agent') || 'unknown';

    const emailTrimmed = email.trim().toLowerCase();
    const envAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envAdminPassword = process.env.ADMIN_PASSWORD;

    let user = db.getUserByEmail(emailTrimmed);

    // Check env-configured admin credentials
    if (
      envAdminEmail &&
      envAdminPassword &&
      emailTrimmed === envAdminEmail &&
      password === envAdminPassword
    ) {
      if (!user) {
        user = db.createUser({
          id: 'usr_env_admin',
          email: envAdminEmail,
          name: process.env.ADMIN_NAME || 'System Admin',
          passwordHash: await hashPassword(envAdminPassword),
          role: 'admin',
          createdAt: new Date().toISOString(),
        });
      } else if (user.role !== 'admin') {
        user = db.updateUser(user.id, { role: 'admin' })!;
      }
    } else {
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Check if user is suspended
      if (user.isSuspended) {
        return NextResponse.json(
          { error: 'This account has been suspended by an administrator.' },
          { status: 403 }
        );
      }

      // Check if account is locked due to failed attempts
      if ((user.failedLoginAttempts || 0) >= 5) {
        return NextResponse.json(
          { error: 'Account locked due to too many failed attempts. Please contact support.' },
          { status: 423 }
        );
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        // Increment failed attempts
        db.updateUser(user.id, {
          failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
        });

        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Reset failed attempts on successful login
      db.updateUser(user.id, {
        failedLoginAttempts: 0,
        lastLoginIp: ip,
        lastLoginAt: new Date().toISOString(),
      });
    }

    const token = await createSessionCookie(user);

    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      metadata: { ip, ua },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err: any) {
    console.error('Login error', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during login' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { hashPassword } from '@/lib/auth/crypto';
import { createSessionCookie } from '@/lib/auth/session';
import { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Password strength check (min 8 chars, uppercase, lowercase, digit, special char)
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasLower || !hasUpper || !hasDigit || !hasSpecial) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. !@#$%^&*).' },
        { status: 400 }
      );
    }

    const existingUser = db.getUserByEmail(emailTrimmed);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // Security: 1 Account per IP/Device
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const ua = req.headers.get('user-agent') || 'unknown';
    const deviceId = req.headers.get('x-device-id') || (body.deviceId ? String(body.deviceId).trim() : '');

    // Skip localhost / loopback IPs from multi-account blocking
    const isLocalhost = ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';

    if (!isLocalhost) {
      const userByIp = db.getUserByIp(ip);
      if (userByIp) {
        return NextResponse.json(
          { error: 'Security restriction: Only one account is allowed per network/IP address.' },
          { status: 403 }
        );
      }
    }

    if (deviceId) {
      const userByDevice = db.getUserByDeviceId(deviceId);
      if (userByDevice) {
        return NextResponse.json(
          { error: 'Security restriction: Only one account is allowed per device/phone.' },
          { status: 403 }
        );
      }
    }

    const hashedPassword = await hashPassword(password);
    const isFirstUser = db.getAllUsers().length === 0;

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: emailTrimmed,
      passwordHash: hashedPassword,
      role: isFirstUser ? 'admin' : 'user',
      registeredIp: ip,
      registeredUserAgent: ua,
      registeredDeviceId: deviceId || undefined,
      createdAt: new Date().toISOString(),
    };

    db.createUser(newUser);
    const token = await createSessionCookie(newUser);

    db.addAuditLog({
      userId: newUser.id,
      userEmail: newUser.email,
      action: 'USER_REGISTER',
      metadata: { role: newUser.role },
    });

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (err: any) {
    console.error('Registration error', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}

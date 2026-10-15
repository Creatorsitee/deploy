import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db/store';
import { User } from '@/lib/types';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'cmnty_session';
const SECRET = process.env.SESSION_SECRET || 'cmnty-Deploy-super-secure-key-32-chars-minimum-v2-isolated';

interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

export function signToken(payload: SessionPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (!payload?.userId || !payload?.exp) {
      return null;
    }
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(user: User): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: expiresAt,
  });

  try {
    const isHttps = process.env.NODE_ENV === 'production' || (process.env.APP_URL && process.env.APP_URL.startsWith('https')) || true;
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: Boolean(isHttps),
      sameSite: isHttps ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
  } catch (err) {
    // Cookie store may not be available in non-standard contexts
    console.warn('Could not set session cookie directly', err);
  }

  return token;
}

export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  } catch {
    // Ignored
  }
}

export async function getCurrentUser(request?: Request | NextRequest): Promise<User | null> {
  try {
    let token: string | undefined;

    // 1. Check passed request Authorization header
    if (request && 'headers' in request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    // 2. Check next/headers Authorization header
    if (!token) {
      try {
        const headerStore = await headers();
        const authHeader = headerStore.get('authorization');
        if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
          token = authHeader.substring(7).trim();
        }
      } catch {
        // Headers may be unavailable in some contexts
      }
    }

    // 3. Fallback to Cookie
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(SESSION_COOKIE)?.value;
      } catch {
        // Cookies may be unavailable
      }
    }

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    const user = db.getUserById(payload.userId) || db.getUserByEmail(payload.email);
    if (user) {
      if (user.isSuspended) {
        return null; // Deny suspended user
      }
      return user;
    }

    // Resilient fallback for verified signed session token
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.email.split('@')[0],
      passwordHash: '',
      role: (payload.role as 'admin' | 'user') || 'user',
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function requireUser(request?: Request | NextRequest): Promise<User> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireAdmin(request?: Request | NextRequest): Promise<User> {
  const user = await requireUser(request);
  if (user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

'use client';

export const AUTH_TOKEN_KEY = 'cmnty_auth_token';
export const AUTH_USER_KEY = 'cmnty_auth_user';

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): ClientUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredUserSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(AUTH_USER_KEY) ?? '';
  } catch {
    return '';
  }
}

export function getServerUserSnapshot(): string {
  return '';
}

const authListeners = new Set<() => void>();

function notifyAuthChange() {
  authListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // Ignore subscriber errors
    }
  });
}

export function subscribeAuth(callback: () => void): () => void {
  authListeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === AUTH_USER_KEY || e.key === AUTH_TOKEN_KEY || !e.key) {
      callback();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }
  return () => {
    authListeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

export function setAuthSession(token: string, user: ClientUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    notifyAuthChange();
  } catch (e) {
    console.warn('Failed to save auth to localStorage', e);
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    notifyAuthChange();
  } catch (e) {
    console.warn('Failed to clear auth from localStorage', e);
  }
}

/**
 * Universal auth-aware fetch wrapper for client components.
 * Automatically injects the Authorization Bearer header if token exists,
 * and maintains credentials: 'include'.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const enhancedInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
  };

  try {
    const response = await fetch(input, enhancedInit);

    // If token is invalid/expired (401), automatically clear stale local session
    if (response.status === 401 && typeof window !== 'undefined') {
      const urlStr = typeof input === 'string' ? input : input.toString();
      if (urlStr.startsWith('/api/') && !urlStr.includes('/api/auth/login')) {
        clearAuthSession();
      }
    }

    return response;
  } catch (netErr: any) {
    console.warn('Network request failed in authFetch:', input, netErr);
    // Return a safe synthetic 503 error response rather than crashing with unhandled rejection
    return new Response(
      JSON.stringify({
        error: 'Network connection issue. Please check your connection and retry.',
        code: 'NETWORK_ERROR',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

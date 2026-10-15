import { db } from '@/lib/db/store';
import { safeJson } from '@/lib/fetch-utils';

const VERCEL_API_BASE = 'https://api.vercel.com';

export interface VercelApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  searchParams?: Record<string, string | undefined>;
}

export interface VercelApiErrorResponse {
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

/**
 * Returns active Vercel configuration (Token, Team ID, Base Domain)
 * Checks server process.env first, then system settings in DB
 */
export function getVercelConfig() {
  const sys = db.getSystemConfig();
  const token = process.env.VERCEL_TOKEN || sys.vercelToken || '';
  const teamId = process.env.VERCEL_TEAM_ID || sys.vercelTeamId || '';
  const baseDomain = process.env.BASE_DOMAIN || sys.baseDomain || 'cmnty.biz.id';

  return {
    token,
    teamId,
    baseDomain,
    availableDomains: sys.availableDomains || [baseDomain],
    isConfigured: Boolean(token && token !== 'vercel_token_placeholder'),
  };
}

/**
 * Robust fetch wrapper for official Vercel REST API
 */
export async function vercelFetch<T = unknown>(
  endpoint: string,
  options: VercelApiOptions = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: string; code?: string }> {
  const config = getVercelConfig();

  if (!config.isConfigured) {
    return {
      ok: false,
      status: 401,
      error:
        'Vercel API Token is not configured. Please set VERCEL_TOKEN in server environment or configure it in the Admin Dashboard.',
      code: 'VERCEL_TOKEN_MISSING',
    };
  }

  // Construct URL with query params
  const url = new URL(`${VERCEL_API_BASE}${endpoint}`);
  if (config.teamId) {
    url.searchParams.set('teamId', config.teamId);
  }
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, v);
    });
  }

  const reqHeaders: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (options.body && !reqHeaders['Content-Type']) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers: reqHeaders,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
      cache: 'no-store',
    });

    // Handle 204 No Content
    if (res.status === 204) {
      return { ok: true, status: 204 };
    }

    const contentType = res.headers.get('content-type') || '';
    let responseData: any = null;

    if (contentType.includes('application/json')) {
      responseData = await safeJson(res);
    } else {
      const text = await res.text();
      if (text.includes('Rate exceeded')) {
        throw new Error('System is currently busy (Rate Limit Exceeded). Please try again in a few moments.');
      }
      responseData = { text };
    }

    if (!res.ok) {
      const errorMessage =
        responseData?.error?.message ||
        responseData?.message ||
        `Vercel API request failed with status ${res.status} (${res.statusText})`;
      const errorCode = responseData?.error?.code || `HTTP_${res.status}`;

      return {
        ok: false,
        status: res.status,
        data: responseData,
        error: errorMessage,
        code: errorCode,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: responseData as T,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      error: `Network failure connecting to Vercel API: ${err.message || String(err)}`,
      code: 'NETWORK_ERROR',
    };
  }
}

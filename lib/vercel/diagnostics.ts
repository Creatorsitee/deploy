import { vercelFetch, getVercelConfig } from './client';

export interface VercelDiagnosticResult {
  isConfigured: boolean;
  baseDomain: string;
  hasTeamId: boolean;
  authenticated: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
    slug: string;
  };
  latencyMs?: number;
  error?: string;
  dnsGuide: {
    type: string;
    host: string;
    target: string;
    note: string;
  }[];
}

/**
 * Runs diagnostics on the configured Vercel API credentials and Base Domain
 */
export async function testVercelDiagnostics(): Promise<VercelDiagnosticResult> {
  const config = getVercelConfig();

  const dnsGuide = [
    {
      type: 'CNAME',
      host: `*.${config.baseDomain}`,
      target: 'cname.vercel-dns.com',
      note: 'Wildcard CNAME allows all project subdomains (e.g. *.domain.com) to automatically route to Vercel edge.',
    },
    {
      type: 'A',
      host: config.baseDomain,
      target: '76.76.21.21',
      note: 'Root apex A record pointing to Vercel Anycast edge network for apex SSL and routing.',
    },
  ];

  if (!config.isConfigured) {
    return {
      isConfigured: false,
      baseDomain: config.baseDomain,
      hasTeamId: Boolean(config.teamId),
      authenticated: false,
      error: 'Vercel API token is missing or placeholder. Please provide a valid VERCEL_TOKEN.',
      dnsGuide,
    };
  }

  const startTime = Date.now();

  // Test credentials by requesting authenticated user info
  const userRes = await vercelFetch<{ user: { id: string; username: string; email: string; name: string } }>(
    '/v2/user'
  );

  const latencyMs = Date.now() - startTime;

  if (!userRes.ok) {
    return {
      isConfigured: true,
      baseDomain: config.baseDomain,
      hasTeamId: Boolean(config.teamId),
      authenticated: false,
      latencyMs,
      error: userRes.error || 'Authentication with Vercel API failed. Please check token permissions.',
      dnsGuide,
    };
  }

  let teamInfo: any = undefined;
  if (config.teamId) {
    const teamRes = await vercelFetch<{ id: string; name: string; slug: string }>(
      `/v2/teams/${encodeURIComponent(config.teamId)}`
    );
    if (teamRes.ok && teamRes.data) {
      teamInfo = teamRes.data;
    }
  }

  return {
    isConfigured: true,
    baseDomain: config.baseDomain,
    hasTeamId: Boolean(config.teamId),
    authenticated: true,
    user: userRes.data?.user,
    team: teamInfo,
    latencyMs,
    dnsGuide,
  };
}

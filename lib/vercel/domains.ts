import { vercelFetch } from './client';

export interface VercelDomainRecord {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
  createdAt: number;
}

export interface VercelDomainConfigResponse {
  configuredBy?: 'CNAME' | 'A' | 'http';
  nameservers?: string[];
  serviceType?: string;
  cnames?: string[];
  aValues?: string[];
  misconfigured: boolean;
  recommendedCNAME?: string;
  recommendedIPv4?: string;
}

/**
 * Attaches a custom domain or subdomain to a Vercel project
 */
export async function addVercelProjectDomain(projectIdOrName: string, domain: string) {
  return vercelFetch<VercelDomainRecord>(`/v9/projects/${encodeURIComponent(projectIdOrName)}/domains`, {
    method: 'POST',
    body: { name: domain },
  });
}

/**
 * Gets specific domain verification status for a project
 */
export async function getVercelProjectDomain(projectIdOrName: string, domain: string) {
  return vercelFetch<VercelDomainRecord>(
    `/v9/projects/${encodeURIComponent(projectIdOrName)}/domains/${encodeURIComponent(domain)}`
  );
}

/**
 * Checks DNS configuration and recommended records for a domain
 */
export async function getVercelDomainConfig(domain: string) {
  return vercelFetch<VercelDomainConfigResponse>(`/v6/domains/${encodeURIComponent(domain)}/config`);
}

/**
 * Requests Vercel to re-verify domain ownership and trigger SSL issuance
 */
export async function verifyVercelProjectDomain(projectIdOrName: string, domain: string) {
  return vercelFetch<{ verified: boolean }>(
    `/v9/projects/${encodeURIComponent(projectIdOrName)}/domains/${encodeURIComponent(domain)}/verify`,
    {
      method: 'POST',
    }
  );
}

/**
 * Removes a domain from a project
 */
export async function removeVercelProjectDomain(projectIdOrName: string, domain: string) {
  return vercelFetch(
    `/v9/projects/${encodeURIComponent(projectIdOrName)}/domains/${encodeURIComponent(domain)}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Lists all custom domains connected to a project on Vercel
 */
export async function listVercelProjectDomains(projectIdOrName: string) {
  return vercelFetch<{ domains: VercelDomainRecord[] }>(
    `/v9/projects/${encodeURIComponent(projectIdOrName)}/domains`
  );
}

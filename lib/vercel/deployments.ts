import { vercelFetch } from './client';

export interface VercelDeploymentFile {
  file: string;
  data: string;
  encoding?: 'base64' | 'utf-8';
}

export interface VercelDeploymentPayload {
  name: string;
  project?: string;
  files: VercelDeploymentFile[];
  projectSettings?: {
    framework?: string | null;
    buildCommand?: string | null;
    installCommand?: string | null;
    outputDirectory?: string | null;
    rootDirectory?: string | null;
  };
}

export interface VercelDeploymentResponse {
  id: string;
  url: string;
  name: string;
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  errorMessage?: string;
}

export interface VercelBuildEvent {
  type: string;
  created: number;
  payload?: {
    text?: string;
    info?: {
      type: string;
      message: string;
    };
  };
}

/**
 * Initiates an official Vercel deployment with direct file manifest
 */
export async function createVercelDeployment(payload: VercelDeploymentPayload) {
  return vercelFetch<VercelDeploymentResponse>('/v13/deployments', {
    method: 'POST',
    searchParams: { forceNew: '1' },
    body: payload,
  });
}

/**
 * Retrieves the status and metadata of a Vercel deployment
 */
export async function getVercelDeployment(id: string) {
  return vercelFetch<VercelDeploymentResponse>(`/v13/deployments/${encodeURIComponent(id)}`);
}

/**
 * Retrieves build events and logs from a deployment
 */
export async function getVercelDeploymentEvents(id: string) {
  const res = await vercelFetch<VercelBuildEvent[]>(`/v2/deployments/${encodeURIComponent(id)}/events`, {
    searchParams: { direction: 'forward', limit: '100' },
  });

  if (!res.ok || !Array.isArray(res.data)) {
    return { ok: false, error: res.error || 'Failed to fetch build logs', events: [] };
  }

  const logs = res.data
    .map((e) => e.payload?.text || e.payload?.info?.message || '')
    .filter(Boolean);

  return { ok: true, events: res.data, logs };
}

/**
 * Cancels an in-progress deployment
 */
export async function cancelVercelDeployment(id: string) {
  return vercelFetch(`/v12/deployments/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
  });
}

/**
 * Lists deployments from Vercel API for a given project or account
 */
export async function listVercelDeploymentsForProject(projectIdOrName: string, limit = 20) {
  return vercelFetch<{ deployments: VercelDeploymentResponse[] }>(
    `/v6/deployments?projectId=${encodeURIComponent(projectIdOrName)}&limit=${limit}`
  );
}

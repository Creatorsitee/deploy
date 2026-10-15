import { vercelFetch } from './client';
import { PLATFORM_PRESETS, getPlatformFrameworkId, PlatformFramework } from './frameworks';

export { PLATFORM_PRESETS, getPlatformFrameworkId };

/**
 * Fetches the list of all supported frameworks from Vercel API
 */
export async function listVercelFrameworks() {
  return vercelFetch<{ frameworks: PlatformFramework[] }>('/v1/frameworks');
}

export interface VercelProjectConfig {
  name: string;
  framework?: string | null;
  buildCommand?: string | null;
  installCommand?: string | null;
  outputDirectory?: string | null;
  rootDirectory?: string | null;
  environmentVariables?: { key: string; value: string; target: string[] }[];
}

export interface VercelProjectResponse {
  id: string;
  name: string;
  framework: string | null;
  accountId: string;
  createdAt: number;
  updatedAt: number;
  paused?: boolean;
  targets?: {
    production?: {
      id: string;
      url: string;
    };
  };
}

  /**
   * Creates or ensures a project exists on Vercel
   */
  export async function createVercelProject(config: VercelProjectConfig) {
    const vercelFramework = getPlatformFrameworkId(config.framework);

  const payload: Record<string, any> = {
    name: config.name,
    framework: vercelFramework,
  };

  if (config.buildCommand) payload.buildCommand = config.buildCommand;
  if (config.outputDirectory) payload.outputDirectory = config.outputDirectory;
  if (config.installCommand) payload.installCommand = config.installCommand;

  if (config.environmentVariables && config.environmentVariables.length > 0) {
    payload.environmentVariables = config.environmentVariables.map((env) => ({
      key: env.key,
      value: env.value,
      type: 'plain',
      target: env.target || ['production', 'preview', 'development'],
    }));
  }

  const res = await vercelFetch<VercelProjectResponse>('/v10/projects', {
    method: 'POST',
    body: payload,
  });

  // If project already exists (409 Conflict), fetch the existing project
  if (!res.ok && res.status === 409) {
    const existing = await getVercelProject(config.name);
    if (existing.ok && existing.data) {
      return { ok: true, status: 200, data: existing.data };
    }
  }

  return res;
}

export async function getVercelProject(nameOrId: string) {
  return vercelFetch<VercelProjectResponse>(`/v10/projects/${encodeURIComponent(nameOrId)}`);
}

export async function listVercelProjects() {
  return vercelFetch<{ projects: VercelProjectResponse[] }>('/v9/projects?limit=100');
}

export async function updateVercelProject(
  projectIdOrName: string,
  settings: {
    name?: string;
    buildCommand?: string | null;
    installCommand?: string | null;
    outputDirectory?: string | null;
    framework?: string | null;
    nodeVersion?: string | null;
  }
) {
  const payload: Record<string, any> = {};
  if (settings.name) payload.name = settings.name;
  if (settings.buildCommand !== undefined) payload.buildCommand = settings.buildCommand;
  if (settings.installCommand !== undefined) payload.installCommand = settings.installCommand;
  if (settings.outputDirectory !== undefined) payload.outputDirectory = settings.outputDirectory;
  if (settings.nodeVersion !== undefined) payload.nodeVersion = settings.nodeVersion;
  if (settings.framework !== undefined) {
    payload.framework = getPlatformFrameworkId(settings.framework);
  }

  return vercelFetch<VercelProjectResponse>(`/v9/projects/${encodeURIComponent(projectIdOrName)}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteVercelProject(nameOrId: string) {
  return vercelFetch(`/v10/projects/${encodeURIComponent(nameOrId)}`, {
    method: 'DELETE',
  });
}

/**
 * Pause / Suspend a project on Vercel
 */
export async function pauseVercelProject(nameOrId: string) {
  const res = await vercelFetch(`/v1/projects/${encodeURIComponent(nameOrId)}/pause`, {
    method: 'POST',
  });
  if (!res.ok) {
    return vercelFetch(`/v9/projects/${encodeURIComponent(nameOrId)}`, {
      method: 'PATCH',
      body: { paused: true },
    });
  }
  return res;
}

/**
 * Unpause / Reactivate a project on Vercel
 */
export async function unpauseVercelProject(nameOrId: string) {
  const res = await vercelFetch(`/v1/projects/${encodeURIComponent(nameOrId)}/unpause`, {
    method: 'POST',
  });
  if (!res.ok) {
    return vercelFetch(`/v9/projects/${encodeURIComponent(nameOrId)}`, {
      method: 'PATCH',
      body: { paused: false },
    });
  }
  return res;
}

/**
 * Add or update environment variables on an existing Vercel project
 */
export async function addVercelProjectEnv(
  projectIdOrName: string,
  env: { key: string; value: string; target: string[]; type?: string }
) {
  return vercelFetch(`/v10/projects/${encodeURIComponent(projectIdOrName)}/env`, {
    method: 'POST',
    body: {
      key: env.key,
      value: env.value,
      type: env.type || 'plain',
      target: env.target || ['production', 'preview', 'development'],
    },
  });
}

export async function addVercelProjectEnvs(
  projectIdOrName: string,
  envs: { key: string; value: string; target: string[]; type?: string }[]
) {
  return vercelFetch(`/v10/projects/${encodeURIComponent(projectIdOrName)}/env`, {
    method: 'POST',
    body: envs.map((e) => ({
      key: e.key,
      value: e.value,
      type: e.type || 'plain',
      target: e.target || ['production', 'preview', 'development'],
    })),
  });
}

export async function getVercelProjectEnvs(projectIdOrName: string) {
  return vercelFetch<{ envs: Array<{ id: string; key: string; value: string; target: string[] }> }>(
    `/v9/projects/${encodeURIComponent(projectIdOrName)}/env`
  );
}

export async function deleteVercelProjectEnv(projectIdOrName: string, envId: string) {
  return vercelFetch(
    `/v9/projects/${encodeURIComponent(projectIdOrName)}/env/${encodeURIComponent(envId)}`,
    {
      method: 'DELETE',
    }
  );
}


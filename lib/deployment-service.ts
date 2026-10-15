import JSZip from 'jszip';
import { db } from '@/lib/db/store';
import { Project, Deployment, DomainRecord, FrameworkType } from '@/lib/types';
import { getVercelConfig } from '@/lib/vercel/client';
import { createVercelProject } from '@/lib/vercel/projects';
import { createVercelDeployment, getVercelDeployment, getVercelDeploymentEvents } from '@/lib/vercel/deployments';
import { addVercelProjectDomain, getVercelDomainConfig } from '@/lib/vercel/domains';
import { getPlatformFrameworkId } from '@/lib/vercel/frameworks';

export interface ExtractedFile {
  file: string;
  data: string;
  encoding: 'utf-8' | 'base64';
  size: number;
}

/**
 * Safely extracts a ZIP buffer preventing path traversal and malicious entries
 */
export async function extractZipSafely(buffer: ArrayBuffer | Buffer): Promise<ExtractedFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(buffer);

  const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB max total uncompressed
  const MAX_FILES = 3000;
  let totalSize = 0;

  const entries = Object.keys(loadedZip.files);

  if (entries.length > MAX_FILES) {
    throw new Error(`ZIP archive exceeds maximum file count limit (${MAX_FILES})`);
  }

  const rawEntries: { path: string; uint8: Uint8Array; isText: boolean }[] = [];

  for (const relativePath of entries) {
    const zipEntry = loadedZip.files[relativePath];
    if (zipEntry.dir) continue;

    // Security check: Path traversal protection
    const normalized = relativePath.replace(/\\/g, '/');
    if (
      normalized.startsWith('/') ||
      normalized.includes('../') ||
      normalized.includes('/../') ||
      normalized === '..' ||
      normalized.startsWith('./../')
    ) {
      continue;
    }

    // Skip git, mac os metadata, and node_modules
    if (
      normalized.startsWith('.git/') ||
      normalized.includes('/.git/') ||
      normalized.startsWith('__MACOSX/') ||
      normalized.includes('/__MACOSX/') ||
      normalized.includes('/.DS_Store') ||
      normalized === '.DS_Store' ||
      normalized.startsWith('node_modules/') ||
      normalized.includes('/node_modules/')
    ) {
      continue;
    }

    const uint8 = await zipEntry.async('uint8array');
    totalSize += uint8.length;

    if (totalSize > MAX_TOTAL_SIZE) {
      throw new Error(`ZIP archive exceeds maximum total uncompressed size (50MB)`);
    }

    const isText = /\.(html|htm|css|js|jsx|ts|tsx|json|md|txt|svg|xml|yaml|yml|env|env\..*)$/i.test(normalized);
    rawEntries.push({ path: normalized, uint8, isText });
  }

  if (rawEntries.length === 0) {
    throw new Error('ZIP archive is empty or contains no valid files');
  }

  // Detect single common root folder wrapper (e.g. 'my-app/index.html' or 'repo-main/package.json')
  let commonPrefix = '';
  const firstPath = rawEntries[0].path;
  if (firstPath.includes('/')) {
    const candidatePrefix = firstPath.substring(0, firstPath.indexOf('/') + 1);
    const allShare = rawEntries.every((f) => f.path.startsWith(candidatePrefix));
    if (allShare) {
      commonPrefix = candidatePrefix;
    }
  }

  const files: ExtractedFile[] = [];
  for (const entry of rawEntries) {
    const cleanPath = commonPrefix ? entry.path.substring(commonPrefix.length) : entry.path;
    if (!cleanPath) continue;

    if (entry.isText) {
      const text = new TextDecoder('utf-8').decode(entry.uint8);
      files.push({
        file: cleanPath,
        data: text,
        encoding: 'utf-8',
        size: entry.uint8.length,
      });
    } else {
      const base64 = Buffer.from(entry.uint8).toString('base64');
      files.push({
        file: cleanPath,
        data: base64,
        encoding: 'base64',
        size: entry.uint8.length,
      });
    }
  }

  if (files.length === 0) {
    throw new Error('ZIP archive contains no valid files after processing');
  }

  return files;
}

/**
 * Automatically inspects files to detect framework and presets
 */
export function detectFramework(files: { file: string; data: string }[]): {
  framework: FrameworkType;
  buildCommand: string;
  installCommand: string;
  outputDirectory: string;
} {
  const pkgFile = files.find((f) => f.file === 'package.json' || f.file.endsWith('/package.json'));

  if (pkgFile) {
    try {
      const pkg = JSON.parse(pkgFile.data);
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      if (allDeps['next']) {
        return {
          framework: 'nextjs',
          buildCommand: 'npm run build',
          installCommand: 'npm install',
          outputDirectory: '.next',
        };
      }
      if (allDeps['astro']) {
        return {
          framework: 'astro',
          buildCommand: 'npm run build',
          installCommand: 'npm install',
          outputDirectory: 'dist',
        };
      }
      if (allDeps['nuxt']) {
        return {
          framework: 'nuxt',
          buildCommand: 'npm run build',
          installCommand: 'npm install',
          outputDirectory: '.output/public',
        };
      }
      if (allDeps['vite']) {
        return {
          framework: 'vite',
          buildCommand: 'npm run build',
          installCommand: 'npm install',
          outputDirectory: 'dist',
        };
      }
      if (allDeps['react-scripts']) {
        return {
          framework: 'react',
          buildCommand: 'npm run build',
          installCommand: 'npm install',
          outputDirectory: 'build',
        };
      }
      if (allDeps['vue']) {
        return {
          framework: 'vue',
          buildCommand: 'npm run build',
          installCommand: 'npm install',
          outputDirectory: 'dist',
        };
      }

      return {
        framework: 'other',
        buildCommand: pkg.scripts?.build ? 'npm run build' : '',
        installCommand: 'npm install',
        outputDirectory: 'dist',
      };
    } catch {
      // Fall through
    }
  }

  // Check for static HTML
  const hasIndexHtml = files.some((f) => f.file === 'index.html' || f.file.endsWith('/index.html'));
  if (hasIndexHtml) {
    return {
      framework: 'static',
      buildCommand: '',
      installCommand: '',
      outputDirectory: './',
    };
  }

  return {
    framework: 'static',
    buildCommand: '',
    installCommand: '',
    outputDirectory: './',
  };
}

/**
 * Orchestrates full project deployment
 */
export async function executeDeployment(params: {
  project: Project;
  userId: string;
  sourceType: 'zip' | 'template' | 'git';
  sourceName?: string;
  files: { file: string; data: string; encoding?: 'utf-8' | 'base64' }[];
  commitMessage?: string;
}): Promise<Deployment> {
  const { project, userId, sourceType, sourceName, files, commitMessage } = params;
  const vercelConfig = getVercelConfig();
  const startTime = Date.now();

  const cmntySubdomain = project.subdomain || `${project.slug}.${project.selectedDomain || vercelConfig.baseDomain}`;
  const productionUrl = `https://${cmntySubdomain}`;

  // Create initial deployment record in DB
  const deploymentId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const initialDeployment: Deployment = {
    id: deploymentId,
    projectId: project.id,
    userId,
    status: 'BUILDING',
    url: '',
    productionUrl,
    sourceType,
    sourceName: sourceName || 'Direct Upload',
    commitMessage: commitMessage || 'Deploy latest files',
    logs: [
      `[${new Date().toISOString()}] Initiating deployment pipeline for project "${project.name}" (${project.slug})`,
      `[${new Date().toISOString()}] Validating ${files.length} project source files...`,
      `[${new Date().toISOString()}] Framework configuration: ${project.framework}`,
    ],
    createdAt: new Date().toISOString(),
  };

  db.createDeployment(initialDeployment);

  // If Vercel API is not configured, deployment fails immediately. Simulated Deploy has been completely removed.
  if (!vercelConfig.isConfigured) {
    const duration = Date.now() - startTime;
    db.appendDeploymentLog(deploymentId, `[${new Date().toISOString()}] [DEPLOYMENT ERROR] Cloud Engine API Token is not configured. Please set a valid Token in the Admin Panel.`);
    
    const failedDeployment = db.updateDeployment(deploymentId, {
      status: 'ERROR',
      errorMessage: 'Cloud Engine API Token is not configured. Please set a valid Token in the Admin Panel.',
      completedAt: new Date().toISOString(),
      durationMs: duration,
    });

    db.addAuditLog({
      userId,
      userEmail: 'system',
      action: 'DEPLOYMENT_FAILURE',
      metadata: {
        projectId: project.id,
        deploymentId,
        error: 'Vercel API Token is not configured',
      },
    });

    return failedDeployment!;
  }

  try {
    db.appendDeploymentLog(deploymentId, `[${new Date().toISOString()}] Synchronizing Project State "${project.slug}"...`);

    // Fetch existing project environment variables
    const envVars = db.getEnvVarsByProjectId(project.id);

    // 1. Create or ensure Vercel Project
    const projRes = await createVercelProject({
      name: project.slug,
      framework: project.framework,
      buildCommand: project.buildCommand || null,
      outputDirectory: project.outputDirectory || null,
      installCommand: project.installCommand || null,
      environmentVariables: envVars.map((e) => ({
        key: e.key,
        value: e.value,
        target: e.target,
      })),
    });

    if (!projRes.ok) {
      throw new Error(`Failed to initialize Vercel project: ${projRes.error}`);
    }

    const vercelProjectId = projRes.data?.id;
    if (vercelProjectId && project.vercelProjectId !== vercelProjectId) {
      db.updateProject(project.id, { vercelProjectId });
    }

    db.appendDeploymentLog(
      deploymentId,
      `[${new Date().toISOString()}] Infrastructure state synced. Transmitting ${files.length} files to Deployments API...`
    );

    // 2. Dispatch deployment to Cloud API
    const deployRes = await createVercelDeployment({
      name: project.slug,
      project: vercelProjectId || project.slug,
      files: files.map((f) => ({
        file: f.file,
        data: f.data,
        encoding: f.encoding || 'utf-8',
      })),
      projectSettings: {
        framework: getPlatformFrameworkId(project.framework),
        buildCommand: project.buildCommand || null,
        outputDirectory: project.outputDirectory || null,
      },
    });

    if (!deployRes.ok || !deployRes.data) {
      throw new Error(`Vercel deployment failed: ${deployRes.error}`);
    }

    const vercelDeployment = deployRes.data;
    const vercelUrl = `https://${vercelDeployment.url}`;

    db.appendDeploymentLog(
      deploymentId,
      `[${new Date().toISOString()}] Deployment Pipeline Created (ID: ${vercelDeployment.id}). URL: ${vercelUrl}`
    );
    db.appendDeploymentLog(
      deploymentId,
      `[${new Date().toISOString()}] Attaching custom subdomain: ${cmntySubdomain}...`
    );

    // 3. Attach custom subdomain via infrastructure edge API
    const domainRes = await addVercelProjectDomain(vercelProjectId || project.slug, cmntySubdomain);
    let domainVerified = false;

    if (domainRes.ok) {
      domainVerified = Boolean(domainRes.data?.verified);
      db.appendDeploymentLog(
        deploymentId,
        `[${new Date().toISOString()}] Subdomain ${cmntySubdomain} registered on Edge. Verified: ${domainVerified}`
      );
    } else {
      db.appendDeploymentLog(
        deploymentId,
        `[${new Date().toISOString()}] Subdomain notice: ${domainRes.error || 'Already registered or pending DNS propagation'}`
      );
    }

    // 4. Record or update domain in DB
    const existingDomain = db.getDomainByName(cmntySubdomain);
    if (!existingDomain) {
      const domainRecord: DomainRecord = {
        id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId: project.id,
        userId,
        domain: cmntySubdomain,
        isSubdomain: true,
        verified: domainVerified,
        sslStatus: domainVerified ? 'ACTIVE' : 'PROVISIONING',
        dnsRecords: [
          {
            type: 'CNAME',
            name: project.slug,
            value: 'cname.vercel-dns.com',
            valid: domainVerified,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.createDomain(domainRecord);
    } else {
      db.updateDomain(existingDomain.id, {
        verified: domainVerified,
        sslStatus: domainVerified ? 'ACTIVE' : 'PROVISIONING',
      });
    }

    const duration = Date.now() - startTime;
    db.appendDeploymentLog(
      deploymentId,
      `[${new Date().toISOString()}] Deployment completed successfully in ${(duration / 1000).toFixed(1)}s! Production URL: ${productionUrl}`
    );

    // 5. Update deployment to READY
    const completedDeployment = db.updateDeployment(deploymentId, {
      status: 'READY',
      vercelDeploymentId: vercelDeployment.id,
      url: vercelUrl,
      productionUrl,
      durationMs: duration,
      completedAt: new Date().toISOString(),
    });

    db.addAuditLog({
      userId,
      userEmail: 'user',
      action: 'DEPLOYMENT_SUCCESS',
      metadata: {
        projectId: project.id,
        deploymentId,
        vercelDeploymentId: vercelDeployment.id,
        url: productionUrl,
      },
    });

    return completedDeployment!;
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    db.appendDeploymentLog(deploymentId, `[${new Date().toISOString()}] [DEPLOYMENT ERROR] ${errorMsg}`);
    const failed = db.updateDeployment(deploymentId, {
      status: 'ERROR',
      errorMessage: errorMsg,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    });
    return failed!;
  }
}

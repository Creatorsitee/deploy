import JSZip from 'jszip';

import { PlatformFramework } from './vercel/frameworks';

export interface DetectedEnvVar {
  key: string;
  value: string;
  target?: ('production' | 'preview' | 'development')[];
  source?: string;
  description?: string;
}

export interface EnvDetectionResult {
  variables: DetectedEnvVar[];
  sourceFound?: string;
  detectedFramework?: string;
  summary: string;
}

/**
 * Parses raw text from a .env / .env.example / .env.local file into key-value pairs.
 */
export function parseEnvString(content: string, sourceName: string = 'env_file'): DetectedEnvVar[] {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  const results: DetectedEnvVar[] = [];
  const seenKeys = new Set<string>();

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    // Remove 'export ' prefix if present (common in .env.sh)
    if (line.startsWith('export ')) {
      line = line.substring(7).trim();
    }

    const equalIndex = line.indexOf('=');
    if (equalIndex <= 0) continue;

    const rawKey = line.substring(0, equalIndex).trim();
    let rawVal = line.substring(equalIndex + 1).trim();

    // Clean key: uppercase standard identifier
    const cleanKey = rawKey.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!cleanKey || seenKeys.has(cleanKey)) continue;

    // Remove inline comments if not inside quotes
    if (!rawVal.startsWith('"') && !rawVal.startsWith("'")) {
      const hashIdx = rawVal.indexOf(' #');
      if (hashIdx !== -1) {
        rawVal = rawVal.substring(0, hashIdx).trim();
      }
    }

    // Strip surrounding quotes
    if (
      (rawVal.startsWith('"') && rawVal.endsWith('"')) ||
      (rawVal.startsWith("'") && rawVal.endsWith("'")) ||
      (rawVal.startsWith('`') && rawVal.endsWith('`'))
    ) {
      rawVal = rawVal.slice(1, -1);
    }

    seenKeys.add(cleanKey);
    results.push({
      key: cleanKey,
      value: rawVal,
      target: ['production', 'preview', 'development'],
      source: sourceName,
    });
  }

  return results;
}

/**
 * Serializes an array of environment variables back to standard .env string format.
 */
export function serializeEnv(vars: { key: string; value: string }[]): string {
  return vars
    .map((v) => {
      const cleanKey = v.key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      const val = v.value ?? '';
      const needsQuotes = val.includes(' ') || val.includes('\n') || val.includes('#') || val.includes('"');
      const escaped = needsQuotes ? `"${val.replace(/"/g, '\\"')}"` : val;
      return `${cleanKey}=${escaped}`;
    })
    .join('\n');
}

/**
 * Auto-detects environment variables and project structure from a zip file archive.
 */
export async function detectEnvFromZip(file: File, frameworks?: PlatformFramework[]): Promise<EnvDetectionResult> {
  try {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);

    const fileList: Array<{ path: string; content?: string }> = [];
    for (const [path, entry] of Object.entries(zipContent.files)) {
      if (entry.dir) continue;
      // We only read small files for detection to save memory
      if (entry.name.endsWith('package.json') || entry.name.endsWith('index.html')) {
        fileList.push({ path, content: await entry.async('text') });
      } else {
        fileList.push({ path });
      }
    }

    const envFileCandidates = [
      '.env.example',
      '.env.sample',
      'env.example',
      'example.env',
      '.env.production',
      '.env.local',
      '.env',
      '.env.template',
      '.env.defaults',
    ];

    // Search for actual .env / example files inside the zip
    for (const candidate of envFileCandidates) {
      for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
        if (zipEntry.dir) continue;
        const normalized = relativePath.toLowerCase().replace(/\\/g, '/');
        const filename = normalized.split('/').pop() || '';

        if (filename === candidate || filename.endsWith(`/${candidate}`)) {
          const text = await zipEntry.async('text');
          const parsed = parseEnvString(text, relativePath);
          if (parsed.length > 0) {
            return {
              variables: parsed,
              sourceFound: relativePath,
              summary: `Found ${parsed.length} variable(s) from "${relativePath}"`,
            };
          }
        }
      }
    }

    // Official platform rules detection
    if (frameworks && frameworks.length > 0) {
      const { detectFrameworkFromPlatformRules } = await import('./vercel/frameworks');
      const vFw = detectFrameworkFromPlatformRules(frameworks, fileList);
      if (vFw) {
        return {
          variables: detectRecommendedEnvForFramework(vFw),
          detectedFramework: vFw,
          summary: `Detected ${vFw.toUpperCase()} via platform rules.`,
        };
      }
    }

    // Inspect package.json if present (Legacy/Fallback)
    for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
      if (zipEntry.dir) continue;
      const normalized = relativePath.toLowerCase().replace(/\\/g, '/');
      if (normalized.endsWith('package.json')) {
        try {
          const text = await zipEntry.async('text');
          const pkg = JSON.parse(text);
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };

          let detectedFw = 'node';
          const detectedVars: DetectedEnvVar[] = [
            { key: 'NODE_ENV', value: 'production', target: ['production', 'preview', 'development'], source: 'package.json' },
            { key: 'PORT', value: '3000', target: ['production', 'preview', 'development'], source: 'package.json' },
          ];

          if (deps['next']) {
            detectedFw = 'nextjs';
            detectedVars.unshift({
              key: 'NEXT_PUBLIC_APP_URL',
              value: 'https://mysite.cmnty.biz.id',
              target: ['production', 'preview', 'development'],
              source: 'Next.js Preset',
            });
          } else if (deps['vite']) {
            detectedFw = 'vite';
            detectedVars.unshift({
              key: 'VITE_APP_TITLE',
              value: pkg.name || 'CMNTY App',
              target: ['production', 'preview', 'development'],
              source: 'Vite Preset',
            });
          } else if (deps['astro']) {
            detectedFw = 'astro';
          } else if (deps['nuxt'] || deps['nuxt3']) {
            detectedFw = 'nuxt';
          }

          return {
            variables: detectedVars,
            detectedFramework: detectedFw,
            sourceFound: relativePath,
            summary: `Detected ${detectedFw} from "${relativePath}"`,
          };
        } catch {
          // Ignore json parse error in zip
        }
      }
    }

    // Fallback: no specific environment needed for generic static files
    return {
      variables: [],
      summary: 'No environment variables required for standard static site.',
    };
  } catch (err: any) {
    return {
      variables: [],
      summary: err?.message || 'Failed to scan archive for environment configuration.',
    };
  }
}

/**
 * Attempts to detect framework from a public GitHub URL by fetching package.json
 */
export async function detectFrameworkFromGithub(url: string, frameworks?: PlatformFramework[]): Promise<string | null> {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '');
    // Convert https://github.com/user/repo to raw.githubusercontent.com/user/repo/main/package.json
    let rawBaseUrl = cleanUrl
      .replace('github.com', 'raw.githubusercontent.com')
      .replace(/\/blob\/[^\/]+/, '');

    const branchCandidates = ['main', 'master', 'dev'];
    for (const branch of branchCandidates) {
      try {
        const target = `${rawBaseUrl}/${branch}/package.json`;
        const res = await fetch(target);
        if (res.ok) {
          const pkg = await res.json();
          const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
          
          // Use provided Vercel frameworks list for more accurate detection if available
          if (frameworks && frameworks.length > 0) {
            for (const fw of frameworks) {
              if (fw.detectors?.some) {
                const match = fw.detectors.some.some(d => 
                  d.path === 'package.json' && d.matchContent && new RegExp(d.matchContent).test(JSON.stringify(pkg))
                );
                if (match) return fw.slug;
              }
            }
          }

          if (deps['next']) return 'nextjs';
          if (deps['vite']) return 'vite';
          if (deps['astro']) return 'astro';
          if (deps['nuxt'] || deps['nuxt3']) return 'nuxt';
          if (deps['@sveltejs/kit']) return 'svelte';
          if (deps['react-scripts']) return 'react';
          if (deps['vue']) return 'vue';
          return 'other';
        }
      } catch {
        continue;
      }
    }
    return 'static';
  } catch {
    return null;
  }
}

/**
 * Returns framework-recommended default environment variables.
 */
export function detectRecommendedEnvForFramework(
  framework: string,
  projectName?: string,
  domain?: string
): DetectedEnvVar[] {
  const fw = (framework || '').toLowerCase();
  const baseAppUrl = domain ? `https://${domain}` : 'https://mysite.cmnty.biz.id';
  const name = projectName || 'CMNTY App';

  switch (fw) {
    case 'nextjs':
    case 'next':
      return [
        { key: 'NEXT_PUBLIC_APP_URL', value: baseAppUrl, target: ['production', 'preview', 'development'] },
        { key: 'NEXT_PUBLIC_APP_NAME', value: name, target: ['production', 'preview', 'development'] },
        { key: 'NODE_ENV', value: 'production', target: ['production', 'preview', 'development'] },
      ];
    case 'vite':
    case 'react':
      return [
        { key: 'VITE_APP_TITLE', value: name, target: ['production', 'preview', 'development'] },
        { key: 'VITE_API_URL', value: `${baseAppUrl}/api`, target: ['production', 'preview', 'development'] },
      ];
    case 'nuxt':
    case 'vue':
      return [
        { key: 'NUXT_PUBLIC_SITE_URL', value: baseAppUrl, target: ['production', 'preview', 'development'] },
        { key: 'NODE_ENV', value: 'production', target: ['production', 'preview', 'development'] },
      ];
    case 'astro':
      return [
        { key: 'PUBLIC_SITE_URL', value: baseAppUrl, target: ['production', 'preview', 'development'] },
        { key: 'NODE_ENV', value: 'production', target: ['production', 'preview', 'development'] },
      ];
    case 'static':
      return [];
    default:
      return [
        { key: 'NODE_ENV', value: 'production', target: ['production', 'preview', 'development'] },
        { key: 'PORT', value: '3000', target: ['production', 'preview', 'development'] },
      ];
  }
}

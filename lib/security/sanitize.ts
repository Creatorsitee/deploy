/**
 * Set of reserved subdomains and path names that cannot be used for user projects
 */
export const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'administrator',
  'api',
  'app',
  'auth',
  'cdn',
  'dashboard',
  'dev',
  'docs',
  'login',
  'logout',
  'mail',
  'manage',
  'null',
  'oauth',
  'payment',
  'portal',
  'register',
  'root',
  'security',
  'signin',
  'signup',
  'ssl',
  'status',
  'system',
  'undefined',
  'v1',
  'v2',
  'webhook',
  'www',
]);

/**
 * Validates and cleans a proposed subdomain slug.
 */
export function validateSubdomainSlug(slug: string): { valid: boolean; error?: string; cleanSlug: string } {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Subdomain is required', cleanSlug: '' };
  }

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (cleanSlug.length < 3) {
    return { valid: false, error: 'Subdomain must be at least 3 characters', cleanSlug };
  }

  if (cleanSlug.length > 63) {
    return { valid: false, error: 'Subdomain cannot exceed 63 characters', cleanSlug };
  }

  if (cleanSlug.startsWith('-') || cleanSlug.endsWith('-')) {
    return { valid: false, error: 'Subdomain cannot start or end with a hyphen', cleanSlug };
  }

  if (RESERVED_SUBDOMAINS.has(cleanSlug)) {
    return { valid: false, error: `"${cleanSlug}" is a reserved system name`, cleanSlug };
  }

  return { valid: true, cleanSlug };
}

/**
 * Sanitizes generic user text against XSS injection
 */
export function sanitizeText(input: string, maxLen: number = 100): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, maxLen);
}

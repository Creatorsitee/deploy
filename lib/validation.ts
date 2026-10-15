/**
 * List of reserved subdomains and patterns that are not allowed to be used
 * for customer projects to prevent phishing, system confusion, or conflicts.
 */
export const RESERVED_SUBDOMAINS = [
  'api',
  'rest',
  'www',
  'admin',
  'dashboard',
  'mail',
  'webmail',
  'smtp',
  'pop',
  'imap',
  'ns',
  'ns1',
  'ns2',
  'ns3',
  'ns4',
  'status',
  'support',
  'help',
  'billing',
  'legal',
  'privacy',
  'terms',
  'auth',
  'login',
  'register',
  'account',
  'cdn',
  'assets',
  'static',
  'cloud',
  'manage',
  'sys',
  'system',
  'root',
  'internal',
  'office',
  'mysql',
  'db',
  'database',
  'localhost',
  'dev',
  'prod',
  'test',
  'stage',
  'staging',
  'demo',
  'example',
  'autodiscover',
  'm',
  'mobile',
  'app',
  'portal',
  'webhook',
  'metrics',
  'monitor',
  'secure',
  'vpn',
  'remote',
  'server',
  'git',
  'svn',
  'hg',
  'cvs',
  'docker',
  'k8s',
  'kube',
];

/**
 * Validates if a subdomain slug is reserved or matches a forbidden pattern.
 * Checks for exact match, or if it starts/ends with a reserved word followed/preceded by a hyphen.
 * We also block string containment for extremely sensitive words.
 */
export function isSubdomainReserved(slug: string): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase().trim();

  // 1. Extreme sensitivity (block any containment)
  const extremeBlock = ['vercel', 'cmnty', 'google', 'admin', 'system', 'root', 'tesapi', 'api-test', 'internal-api'];
  if (extremeBlock.some(b => s.includes(b))) return true;

  // 2. Exact or Prefix/Suffix with hyphen for general reserved words
  const additionalReserved = ['tesapi', 'testapi', 'apites', 'api-test'];
  if (additionalReserved.includes(s)) return true;
  return RESERVED_SUBDOMAINS.some((reserved) => {
    return (
      s === reserved || 
      s.startsWith(`${reserved}-`) || 
      s.endsWith(`-${reserved}`) ||
      // Also block if it's just the reserved word followed by anything (stricter "awalan")
      s.startsWith(reserved) && s.length > reserved.length && !s.includes('-') && reserved.length > 2
    );
  });
}

/**
 * Validates if a subdomain slug is syntactically valid.
 */
export function isValidSubdomain(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 63) return false;
  // Alphanumeric and hyphens, cannot start or end with hyphen
  const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;
  return pattern.test(slug);
}

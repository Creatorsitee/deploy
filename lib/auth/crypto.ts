import crypto from 'crypto';

/**
 * Hashes a plaintext password using standard PBKDF2-HMAC-SHA256 with 100,000 iterations
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 hash or pre-seeded hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split(':');
    if (parts[0] !== 'pbkdf2') {
      return false;
    }
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];

    // Check against salt with specified iterations
    const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
    
    // Constant time comparison
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch (err) {
    console.error('Password verification error', err);
    return false;
  }
}

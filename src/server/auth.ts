import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// Password hashing with PBKDF2-SHA256. Stored format: `${saltHex}:${hashHex}`.
// SEC C2: only this hash is ever persisted — never a plaintext password.

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

const pbkdf2Async = promisify(pbkdf2);

async function derive(password: string, salt: Buffer): Promise<Buffer> {
  return pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(hashHex, 'hex');
  } catch {
    return false;
  }
  const computed = await derive(password, Buffer.from(saltHex, 'hex'));
  // Length guard before timingSafeEqual, which throws on length mismatch.
  if (computed.length !== expected.length) return false;
  return timingSafeEqual(computed, expected);
}

// Password hashing using Web Crypto API (PBKDF2)
// Works in Netlify Functions, Deno, Cloudflare Workers, Node 18+

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const ALGORITHM = 'PBKDF2';
const HASH = 'SHA-256';

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const hashBuffer = await crypto.subtle.exportKey('raw', key);
  const hashHex = bufToHex(new Uint8Array(hashBuffer));
  const saltHex = bufToHex(salt);
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = hexToBuf(saltHex);
  const key = await deriveKey(password, salt);
  const hashBuffer = await crypto.subtle.exportKey('raw', key);
  const computedHex = bufToHex(new Uint8Array(hashBuffer));
  return computedHex === hashHex;
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), ALGORITHM, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: ALGORITHM, salt, iterations: ITERATIONS, hash: HASH },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH * 8 },
    true,
    ['encrypt']
  );
}

function bufToHex(buf) {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

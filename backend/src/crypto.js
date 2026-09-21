// Random identifiers, credentials and keyed digests (SEC-02). Only digests reach the database.

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // 32 symbols, no I L O U
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789'; // 30 symbols, no 0/O/1/I/L

function randomBytes(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

function toHex(buf) {
  return Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, '0')).join('');
}

function base64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Opaque row ids: prefix + 20 Crockford symbols (100 bits).
export function newId(prefix) {
  const bytes = randomBytes(20);
  let s = '';
  for (const b of bytes) s += CROCKFORD[b % 32];
  return `${prefix}_${s}`;
}

// Link token: 32 random bytes = 256 bits, base64url (43 chars). Exceeds the 128-bit minimum.
export function newLinkToken() {
  return base64url(randomBytes(32));
}

// Fallback code for manual entry: 12 symbols from a 30-symbol alphabet
// (30^12 ~= 5.3e17, about 59 bits), shown as XXXX-XXXX-XXXX. Rate limited on entry.
export function newFallbackCode() {
  const bytes = randomBytes(12);
  let s = '';
  for (const b of bytes) s += CODE_ALPHABET[b % 30];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

// Response reference shown to guests: RN- + 8 symbols.
export function newReference() {
  const bytes = randomBytes(8);
  let s = '';
  for (const b of bytes) s += CODE_ALPHABET[b % 30];
  return `RN-${s}`;
}

// Session token: 32 random bytes, base64url.
export function newSessionToken() {
  return base64url(randomBytes(32));
}

// Normalise what a guest typed or pasted: trim, drop separators/spaces. Link tokens (base64url)
// are case-sensitive, so case is preserved; fallback codes are upper-cased by callers.
export function normaliseCredential(input) {
  const s = String(input || '').trim();
  if (/^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(s)) {
    return s.replace(/-/g, '').toUpperCase();
  }
  return s.replace(/\s+/g, '');
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export async function hmacHex(secret, value) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return toHex(sig);
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return toHex(digest);
}

export function credentialDigest(pepper, credential) {
  return hmacHex(pepper, `credential:${normaliseCredential(credential)}`);
}

export function sessionDigest(secret, token) {
  return hmacHex(secret, `session:${token}`);
}

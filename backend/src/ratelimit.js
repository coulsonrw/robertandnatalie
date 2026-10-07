import { HttpError, clientIp } from './http.js';
import { one } from './db.js';
import { sha256Hex } from './crypto.js';

export async function bump(db, bucket, windowSeconds) {
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000).toISOString();
  const row = await one(
    db,
    `INSERT INTO rate_limit (bucket, window_start, count) VALUES (?, ?, 1)
     ON CONFLICT (bucket, window_start) DO UPDATE SET count = count + 1
     RETURNING count`,
    bucket,
    windowStart,
  );
  return row ? row.count : 1;
}

export async function hashedIp(request) {
  return (await sha256Hex(`ip:${clientIp(request)}`)).slice(0, 32);
}

export async function enforceIpRateLimit(db, cfg, request, bucketPrefix, limit) {
  const ipHash = await hashedIp(request);
  const count = await bump(db, `${bucketPrefix}:${ipHash}`, cfg.rateLimit.windowSeconds);
  if (count > limit) {
    throw new HttpError(429, 'rate_limited', 'Too many attempts. Please wait a few minutes and try again.');
  }
  return { ipHash, count };
}

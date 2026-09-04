import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'cab_admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(secret: string, now: number = Date.now()): string {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ expiresAt })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  now: number = Date.now()
): boolean {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return false;

  let parsed: { expiresAt?: unknown };
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return false;
  }

  return typeof parsed.expiresAt === 'number' && now < parsed.expiresAt;
}

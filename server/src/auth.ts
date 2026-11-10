import crypto from 'node:crypto';
import { db } from './db.js';

export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 64);
  const real = Buffer.from(hash, 'hex');
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

const DAY = 24 * 3600 * 1000;
export const SESSION_MS = 30 * DAY;

export function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)').run(token, userId, Date.now() + SESSION_MS);
  return token;
}

export function userFromToken(token?: string) {
  if (!token) return null;
  const r = db
    .prepare('SELECT u.id, u.name, s.expires FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?')
    .get(token) as { id: number; name: string; expires: number } | undefined;
  if (!r) return null;
  if (r.expires < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token=?').run(token);
    return null;
  }
  return { id: r.id, name: r.name };
}

export function destroySession(token?: string) {
  if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(token);
}

// pembatas percobaan login sederhana (per IP)
const attempts = new Map<string, { n: number; reset: number }>();
export function tooManyAttempts(ip: string) {
  const a = attempts.get(ip);
  if (!a || a.reset < Date.now()) return false;
  return a.n >= 8;
}
export function recordFail(ip: string) {
  const a = attempts.get(ip);
  if (!a || a.reset < Date.now()) attempts.set(ip, { n: 1, reset: Date.now() + 15 * 60 * 1000 });
  else a.n++;
}
export function clearFails(ip: string) {
  attempts.delete(ip);
}

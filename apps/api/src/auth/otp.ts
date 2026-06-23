// Citizen OTP — codes + rate limits in Redis. Dev returns the code in the
// response (no SMS); production sends via a PH SMS aggregator and does NOT return it.
import { redis } from '../redis.js';
import { env } from '../env.js';

const TTL = 300;            // 5 min
const RL_WINDOW = 3600;     // 1 h
const RL_MAX = 5;           // requests per mobile per window

const codeKey = (mobile: string) => `otp:code:${mobile}`;
const rlKey = (mobile: string) => `otp:rl:${mobile}`;

function gen(): string {
  if (env.isDev) return '123456';
  const n = Math.floor(100000 + (globalThis.crypto.getRandomValues(new Uint32Array(1))[0]! % 900000));
  return String(n);
}

export async function requestOtp(mobile: string): Promise<{ devCode?: string }> {
  const count = await redis.incr(rlKey(mobile));
  if (count === 1) await redis.expire(rlKey(mobile), RL_WINDOW);
  if (count > RL_MAX) throw Object.assign(new Error('rate_limited'), { code: 'rate_limited' });

  const code = gen();
  await redis.set(codeKey(mobile), code, 'EX', TTL);
  return env.isDev ? { devCode: code } : {};
}

export async function verifyOtp(mobile: string, code: string): Promise<boolean> {
  const stored = await redis.get(codeKey(mobile));
  if (!stored || stored !== code.trim()) return false;
  await redis.del(codeKey(mobile));
  return true;
}

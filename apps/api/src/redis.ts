import { Redis } from 'ioredis';
import { env } from './env.js';

// Per-LGU key namespace: lets multiple SP deployments safely share one Redis
// server/index — session + OTP keys are otherwise tenant-agnostic and would
// collide (OTP is keyed by mobile number). Isolation no longer depends on each
// deployment being handed a distinct Redis DB index.
export const redis = new Redis(env.redisUrl, {
  lazyConnect: false,
  maxRetriesPerRequest: 2,
  keyPrefix: `sp:${env.defaultTenant}:`,
});

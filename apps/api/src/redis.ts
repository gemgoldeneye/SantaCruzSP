import { Redis } from 'ioredis';
import { santaCruzConfig } from '@lgu/santacruz';
import { env } from './env.js';

// Per-deployment key namespace: lets multiple SP deployments safely share one
// Redis server/index — session + OTP keys are otherwise deployment-agnostic and
// would collide (OTP is keyed by mobile number). The prefix is the config's
// deployment-id label (one DB per municipality — there is no tenant concept).
export const redis = new Redis(env.redisUrl, {
  lazyConnect: false,
  maxRetriesPerRequest: 2,
  keyPrefix: `sp:${santaCruzConfig.tenant.tenantId}:`,
});

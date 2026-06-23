import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env.js';
import * as schema from '@gelabs/sp/data';

export const sql = postgres(env.databaseUrl, { max: 10 });
export const db = drizzle(sql, { schema });
export type Db = typeof db;

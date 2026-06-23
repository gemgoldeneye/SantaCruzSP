// Drizzle-kit schema entry for this consumer. The actual table model lives in the
// SDK (`@gelabs/sp/data`, same module `apps/api/src/db/client.ts` connects with);
// re-export it so `drizzle.config.ts` (schema: ./src/db/schema.ts) + `drizzle-kit
// generate` resolve the SDK tables. Migrations are applied from ./drizzle/*.sql.
export * from '@gelabs/sp/data';

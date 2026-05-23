import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core';

// Distributed token revocation store — enables stateless JWT invalidation
// without shared session state. Periodic TTL-based cleanup via setInterval.
export const tokenBlocklist = pgTable('token_blocklist', {
  jti:       varchar('jti', { length: 36 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
});

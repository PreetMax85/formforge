import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const sessions = pgTable('sessions', {
  id:           uuid('id').defaultRandom().primaryKey(),
  userId:       uuid('user_id').notNull()
                  .references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull().unique(),
  userAgent:    text('user_agent'),
  expiresAt:    timestamp('expires_at').notNull(),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
});
